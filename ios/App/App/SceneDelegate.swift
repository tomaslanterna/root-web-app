import UIKit
import Capacitor
import CoreMotion
import CoreLocation
import ActivityKit

@objc(NativePedometerPlugin)
public class NativePedometerPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "NativePedometerPlugin"
    public let jsName = "NativePedometer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "querySteps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startLiveUpdates", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopLiveUpdates", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncLiveActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopLiveActivity", returnType: CAPPluginReturnPromise)
    ]

    override public func load() {
        DispatchQueue.main.async { [weak self] in
            self?.bridge?.webView?.scrollView.showsVerticalScrollIndicator = false
            self?.bridge?.webView?.scrollView.showsHorizontalScrollIndicator = false
        }
    }

    private let pedometer = CMPedometer()
    private var bgLocationManager: CLLocationManager?
    private var nativeWidgetStepTimer: Timer?
    private var cachedThumbnailUrl: String?
    private var cachedThumbnailBase64: String?
    private var latestLiveActivityState: (
        eventId: String,
        mode: String,
        headerTitle: String,
        stepsCount: Int,
        subtitle: String,
        footerLabel: String,
        eventStartEpochMs: Double
    )?

    private let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private let fallbackFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    private func parseISO(_ raw: String?) -> Date? {
        guard let raw = raw else { return nil }
        return isoFormatter.date(from: raw) ?? fallbackFormatter.date(from: raw)
    }

    private func fetchCompressedThumbnailBase64(from urlString: String?) async -> String? {
        guard let urlString = urlString, !urlString.isEmpty, let url = URL(string: urlString) else {
            return nil
        }
        if cachedThumbnailUrl == urlString, let cached = cachedThumbnailBase64 {
            return cached
        }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let image = UIImage(data: data) else { return nil }
            let targetSize = CGSize(width: 64, height: 64)
            let format = UIGraphicsImageRendererFormat()
            format.scale = 1.0
            format.opaque = true
            let renderer = UIGraphicsImageRenderer(size: targetSize, format: format)
            let resized = renderer.image { _ in
                // Aspect-fill center crop to 64x64 @1x
                let imgSize = image.size
                let scale = max(targetSize.width / max(1, imgSize.width), targetSize.height / max(1, imgSize.height))
                let scaledW = imgSize.width * scale
                let scaledH = imgSize.height * scale
                let drawRect = CGRect(
                    x: (targetSize.width - scaledW) / 2.0,
                    y: (targetSize.height - scaledH) / 2.0,
                    width: scaledW,
                    height: scaledH
                )
                image.draw(in: drawRect)
            }
            for quality in [0.55, 0.42, 0.30, 0.20] {
                if let jpegData = resized.jpegData(compressionQuality: quality),
                   jpegData.count <= 2400 {
                    let b64 = jpegData.base64EncodedString()
                    cachedThumbnailUrl = urlString
                    cachedThumbnailBase64 = b64
                    return b64
                }
            }
            return nil
        } catch {
            return nil
        }
    }

    @available(iOS 16.2, *)
    private func pushLiveStepsToLockScreen(_ newSensorSteps: Int) {
        guard var current = latestLiveActivityState, current.mode == "dancing" else { return }
        let updatedSteps = max(current.stepsCount, newSensorSteps)
        guard updatedSteps != current.stepsCount else { return }
        current.stepsCount = updatedSteps
        latestLiveActivityState = current

        let contentState = RootLiveEventAttributes.ContentState(
            mode: current.mode,
            headerTitle: current.headerTitle,
            stepsCount: updatedSteps,
            subtitle: current.subtitle,
            footerLabel: current.footerLabel,
            eventStartEpochMs: current.eventStartEpochMs,
            thumbnailBase64: cachedThumbnailBase64
        )
        Task {
            for activity in Activity<RootLiveEventAttributes>.activities where activity.attributes.eventId == current.eventId {
                await activity.update(ActivityContent(state: contentState, staleDate: nil, relevanceScore: 100.0))
            }
        }
    }

    private func startBackgroundStepLoopForWidget(eventStartDate: Date) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            // Mantener viva la ejecución en background con pantalla bloqueada mientras está en el evento
            if self.bgLocationManager == nil {
                let mgr = CLLocationManager()
                mgr.delegate = self
                mgr.desiredAccuracy = kCLLocationAccuracyHundredMeters
                mgr.distanceFilter = 50
                mgr.allowsBackgroundLocationUpdates = true
                mgr.pausesLocationUpdatesAutomatically = false
                self.bgLocationManager = mgr
            }
            self.bgLocationManager?.startUpdatingLocation()

            // Timer nativo en Swift que consulta CMPedometer cada 4s y actualiza el Widget en la pantalla de bloqueo
            self.nativeWidgetStepTimer?.invalidate()
            self.nativeWidgetStepTimer = Timer.scheduledTimer(withTimeInterval: 4.0, repeats: true) { [weak self] _ in
                guard let self = self,
                      let current = self.latestLiveActivityState,
                      current.mode == "dancing",
                      CMPedometer.isStepCountingAvailable() else {
                    return
                }
                let start = Date(timeIntervalSince1970: current.eventStartEpochMs / 1000.0)
                let now = Date()
                guard now > start else { return }
                self.pedometer.queryPedometerData(from: start, to: now) { [weak self] data, error in
                    guard let self = self, error == nil, let data = data else { return }
                    let steps = data.numberOfSteps.intValue
                    if #available(iOS 16.2, *) {
                        self.pushLiveStepsToLockScreen(steps)
                    }
                    // Notificar también al WebView por si está activo o acaba de volver al foreground
                    self.notifyListeners("pedometerUpdate", data: [
                        "steps": steps,
                        "distanceMeters": data.distance?.doubleValue ?? 0,
                        "startDate": self.isoFormatter.string(from: data.startDate),
                        "endDate": self.isoFormatter.string(from: data.endDate)
                    ])
                }
            }
        }
    }

    private func stopBackgroundStepLoopForWidget() {
        DispatchQueue.main.async { [weak self] in
            self?.nativeWidgetStepTimer?.invalidate()
            self?.nativeWidgetStepTimer = nil
            self?.bgLocationManager?.stopUpdatingLocation()
        }
    }

    @objc func querySteps(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else {
            call.resolve([
                "available": false,
                "steps": 0,
                "reason": "CMPedometer step counting not available on this device"
            ])
            return
        }

        let startDate = parseISO(call.getString("startDate")) ?? Date().addingTimeInterval(-3600)
        let endDate = parseISO(call.getString("endDate")) ?? Date()

        pedometer.queryPedometerData(from: startDate, to: endDate) { [weak self] data, error in
            DispatchQueue.main.async {
                if let error = error {
                    call.reject(error.localizedDescription, nil, error)
                    return
                }
                let steps = data?.numberOfSteps.intValue ?? 0
                let distance = data?.distance?.doubleValue ?? 0
                if #available(iOS 16.2, *) {
                    self?.pushLiveStepsToLockScreen(steps)
                }
                call.resolve([
                    "available": true,
                    "steps": steps,
                    "distanceMeters": distance,
                    "startDate": self?.isoFormatter.string(from: data?.startDate ?? startDate) ?? "",
                    "endDate": self?.isoFormatter.string(from: data?.endDate ?? endDate) ?? "",
                    "authStatus": CMPedometer.authorizationStatus().rawValue
                ])
            }
        }
    }

    @objc func startLiveUpdates(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else {
            call.resolve(["available": false, "started": false])
            return
        }
        let startDate = parseISO(call.getString("startDate")) ?? Date()
        pedometer.stopUpdates()
        pedometer.startUpdates(from: startDate) { [weak self] data, error in
            guard let self = self else { return }
            if let error = error {
                self.notifyListeners("pedometerError", data: ["message": error.localizedDescription])
                return
            }
            guard let data = data else { return }
            let liveSteps = data.numberOfSteps.intValue
            if #available(iOS 16.2, *) {
                self.pushLiveStepsToLockScreen(liveSteps)
            }
            self.notifyListeners("pedometerUpdate", data: [
                "steps": liveSteps,
                "distanceMeters": data.distance?.doubleValue ?? 0,
                "startDate": self.isoFormatter.string(from: data.startDate),
                "endDate": self.isoFormatter.string(from: data.endDate)
            ])
        }
        call.resolve(["available": true, "started": true])
    }

    @objc func stopLiveUpdates(_ call: CAPPluginCall) {
        pedometer.stopUpdates()
        call.resolve(["stopped": true])
    }

    @objc func syncLiveActivity(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.resolve(["supported": false, "reason": "iOS 16.2+ required"])
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.resolve(["supported": false, "reason": "Live Activities disabled in iOS Settings"])
            return
        }

        let eventId = call.getString("eventId") ?? ""
        let eventTitle = call.getString("eventTitle") ?? "Evento Root"
        let startHourLabel = call.getString("startHourLabel") ?? "23:59"
        let venueLabel = call.getString("venueLabel") ?? eventTitle
        let bannerUrl = call.getString("bannerUrl")
        let mode = call.getString("mode") ?? "before_start"
        let headerTitle = call.getString("headerTitle") ?? "¡Es hoy! Tu evento de hoy"
        let requestedSteps = call.getInt("stepsCount") ?? 0
        let subtitle = call.getString("subtitle") ?? ""
        let footerLabel = call.getString("footerLabel") ?? "Ver detalles del evento"
        let eventStartEpochMs = call.getDouble("eventStartEpochMs") ?? (Date().timeIntervalSince1970 * 1000.0)

        let previousSteps = (latestLiveActivityState?.eventId == eventId) ? (latestLiveActivityState?.stepsCount ?? 0) : 0
        let safeSteps = max(requestedSteps, previousSteps)

        latestLiveActivityState = (
            eventId: eventId,
            mode: mode,
            headerTitle: headerTitle,
            stepsCount: safeSteps,
            subtitle: subtitle,
            footerLabel: footerLabel,
            eventStartEpochMs: eventStartEpochMs
        )

        if mode == "dancing" {
            let startDate = Date(timeIntervalSince1970: eventStartEpochMs / 1000.0)
            startBackgroundStepLoopForWidget(eventStartDate: startDate)
        } else {
            stopBackgroundStepLoopForWidget()
        }

        let contentState = RootLiveEventAttributes.ContentState(
            mode: mode,
            headerTitle: headerTitle,
            stepsCount: safeSteps,
            subtitle: subtitle,
            footerLabel: footerLabel,
            eventStartEpochMs: eventStartEpochMs
        )

        Task {
            let thumbB64 = await self.fetchCompressedThumbnailBase64(from: bannerUrl)
            let contentStateWithThumb = RootLiveEventAttributes.ContentState(
                mode: mode,
                headerTitle: headerTitle,
                stepsCount: safeSteps,
                subtitle: subtitle,
                footerLabel: footerLabel,
                eventStartEpochMs: eventStartEpochMs,
                thumbnailBase64: thumbB64
            )

            let existing = Activity<RootLiveEventAttributes>.activities.first(where: { $0.attributes.eventId == eventId })
            if let existing = existing {
                await existing.update(ActivityContent(state: contentStateWithThumb, staleDate: nil, relevanceScore: 100.0))
                DispatchQueue.main.async {
                    call.resolve(["supported": true, "updated": true, "activityId": existing.id, "hasThumbnail": thumbB64 != nil])
                }
                return
            }

            // Finalizar cualquier Live Activity vieja de otro evento
            for old in Activity<RootLiveEventAttributes>.activities {
                await old.end(nil, dismissalPolicy: .immediate)
            }

            let attributes = RootLiveEventAttributes(
                eventId: eventId,
                eventTitle: eventTitle,
                startHourLabel: startHourLabel,
                venueLabel: venueLabel,
                thumbnailBase64: thumbB64
            )

            do {
                let activity = try Activity.request(
                    attributes: attributes,
                    content: ActivityContent(state: contentStateWithThumb, staleDate: nil, relevanceScore: 100.0),
                    pushType: nil
                )
                DispatchQueue.main.async {
                    call.resolve(["supported": true, "started": true, "activityId": activity.id, "hasThumbnail": thumbB64 != nil])
                }
            } catch {
                DispatchQueue.main.async {
                    call.reject("Error iniciando Live Activity: \(error.localizedDescription)", nil, error)
                }
            }
        }
    }

    @objc func stopLiveActivity(_ call: CAPPluginCall) {
        latestLiveActivityState = nil
        stopBackgroundStepLoopForWidget()
        guard #available(iOS 16.2, *) else {
            call.resolve(["stopped": true])
            return
        }
        Task {
            for activity in Activity<RootLiveEventAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
            DispatchQueue.main.async {
                call.resolve(["stopped": true])
            }
        }
    }
}

class RootBridgeViewController: CAPBridgeViewController {
    private var verticalIndicatorObservation: NSKeyValueObservation?
    private var horizontalIndicatorObservation: NSKeyValueObservation?

    private func hideNativeScrollIndicators() {
        guard let scrollView = webView?.scrollView else { return }
        scrollView.showsVerticalScrollIndicator = false
        scrollView.showsHorizontalScrollIndicator = false

        if verticalIndicatorObservation == nil {
            verticalIndicatorObservation = scrollView.observe(\.showsVerticalScrollIndicator, options: [.new]) { sv, _ in
                if sv.showsVerticalScrollIndicator {
                    sv.showsVerticalScrollIndicator = false
                }
            }
        }
        if horizontalIndicatorObservation == nil {
            horizontalIndicatorObservation = scrollView.observe(\.showsHorizontalScrollIndicator, options: [.new]) { sv, _ in
                if sv.showsHorizontalScrollIndicator {
                    sv.showsHorizontalScrollIndicator = false
                }
            }
        }
    }

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(NativePedometerPlugin())
        hideNativeScrollIndicators()
    }

    override open func viewDidLoad() {
        super.viewDidLoad()
        hideNativeScrollIndicators()
    }

    override open func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        hideNativeScrollIndicators()
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = RootBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

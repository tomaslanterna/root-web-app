import ActivityKit
import WidgetKit
import SwiftUI
import UIKit

@available(iOS 16.2, *)
private func decodeEventThumbnail(stateB64: String?, attrB64: String?) -> UIImage? {
    let raw = stateB64 ?? attrB64
    guard let b64 = raw, !b64.isEmpty, let data = Data(base64Encoded: b64) else {
        return nil
    }
    return UIImage(data: data)
}

@available(iOS 16.2, *)
struct RootLiveEventLockScreenView: View {
    let attributes: RootLiveEventAttributes
    let state: RootLiveEventAttributes.ContentState

    private let cardBg = Color(red: 20.0 / 255.0, green: 20.0 / 255.0, blue: 22.0 / 255.0) // #141416
    private let obsidianBg = Color(red: 11.0 / 255.0, green: 13.0 / 255.0, blue: 16.0 / 255.0) // #0B0D10
    private let limeAcid = Color(red: 212.0 / 255.0, green: 1.0, blue: 0.0) // #D4FF00
    private let liveRed = Color(red: 255.0 / 255.0, green: 90.0 / 255.0, blue: 54.0 / 255.0) // #FF5A36
    private let subtitleGray = Color(red: 142.0 / 255.0, green: 142.0 / 255.0, blue: 147.0 / 255.0) // #8E8E93
    private let lineBorder = Color(red: 36.0 / 255.0, green: 36.0 / 255.0, blue: 40.0 / 255.0) // #242428

    private var formattedSteps: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.groupingSeparator = "."
        return formatter.string(from: NSNumber(value: state.stepsCount)) ?? "\(state.stepsCount)"
    }

    private var startDate: Date {
        Date(timeIntervalSince1970: state.eventStartEpochMs / 1000.0)
    }

    private var thumbnailImage: UIImage? {
        decodeEventThumbnail(stateB64: state.thumbnailBase64, attrB64: attributes.thumbnailBase64)
    }

    var body: some View {
        HStack(alignment: .center, spacing: 10) {
            // 1. Flyer cuadrado compacto
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(obsidianBg)

                if let uiImage = thumbnailImage {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                } else {
                    Image(systemName: "sparkles")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(limeAcid)
                }
            }
            .frame(width: 44, height: 44)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            // 2. Info central
            VStack(alignment: .leading, spacing: 2) {
                if state.mode == "dancing" {
                    // Estado 3 (Cuando ya ingresó): punto rojo con "En vivo" y abajo el nombre
                    HStack(spacing: 4) {
                        Circle()
                            .fill(liveRed)
                            .frame(width: 6, height: 6)
                        Text("EN VIVO")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(liveRed)
                    }

                    Text(attributes.eventTitle.uppercased())
                        .font(.system(size: 13, weight: .black))
                        .foregroundColor(.white)
                        .lineLimit(1)
                } else if state.mode == "started_away" {
                    // Estado 2 (Ya arrancó pero no está ahí): solo el nombre del evento (sin hora, sin textos debajo)
                    Text(attributes.eventTitle.uppercased())
                        .font(.system(size: 13, weight: .black))
                        .foregroundColor(.white)
                        .lineLimit(1)
                } else {
                    // Estado 1 (Antes de ir a la fiesta): hora tal cual está ahora y abajo el nombre
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(limeAcid)
                        Text(attributes.startHourLabel)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                    }

                    Text(attributes.eventTitle.uppercased())
                        .font(.system(size: 13, weight: .black))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            // 3. Lado derecho
            HStack(spacing: 5) {
                if state.mode == "dancing" {
                    // Estado 3: pasos con la palabra "pasos" abajo y al lado un chevron hacia la derecha
                    VStack(alignment: .trailing, spacing: 0) {
                        Text(formattedSteps)
                            .font(.system(size: 18, weight: .black, design: .default).italic())
                            .foregroundColor(limeAcid)
                        Text("PASOS")
                            .font(.system(size: 8, weight: .black))
                            .foregroundColor(subtitleGray)
                    }

                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(limeAcid.opacity(0.85))
                } else if state.mode == "started_away" {
                    // Estado 2: solo "¡No te lo pierdas!" donde estaba la cuenta regresiva en rojo
                    Text("¡NO TE LO PIERDAS!")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(liveRed)
                        .lineLimit(1)

                    Image(systemName: "chevron.right")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(liveRed.opacity(0.8))
                } else {
                    // Estado 1: cuenta regresiva bien ordenada
                    VStack(alignment: .trailing, spacing: 0) {
                        if startDate > Date() {
                            Text(timerInterval: Date()...startDate, countsDown: true)
                                .font(.system(size: 13, weight: .black).monospacedDigit())
                                .foregroundColor(limeAcid)
                                .multilineTextAlignment(.trailing)
                        } else {
                            Text("HOY")
                                .font(.system(size: 13, weight: .black))
                                .foregroundColor(limeAcid)
                        }

                        Text("COMIENZA EN")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(subtitleGray)
                    }

                    Image(systemName: "chevron.right")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(subtitleGray)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(cardBg)
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(lineBorder, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

@available(iOS 16.2, *)
@main
struct RootLiveActivityBundle: WidgetBundle {
    var body: some Widget {
        RootLiveActivityWidget()
    }
}

@available(iOS 16.2, *)
struct RootLiveActivityWidget: Widget {
    private let cardBg = Color(red: 20.0 / 255.0, green: 20.0 / 255.0, blue: 22.0 / 255.0)
    private let obsidianBg = Color(red: 11.0 / 255.0, green: 13.0 / 255.0, blue: 16.0 / 255.0)
    private let limeAcid = Color(red: 212.0 / 255.0, green: 1.0, blue: 0.0)
    private let liveRed = Color(red: 255.0 / 255.0, green: 90.0 / 255.0, blue: 54.0 / 255.0)
    private let subtitleGray = Color(red: 142.0 / 255.0, green: 142.0 / 255.0, blue: 147.0 / 255.0)

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RootLiveEventAttributes.self) { context in
            RootLiveEventLockScreenView(
                attributes: context.attributes,
                state: context.state
            )
            .widgetURL(URL(string: "root://events/\(context.attributes.eventId)"))
            .activityBackgroundTint(cardBg)
            .activitySystemActionForegroundColor(limeAcid)
        } dynamicIsland: { context in
            let thumb = decodeEventThumbnail(
                stateB64: context.state.thumbnailBase64,
                attrB64: context.attributes.thumbnailBase64
            )

            let startDate = Date(timeIntervalSince1970: context.state.eventStartEpochMs / 1000.0)
            let formattedSteps: String = {
                let formatter = NumberFormatter()
                formatter.numberStyle = .decimal
                formatter.groupingSeparator = "."
                return formatter.string(from: NSNumber(value: context.state.stepsCount)) ?? "\(context.state.stepsCount)"
            }()

            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    if context.state.mode == "dancing" {
                        HStack(spacing: 4) {
                            Circle().fill(liveRed).frame(width: 6, height: 6)
                            Text("EN VIVO")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(liveRed)
                        }
                        .padding(.leading, 4)
                    } else if context.state.mode == "started_away" {
                        HStack(spacing: 4) {
                            Circle().fill(liveRed).frame(width: 6, height: 6)
                            Text("ARRANCÓ")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(liveRed)
                        }
                        .padding(.leading, 4)
                    } else {
                        HStack(spacing: 3) {
                            Image(systemName: "clock")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(limeAcid)
                            Text(context.attributes.startHourLabel)
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                        }
                        .padding(.leading, 4)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.mode == "dancing" {
                        VStack(alignment: .trailing, spacing: 0) {
                            Text("\(formattedSteps)")
                                .font(.system(size: 14, weight: .black).italic())
                                .foregroundColor(limeAcid)
                            Text("PASOS")
                                .font(.system(size: 7, weight: .bold))
                                .foregroundColor(subtitleGray)
                        }
                        .padding(.trailing, 4)
                    } else if context.state.mode == "started_away" {
                        Text("¡NO TE LO PIERDAS!")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(liveRed)
                            .padding(.trailing, 4)
                    } else if startDate > Date() {
                        Text(timerInterval: Date()...startDate, countsDown: true)
                            .font(.system(size: 12, weight: .black).monospacedDigit())
                            .foregroundColor(limeAcid)
                            .padding(.trailing, 4)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack(alignment: .center, spacing: 8) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                .fill(obsidianBg)
                            if let uiImage = thumb {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .scaledToFill()
                            } else {
                                Image(systemName: "sparkles")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(limeAcid)
                            }
                        }
                        .frame(width: 36, height: 36)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                        Text(context.attributes.eventTitle.uppercased())
                            .font(.system(size: 12, weight: .black))
                            .foregroundColor(.white)
                            .lineLimit(1)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.horizontal, 4)
                }
            } compactLeading: {
                if let uiImage = thumb {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 20, height: 20)
                        .clipShape(Circle())
                        .padding(.leading, 4)
                } else if context.state.mode == "dancing" || context.state.mode == "started_away" {
                    Circle()
                        .fill(liveRed)
                        .frame(width: 8, height: 8)
                        .padding(.leading, 6)
                } else {
                    Image(systemName: "clock")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(limeAcid)
                        .padding(.leading, 4)
                }
            } compactTrailing: {
                if context.state.mode == "dancing" {
                    HStack(spacing: 2) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(limeAcid)
                        Text("\(context.state.stepsCount)")
                            .font(.system(size: 11, weight: .black).italic())
                            .foregroundColor(limeAcid)
                    }
                    .padding(.trailing, 4)
                } else if context.state.mode == "started_away" {
                    HStack(spacing: 2) {
                        Circle().fill(liveRed).frame(width: 5, height: 5)
                        Text("ARRANCÓ")
                            .font(.system(size: 9, weight: .black))
                            .foregroundColor(liveRed)
                    }
                    .padding(.trailing, 4)
                } else if startDate > Date() {
                    Text(timerInterval: Date()...startDate, countsDown: true)
                        .font(.system(size: 10, weight: .black).monospacedDigit())
                        .foregroundColor(limeAcid)
                        .padding(.trailing, 4)
                } else {
                    Text(context.attributes.startHourLabel)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.trailing, 4)
                }
            } minimal: {
                if let uiImage = thumb {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 20, height: 20)
                        .clipShape(Circle())
                } else if context.state.mode == "dancing" {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(limeAcid)
                } else if context.state.mode == "started_away" {
                    Circle()
                        .fill(liveRed)
                        .frame(width: 8, height: 8)
                } else {
                    Image(systemName: "sparkles")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(limeAcid)
                }
            }
            .widgetURL(URL(string: "root://events/\(context.attributes.eventId)"))
            .keylineTint(limeAcid)
        }
    }
}

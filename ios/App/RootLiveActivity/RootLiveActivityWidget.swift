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

/// Nombre del evento: una línea si entra; si no, hasta dos líneas, cortando entre palabras
/// (SwiftUI no parte una palabra salvo que sola no entre; en ese caso se achica la letra).
@available(iOS 16.2, *)
private struct RootEventTitle: View {
    let text: String

    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 16, weight: .black))
            .foregroundColor(.white)
            .lineLimit(2)
            .minimumScaleFactor(0.6)
            .multilineTextAlignment(.leading)
            .fixedSize(horizontal: false, vertical: true)
    }
}

@available(iOS 16.2, *)
struct RootLiveEventLockScreenView: View {
    let attributes: RootLiveEventAttributes
    let state: RootLiveEventAttributes.ContentState
    /// true cuando se muestra dentro de la Dynamic Island expandida: sin tarjeta propia (la isla ya es negra).
    var embedded: Bool = false

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
        HStack(alignment: .center, spacing: 14) {
            // 1. Flyer cuadrado compacto
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(obsidianBg)

                if let uiImage = thumbnailImage {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                } else {
                    Image(systemName: "sparkles")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(limeAcid)
                }
            }
            .frame(width: 68, height: 68)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

            // 2. Info central
            VStack(alignment: .leading, spacing: 4) {
                if state.mode == "dancing" {
                    // Estado 3 (Cuando ya ingresó): punto rojo con "En vivo" y abajo el nombre
                    HStack(spacing: 6) {
                        Circle()
                            .fill(liveRed)
                            .frame(width: 8, height: 8)
                        Text("EN VIVO")
                            .font(.system(size: 14, weight: .black))
                            .foregroundColor(liveRed)
                    }

                    RootEventTitle(text: attributes.eventTitle)
                } else if state.mode == "started_away" {
                    // Estado 2 (Ya arrancó pero no está ahí): solo el nombre del evento (sin hora, sin textos debajo)
                    RootEventTitle(text: attributes.eventTitle)
                } else {
                    // Estado 1 (Antes de ir a la fiesta): hora tal cual está ahora y abajo el nombre
                    HStack(spacing: 6) {
                        Image(systemName: "clock")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(limeAcid)
                        Text(attributes.startHourLabel)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                    }

                    RootEventTitle(text: attributes.eventTitle)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            // 3. Lado derecho
            HStack(spacing: 8) {
                if state.mode == "dancing" {
                    // Estado 3: pasos con la palabra "pasos" abajo y al lado un chevron hacia la derecha
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(formattedSteps)
                            .font(.system(size: 26, weight: .black, design: .default).italic())
                            .foregroundColor(limeAcid)
                        Text("PASOS")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(subtitleGray)
                    }

                    Image(systemName: "chevron.right")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(limeAcid.opacity(0.85))
                } else if state.mode == "started_away" {
                    // Estado 2: solo "¡No te lo pierdas!" donde estaba la cuenta regresiva en rojo
                    Text("¡NO TE\nLO PIERDAS!")
                        .font(.system(size: 14, weight: .black))
                        .foregroundColor(liveRed)
                        .multilineTextAlignment(.trailing)
                        .lineLimit(2)
                        .fixedSize(horizontal: true, vertical: false)

                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(liveRed.opacity(0.8))
                } else {
                    // Estado 1: cuenta regresiva bien ordenada
                    VStack(alignment: .trailing, spacing: 2) {
                        if startDate > Date() {
                            Text(timerInterval: Date()...startDate, countsDown: true)
                                .font(.system(size: 18, weight: .black).monospacedDigit())
                                .foregroundColor(limeAcid)
                                .multilineTextAlignment(.trailing)
                        } else {
                            Text("HOY")
                                .font(.system(size: 18, weight: .black))
                                .foregroundColor(limeAcid)
                        }

                        Text("COMIENZA EN")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(subtitleGray)
                    }

                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(subtitleGray)
                }
            }
            .layoutPriority(1)
        }
        .padding(.horizontal, embedded ? 4 : 18)
        .padding(.vertical, embedded ? 6 : 16)
        .frame(maxWidth: .infinity)
        .background(embedded ? Color.clear : cardBg)
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(embedded ? Color.clear : lineBorder, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
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

            return DynamicIsland {
                // Expandida = mismo diseño que la pantalla de bloqueo, ocupando todo el ancho.
                DynamicIslandExpandedRegion(.bottom) {
                    RootLiveEventLockScreenView(
                        attributes: context.attributes,
                        state: context.state,
                        embedded: true
                    )
                }
            } compactLeading: {
                // Lado izquierdo: la imagen del evento (cuadrado redondeado), pegada a la isla.
                ZStack {
                    RoundedRectangle(cornerRadius: 7, style: .continuous)
                        .fill(obsidianBg)
                    if let uiImage = thumb {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFill()
                    } else {
                        Image(systemName: "sparkles")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(limeAcid)
                    }
                }
                .frame(width: 24, height: 24)
                .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
            } compactTrailing: {
                // Lado derecho: un dato corto y de ancho fijo para que la isla cerrada
                // no sobresalga casi nada de la Dynamic Island.
                if context.state.mode == "dancing" {
                    Text("\(context.state.stepsCount)")
                        .font(.system(size: 10, weight: .black).italic())
                        .foregroundColor(limeAcid)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                        .frame(maxWidth: 34, alignment: .trailing)
                } else if context.state.mode == "started_away" {
                    Text("¡YA!")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(liveRed)
                        .lineLimit(1)
                        .fixedSize()
                } else if startDate > Date() {
                    // El texto con timerInterval se estira a todo el ancho disponible: ancho fijo.
                    Text(timerInterval: Date()...startDate, countsDown: true)
                        .font(.system(size: 9, weight: .black).monospacedDigit())
                        .foregroundColor(limeAcid)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .frame(width: 38, alignment: .trailing)
                } else {
                    Text(context.attributes.startHourLabel)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .frame(maxWidth: 38, alignment: .trailing)
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

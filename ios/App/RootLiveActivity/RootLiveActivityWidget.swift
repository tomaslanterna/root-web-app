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
        VStack(alignment: .leading, spacing: 0) {
            // 1. Header superior
            HStack(alignment: .center, spacing: 6) {
                if state.mode == "dancing" || state.mode == "started_away" {
                    Circle()
                        .fill(liveRed)
                        .frame(width: 8, height: 8)
                    Text("EN VIVO")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(liveRed)
                        .lineLimit(1)
                } else {
                    Image(systemName: "sparkles")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(limeAcid)
                    Text("TU EVENTO DE HOY")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }

                Spacer(minLength: 4)

                // Texto superior derecho (sin tag / cápsula)
                if state.mode == "dancing" {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(limeAcid)
                        Text("A LA PISTA A BAILAR")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(limeAcid)
                    }
                } else if state.mode == "before_start" && startDate > Date() {
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(limeAcid)
                        Text("ARRANCA EN")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(limeAcid)
                        Text(timerInterval: Date()...startDate, countsDown: true)
                            .font(.system(size: 11, weight: .black).monospacedDigit())
                            .foregroundColor(limeAcid)
                    }
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin.and.ellipse")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(liveRed)
                        Text("¡NO TE OLVIDES DE IR!")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(liveRed)
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.top, 10)
            .padding(.bottom, 6)

            // 2. Cuerpo central: Flyer + Info + Pasos
            HStack(alignment: .center, spacing: 10) {
                // Flyer cuadrado compacto
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(obsidianBg)

                    if let uiImage = thumbnailImage {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFill()
                    } else {
                        Image(systemName: "sparkles")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(limeAcid)
                    }
                }
                .frame(width: 58, height: 58)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                // Info central
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(limeAcid)
                        Text(attributes.startHourLabel)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                        if state.mode == "started_away" {
                            Text("· ¡ARRANCÓ!")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(liveRed)
                        }
                    }

                    Text(attributes.eventTitle.uppercased())
                        .font(.system(size: 14, weight: .black))
                        .foregroundColor(.white)
                        .lineLimit(1)

                    if !state.subtitle.isEmpty {
                        Text(state.subtitle.uppercased())
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(subtitleGray)
                            .lineLimit(1)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // Columna derecha: Métrica de pasos o estado
                if state.mode == "dancing" {
                    VStack(alignment: .trailing, spacing: 1) {
                        HStack(alignment: .firstTextBaseline, spacing: 3) {
                            Text(formattedSteps)
                                .font(.system(size: 24, weight: .black, design: .default).italic())
                                .foregroundColor(limeAcid)
                            Text("PASOS")
                                .font(.system(size: 10, weight: .black).italic())
                                .foregroundColor(limeAcid.opacity(0.85))
                        }
                        Text("EN LA PISTA")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(subtitleGray)
                    }
                } else if state.mode == "started_away" {
                    VStack(alignment: .trailing, spacing: 1) {
                        if state.stepsCount > 0 {
                            HStack(alignment: .firstTextBaseline, spacing: 3) {
                                Text(formattedSteps)
                                    .font(.system(size: 20, weight: .black, design: .default).italic())
                                    .foregroundColor(liveRed)
                                Text("PASOS")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(liveRed.opacity(0.85))
                            }
                            Text("ANDÁ A LA PISTA")
                                .font(.system(size: 8, weight: .bold))
                                .foregroundColor(subtitleGray)
                        } else {
                            Text("ANDÁ")
                                .font(.system(size: 16, weight: .black).italic())
                                .foregroundColor(liveRed)
                            Text("A LA FIESTA")
                                .font(.system(size: 8, weight: .bold))
                                .foregroundColor(subtitleGray)
                        }
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 4)

            // 3. Footer inferior de acción (sin borde separador)
            HStack(spacing: 5) {
                Spacer()
                if state.mode == "dancing" {
                    Image(systemName: "figure.dance")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(limeAcid)
                    Text(state.footerLabel)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(subtitleGray)
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(subtitleGray)
                } else if state.mode == "started_away" {
                    Image(systemName: "mappin.and.ellipse")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(liveRed)
                    Text(state.footerLabel)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(subtitleGray)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(subtitleGray)
                } else {
                    Image(systemName: "ticket")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(limeAcid)
                    Text(state.footerLabel)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(subtitleGray)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(subtitleGray)
                }
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.top, 4)
            .padding(.bottom, 10)
        }
        .background(cardBg)
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(lineBorder, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
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
                    if context.state.mode == "dancing" || context.state.mode == "started_away" {
                        HStack(spacing: 4) {
                            Circle().fill(liveRed).frame(width: 6, height: 6)
                            Text("EN VIVO")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(liveRed)
                        }
                        .padding(.leading, 4)
                    } else {
                        HStack(spacing: 3) {
                            Image(systemName: "sparkles")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(limeAcid)
                            Text("TU EVENTO")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.white)
                        }
                        .padding(.leading, 4)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.mode == "dancing" {
                        HStack(spacing: 3) {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(limeAcid)
                            Text("A LA PISTA A BAILAR")
                                .font(.system(size: 9, weight: .black))
                                .foregroundColor(limeAcid)
                        }
                        .padding(.trailing, 4)
                    } else if context.state.mode == "before_start" && startDate > Date() {
                        HStack(spacing: 3) {
                            Image(systemName: "clock")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(limeAcid)
                            Text("ARRANCA EN")
                                .font(.system(size: 9, weight: .black))
                                .foregroundColor(limeAcid)
                            Text(timerInterval: Date()...startDate, countsDown: true)
                                .font(.system(size: 9, weight: .black).monospacedDigit())
                                .foregroundColor(limeAcid)
                        }
                        .padding(.trailing, 4)
                    } else {
                        HStack(spacing: 3) {
                            Image(systemName: "mappin.and.ellipse")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(liveRed)
                            Text("¡NO TE OLVIDES DE IR!")
                                .font(.system(size: 9, weight: .black))
                                .foregroundColor(liveRed)
                        }
                        .padding(.trailing, 4)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(alignment: .center, spacing: 10) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .fill(obsidianBg)
                                if let uiImage = thumb {
                                    Image(uiImage: uiImage)
                                        .resizable()
                                        .scaledToFill()
                                } else {
                                    Image(systemName: "sparkles")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundColor(limeAcid)
                                }
                            }
                            .frame(width: 48, height: 48)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 4) {
                                    Image(systemName: "clock")
                                        .font(.system(size: 9, weight: .bold))
                                        .foregroundColor(limeAcid)
                                    Text(context.attributes.startHourLabel)
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(.white)
                                }

                                Text(context.attributes.eventTitle.uppercased())
                                    .font(.system(size: 12, weight: .black))
                                    .foregroundColor(.white)
                                    .lineLimit(1)

                                if !context.state.subtitle.isEmpty {
                                    Text(context.state.subtitle.uppercased())
                                        .font(.system(size: 9, weight: .medium))
                                        .foregroundColor(subtitleGray)
                                        .lineLimit(1)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)

                            if context.state.mode == "dancing" {
                                VStack(alignment: .trailing, spacing: 0) {
                                    Text("\(formattedSteps)")
                                        .font(.system(size: 18, weight: .black).italic())
                                        .foregroundColor(limeAcid)
                                    Text("PASOS")
                                        .font(.system(size: 8, weight: .bold))
                                        .foregroundColor(subtitleGray)
                                }
                            }
                        }

                        HStack(spacing: 5) {
                            Spacer()
                            if context.state.mode == "dancing" {
                                Image(systemName: "figure.dance")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(limeAcid)
                            } else {
                                Image(systemName: "ticket")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(limeAcid)
                            }
                            Text(context.state.footerLabel)
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(subtitleGray)
                            Spacer()
                        }
                    }
                    .padding(.horizontal, 4)
                    .padding(.top, 2)
                    .padding(.bottom, 4)
                }
            } compactLeading: {
                if let uiImage = thumb {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 20, height: 20)
                        .clipShape(Circle())
                        .padding(.leading, 4)
                } else {
                    Image(systemName: "sparkles")
                        .foregroundColor(limeAcid)
                        .padding(.leading, 4)
                }
            } compactTrailing: {
                if context.state.mode == "dancing" {
                    Text("\(context.state.stepsCount)")
                        .font(.system(size: 12, weight: .black).italic())
                        .foregroundColor(limeAcid)
                        .padding(.trailing, 4)
                } else {
                    Text(context.attributes.startHourLabel)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(limeAcid)
                        .padding(.trailing, 4)
                }
            } minimal: {
                if let uiImage = thumb {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 20, height: 20)
                        .clipShape(Circle())
                } else {
                    Image(systemName: "sparkles")
                        .foregroundColor(limeAcid)
                }
            }
            .widgetURL(URL(string: "root://events/\(context.attributes.eventId)"))
            .keylineTint(limeAcid)
        }
    }
}

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

    private let cardBg = Color(red: 17.0 / 255.0, green: 17.0 / 255.0, blue: 20.0 / 255.0) // #111114
    private let obsidianBg = Color(red: 11.0 / 255.0, green: 13.0 / 255.0, blue: 16.0 / 255.0) // #0B0D10
    private let limeAcid = Color(red: 212.0 / 255.0, green: 1.0, blue: 0.0) // #D4FF00
    private let subtitleGray = Color(red: 163.0 / 255.0, green: 163.0 / 255.0, blue: 163.0 / 255.0)

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
            // 1. Header superior (igual a LiveEventBanner.tsx)
            HStack(alignment: .center, spacing: 8) {
                Text(state.headerTitle.uppercased())
                    .font(.system(size: 12, weight: .black))
                    .foregroundColor(.white)
                    .lineLimit(1)
                    .layoutPriority(1)

                Spacer(minLength: 4)

                // Badge amarillo ácido (#D4FF00)
                Group {
                    if state.mode == "before_start" && startDate > Date() {
                        HStack(spacing: 3) {
                            Text("ARRANCA EN")
                                .font(.system(size: 10, weight: .black))
                                .fixedSize()
                            Text(timerInterval: Date()...startDate, countsDown: true)
                                .font(.system(size: 10, weight: .black).monospacedDigit())
                                .multilineTextAlignment(.leading)
                                .frame(width: 46, alignment: .leading)
                        }
                        .fixedSize()
                    } else if state.mode == "dancing" {
                        Text("\(formattedSteps) PASOS")
                            .font(.system(size: 10, weight: .black))
                            .fixedSize()
                    } else {
                        Text("¡NO TE OLVIDES DE IR!")
                            .font(.system(size: 10, weight: .black))
                            .fixedSize()
                    }
                }
                .foregroundColor(Color(red: 0.04, green: 0.04, blue: 0.04))
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(limeAcid)
                .clipShape(Capsule())
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
            .padding(.bottom, 6)

            // 2. Cuerpo central con flyer cuadrado e info
            HStack(alignment: .center, spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
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
                .frame(width: 74, height: 74)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 5) {
                        Image(systemName: "clock")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(limeAcid)
                        Text(attributes.startHourLabel)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }

                    Text(attributes.eventTitle.uppercased())
                        .font(.system(size: 15, weight: .black))
                        .foregroundColor(.white)
                        .lineLimit(1)

                    Text(state.subtitle.uppercased())
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundColor(subtitleGray)
                        .lineLimit(1)

                    HStack(spacing: 5) {
                        Image(systemName: "music.note")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(limeAcid)
                        Text(attributes.venueLabel)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(Color(white: 0.9))
                            .lineLimit(1)
                    }
                    .padding(.horizontal, 9)
                    .padding(.vertical, 3)
                    .background(obsidianBg)
                    .clipShape(Capsule())
                    .padding(.top, 2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 6)

            // 3. Barra inferior de acción
            HStack(spacing: 6) {
                Spacer()
                Image(systemName: "ticket")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(limeAcid)
                Text(state.footerLabel)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white)
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.top, 4)
            .padding(.bottom, 12)
        }
        .background(cardBg)
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
    private let cardBg = Color(red: 17.0 / 255.0, green: 17.0 / 255.0, blue: 20.0 / 255.0)
    private let obsidianBg = Color(red: 11.0 / 255.0, green: 13.0 / 255.0, blue: 16.0 / 255.0)
    private let limeAcid = Color(red: 212.0 / 255.0, green: 1.0, blue: 0.0)

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
                    Text(context.state.headerTitle.uppercased())
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Group {
                        if context.state.mode == "before_start" && startDate > Date() {
                            HStack(spacing: 3) {
                                Text("ARRANCA EN")
                                    .font(.system(size: 9, weight: .black))
                                    .fixedSize()
                                Text(timerInterval: Date()...startDate, countsDown: true)
                                    .font(.system(size: 9, weight: .black).monospacedDigit())
                                    .multilineTextAlignment(.leading)
                                    .frame(width: 42, alignment: .leading)
                            }
                            .fixedSize()
                        } else if context.state.mode == "dancing" {
                            Text("\(formattedSteps) PASOS")
                                .font(.system(size: 9, weight: .black))
                                .fixedSize()
                        } else {
                            Text("¡NO TE OLVIDES DE IR!")
                                .font(.system(size: 9, weight: .black))
                                .fixedSize()
                        }
                    }
                    .foregroundColor(Color(red: 0.04, green: 0.04, blue: 0.04))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3.5)
                    .background(limeAcid)
                    .clipShape(Capsule())
                    .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(alignment: .center, spacing: 12) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .fill(obsidianBg)
                                if let uiImage = thumb {
                                    Image(uiImage: uiImage)
                                        .resizable()
                                        .scaledToFill()
                                } else {
                                    Image(systemName: "sparkles")
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(limeAcid)
                                }
                            }
                            .frame(width: 56, height: 56)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 4) {
                                    Image(systemName: "clock")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(limeAcid)
                                    Text(context.attributes.startHourLabel)
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(.white)
                                }

                                Text(context.attributes.eventTitle.uppercased())
                                    .font(.system(size: 13, weight: .black))
                                    .foregroundColor(.white)
                                    .lineLimit(1)

                                Text(context.state.subtitle.uppercased())
                                    .font(.system(size: 10, weight: .heavy))
                                    .foregroundColor(.gray)
                                    .lineLimit(1)

                                HStack(spacing: 4) {
                                    Image(systemName: "music.note")
                                        .font(.system(size: 9, weight: .bold))
                                        .foregroundColor(limeAcid)
                                    Text(context.attributes.venueLabel)
                                        .font(.system(size: 9, weight: .medium))
                                        .foregroundColor(Color(white: 0.9))
                                        .lineLimit(1)
                                }
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(obsidianBg)
                                .clipShape(Capsule())
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        HStack(spacing: 5) {
                            Spacer()
                            Image(systemName: "ticket")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(limeAcid)
                            Text(context.state.footerLabel)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(.white)
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
                        .font(.system(size: 12, weight: .black))
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

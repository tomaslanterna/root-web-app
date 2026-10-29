import Foundation
import ActivityKit

@available(iOS 16.1, *)
public struct RootLiveEventAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// "before_start" | "started_away" | "dancing"
        public var mode: String
        public var headerTitle: String
        public var stepsCount: Int
        public var subtitle: String
        public var footerLabel: String
        public var eventStartEpochMs: Double
        public var thumbnailBase64: String?

        public init(
            mode: String,
            headerTitle: String,
            stepsCount: Int,
            subtitle: String,
            footerLabel: String,
            eventStartEpochMs: Double,
            thumbnailBase64: String? = nil
        ) {
            self.mode = mode
            self.headerTitle = headerTitle
            self.stepsCount = stepsCount
            self.subtitle = subtitle
            self.footerLabel = footerLabel
            self.eventStartEpochMs = eventStartEpochMs
            self.thumbnailBase64 = thumbnailBase64
        }
    }

    public var eventId: String
    public var eventTitle: String
    public var startHourLabel: String
    public var venueLabel: String
    public var thumbnailBase64: String?

    public init(
        eventId: String,
        eventTitle: String,
        startHourLabel: String,
        venueLabel: String,
        thumbnailBase64: String? = nil
    ) {
        self.eventId = eventId
        self.eventTitle = eventTitle
        self.startHourLabel = startHourLabel
        self.venueLabel = venueLabel
        self.thumbnailBase64 = thumbnailBase64
    }
}

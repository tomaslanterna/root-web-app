package com.emnetwork.root.live;

/** Estado de la notificación de evento en curso (equivalente al ContentState de la Live Activity de iOS). */
final class RootLiveEventState {
    static final String MODE_BEFORE_START = "before_start";
    static final String MODE_STARTED_AWAY = "started_away";
    static final String MODE_DANCING = "dancing";

    final String eventId;
    final String title;
    final String startHourLabel;
    final String mode;
    final int steps;
    final long eventStartEpochMs;

    RootLiveEventState(
        String eventId,
        String title,
        String startHourLabel,
        String mode,
        int steps,
        long eventStartEpochMs
    ) {
        this.eventId = eventId;
        this.title = title;
        this.startHourLabel = startHourLabel;
        this.mode = mode;
        this.steps = steps;
        this.eventStartEpochMs = eventStartEpochMs;
    }
}

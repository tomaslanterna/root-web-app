package com.emnetwork.root.live;

import android.app.Notification;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Equivalente Android del loop en segundo plano de iOS: mientras estás bailando mantiene viva la
 * notificación (servicio en primer plano) y la actualiza con los pasos del sensor aunque la app
 * esté cerrada o el teléfono bloqueado.
 *
 * El sensor TYPE_STEP_COUNTER entrega pasos acumulados desde el último reinicio, sin historial.
 * Por eso la web envía los pasos desde el inicio del evento (Health Connect) y acá se suman los
 * pasos nuevos a partir de ese punto: pasos = base + (contador - contadorBase).
 */
public class RootLiveStepsService extends Service implements SensorEventListener {
    private static final String EXTRA_EVENT_ID = "eventId";
    private static final String EXTRA_TITLE = "title";
    private static final String EXTRA_HOUR = "hour";
    private static final String EXTRA_STEPS = "steps";
    private static final String EXTRA_START = "start";
    private static final String EXTRA_BANNER = "banner";

    /** Igual que el timer de 4 s de iOS: no se refresca la notificación más seguido que esto. */
    private static final long REFRESH_INTERVAL_MS = 4000L;
    /** Tope de seguridad: si nadie lo detuvo, se apaga 12 horas después del inicio del evento. */
    private static final long MAX_AFTER_START_MS = 12L * 60L * 60L * 1000L;

    /** La app (plugin) se suscribe para recibir los pasos en vivo mientras está abierta. */
    interface StepsListener {
        void onSteps(int steps);
    }

    private static final Object LOCK = new Object();
    private static volatile StepsListener stepsListener;
    private static String activeEventId;
    private static int currentSteps;

    private SensorManager sensorManager;
    private boolean listening;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();

    private RootLiveEventState state;
    private String bannerUrl;
    private Bitmap thumbnail;
    private boolean thumbnailRequested;
    /** Pasos y lectura del contador en el momento de la última sincronización con la web. */
    private int baseSteps;
    private long baseCounter = -1;
    private long lastCounter = -1;
    private long lastRefreshMs;

    static void setStepsListener(StepsListener listener) {
        stepsListener = listener;
    }

    /** Pasos que muestra el servicio para este evento (0 si no está activo para él). */
    static int currentSteps(String eventId) {
        synchronized (LOCK) {
            return eventId != null && eventId.equals(activeEventId) ? currentSteps : 0;
        }
    }

    /** Puede lanzar si el sistema no deja iniciar un servicio en primer plano desde segundo plano. */
    static void start(Context context, RootLiveEventState state, String bannerUrl) {
        Intent intent = new Intent(context, RootLiveStepsService.class)
            .putExtra(EXTRA_EVENT_ID, state.eventId)
            .putExtra(EXTRA_TITLE, state.title)
            .putExtra(EXTRA_HOUR, state.startHourLabel)
            .putExtra(EXTRA_STEPS, state.steps)
            .putExtra(EXTRA_START, state.eventStartEpochMs)
            .putExtra(EXTRA_BANNER, bannerUrl);
        ContextCompat.startForegroundService(context, intent);
    }

    static void stop(Context context) {
        context.stopService(new Intent(context, RootLiveStepsService.class));
        synchronized (LOCK) {
            activeEventId = null;
            currentSteps = 0;
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            // El sistema reinició el servicio sin datos: no hay evento que mostrar.
            stopSelf();
            return START_NOT_STICKY;
        }
        String eventId = intent.getStringExtra(EXTRA_EVENT_ID);
        int requestedSteps = intent.getIntExtra(EXTRA_STEPS, 0);
        String titleExtra = intent.getStringExtra(EXTRA_TITLE);
        String hourExtra = intent.getStringExtra(EXTRA_HOUR);

        synchronized (LOCK) {
            boolean sameEvent = eventId != null && eventId.equals(activeEventId);
            int base = sameEvent ? Math.max(requestedSteps, currentSteps) : requestedSteps;
            activeEventId = eventId;
            currentSteps = base;
            // Se vuelve a fijar el punto de partida: pasos = base + lo que cuente el sensor desde ahora.
            baseSteps = base;
            baseCounter = lastCounter;
            state = new RootLiveEventState(
                eventId == null ? "" : eventId,
                titleExtra == null ? "Evento Root" : titleExtra,
                hourExtra == null ? "" : hourExtra,
                RootLiveEventState.MODE_DANCING,
                base,
                intent.getLongExtra(EXTRA_START, System.currentTimeMillis())
            );
        }
        String newBanner = intent.getStringExtra(EXTRA_BANNER);
        boolean bannerChanged = newBanner != null && !newBanner.equals(bannerUrl);
        bannerUrl = newBanner;

        RootLiveNotification.ensureChannel(this);
        Notification notification = RootLiveNotification.build(this, state, thumbnail);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            startForeground(
                RootLiveNotification.NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH
            );
        } else {
            startForeground(RootLiveNotification.NOTIFICATION_ID, notification);
        }

        // Un solo intento por banner: si la descarga falla no se reintenta en cada sincronización.
        if (bannerChanged || !thumbnailRequested) {
            thumbnailRequested = true;
            loadThumbnail();
        }
        startListening();
        return START_NOT_STICKY;
    }

    private void loadThumbnail() {
        final String url = bannerUrl;
        worker.execute(() -> {
            Bitmap loaded = RootLiveThumbnail.load(url);
            if (loaded == null) return;
            thumbnail = loaded;
            refresh();
        });
    }

    private void startListening() {
        if (listening) return;
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        Sensor counter = sensorManager == null ? null : sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (counter == null) return; // Sin sensor: se queda con los pasos que mande la web.
        try {
            listening = sensorManager.registerListener(this, counter, SensorManager.SENSOR_DELAY_NORMAL);
        } catch (SecurityException e) {
            listening = false; // Sin permiso de actividad física.
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.values == null || event.values.length == 0 || state == null) return;
        long counter = (long) event.values[0];
        long now = System.currentTimeMillis();
        boolean due;
        boolean changed;
        int previousSteps;
        int latest;
        synchronized (LOCK) {
            lastCounter = counter;
            if (baseCounter < 0 || counter < baseCounter) {
                // Primera lectura, o el contador se reinició (reinicio del teléfono).
                baseCounter = counter;
            }
            previousSteps = currentSteps;
            currentSteps = Math.max(currentSteps, baseSteps + (int) (counter - baseCounter));
            changed = currentSteps != previousSteps;
            latest = currentSteps;
            due = now - lastRefreshMs >= REFRESH_INTERVAL_MS;
        }
        StepsListener listener = stepsListener;
        if (changed && listener != null) listener.onSteps(latest);
        if (now > state.eventStartEpochMs + MAX_AFTER_START_MS) {
            stopSelf();
            return;
        }
        if (due) refresh();
    }

    private void refresh() {
        RootLiveEventState current;
        synchronized (LOCK) {
            lastRefreshMs = System.currentTimeMillis();
            current = new RootLiveEventState(
                state.eventId, state.title, state.startHourLabel, state.mode,
                currentSteps, state.eventStartEpochMs
            );
        }
        try {
            NotificationManagerCompat.from(this).notify(
                RootLiveNotification.NOTIFICATION_ID,
                RootLiveNotification.build(this, current, thumbnail)
            );
        } catch (SecurityException ignored) {
            // Permiso de notificaciones revocado: el servicio sigue, pero sin mostrar nada.
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    public void onDestroy() {
        if (sensorManager != null && listening) sensorManager.unregisterListener(this);
        listening = false;
        worker.shutdownNow();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

package com.emnetwork.root.live;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PermissionState;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Equivalente Android de syncLiveActivity / stopLiveActivity del plugin de iOS.
 * La web llama con las mismas opciones; acá se traducen a una notificación en curso.
 */
@CapacitorPlugin(
    name = "RootLiveActivity",
    permissions = {
        // Contador de pasos del teléfono (Android 10+). Lo usa el servicio en segundo plano.
        @Permission(strings = { Manifest.permission.ACTIVITY_RECOGNITION }, alias = "activity")
    }
)
public class RootLiveActivityPlugin extends Plugin {
    private static final long FIVE_HOURS_MS = 5L * 60L * 60L * 1000L;

    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    /** Pasos ya mostrados por evento: nunca retroceden por una lectura tardía. */
    private String lastEventId;
    private int lastSteps;
    /** El permiso de actividad física se pide una sola vez por sesión: si lo niega, no se insiste. */
    private boolean askedActivityPermission;

    @Override
    public void load() {
        // Pasos en vivo del sensor hacia la web (mismo evento y forma que el podómetro de iOS).
        RootLiveStepsService.setStepsListener(steps -> {
            JSObject data = new JSObject();
            data.put("steps", steps);
            data.put("distanceMeters", 0);
            notifyListeners("pedometerUpdate", data);
        });
    }

    @PluginMethod
    public void syncLiveActivity(final PluginCall call) {
        boolean dancing = RootLiveEventState.MODE_DANCING.equals(call.getString("mode", ""));
        if (dancing && needsActivityPermission() && !askedActivityPermission) {
            askedActivityPermission = true;
            requestPermissionForAlias("activity", call, "onActivityPermission");
            return;
        }
        performSync(call);
    }

    @PermissionCallback
    private void onActivityPermission(PluginCall call) {
        // Con o sin permiso se muestra la notificación; sin permiso solo faltan los pasos en segundo plano.
        performSync(call);
    }

    private boolean needsActivityPermission() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
            && getPermissionState("activity") != PermissionState.GRANTED;
    }

    private boolean canCountStepsInBackground() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.Q || !needsActivityPermission();
    }

    private void performSync(final PluginCall call) {
        final Context context = getContext();
        if (!notificationsAllowed(context)) {
            JSObject res = new JSObject();
            res.put("supported", false);
            res.put("reason", "notifications_disabled");
            call.resolve(res);
            return;
        }

        final String eventId = call.getString("eventId", "");
        final String title = call.getString("eventTitle", "Evento Root");
        final String startHourLabel = call.getString("startHourLabel", "");
        final String bannerUrl = call.getString("bannerUrl");
        final String mode = call.getString("mode", RootLiveEventState.MODE_BEFORE_START);
        final Double startMsBoxed = call.getDouble("eventStartEpochMs");
        final long startMs = startMsBoxed == null ? System.currentTimeMillis() : startMsBoxed.longValue();
        final Integer stepsBoxed = call.getInt("stepsCount");
        int requestedSteps = stepsBoxed == null ? 0 : stepsBoxed;

        // Igual que en iOS: con más de 5 horas de espera no se muestra en pantalla de bloqueo.
        if (RootLiveEventState.MODE_BEFORE_START.equals(mode) && startMs - System.currentTimeMillis() > FIVE_HOURS_MS) {
            RootLiveStepsService.stop(context);
            cancel(context);
            JSObject res = new JSObject();
            res.put("supported", true);
            res.put("started", false);
            res.put("reason", "more_than_5_hours_away");
            call.resolve(res);
            return;
        }

        final int steps;
        synchronized (this) {
            int previous = eventId.equals(lastEventId) ? lastSteps : 0;
            steps = Math.max(Math.max(requestedSteps, previous), RootLiveStepsService.currentSteps(eventId));
            lastEventId = eventId;
            lastSteps = steps;
        }

        final RootLiveEventState state =
            new RootLiveEventState(eventId, title, startHourLabel, mode, steps, startMs);

        // Bailando: servicio en primer plano que sigue contando pasos con la app cerrada.
        // Cualquier otro estado: notificación normal, y se apaga el servicio si estaba activo.
        if (RootLiveEventState.MODE_DANCING.equals(mode) && canCountStepsInBackground()) {
            try {
                RootLiveStepsService.start(context, state, bannerUrl);
                JSObject res = new JSObject();
                res.put("supported", true);
                res.put("updated", true);
                res.put("backgroundSteps", true);
                call.resolve(res);
                return;
            } catch (RuntimeException e) {
                // El sistema no permite iniciarlo ahora (p. ej. desde segundo plano): queda la notificación común.
            }
        } else {
            RootLiveStepsService.stop(context);
        }

        worker.execute(() -> {
            Bitmap thumbnail = RootLiveThumbnail.load(bannerUrl);
            try {
                RootLiveNotification.ensureChannel(context);
                NotificationManagerCompat.from(context).notify(
                    RootLiveNotification.NOTIFICATION_ID,
                    RootLiveNotification.build(context, state, thumbnail)
                );
                JSObject res = new JSObject();
                res.put("supported", true);
                res.put("updated", true);
                res.put("hasThumbnail", thumbnail != null);
                call.resolve(res);
            } catch (SecurityException e) {
                // El permiso de notificaciones se revocó entre la comprobación y el envío.
                JSObject res = new JSObject();
                res.put("supported", false);
                res.put("reason", "notifications_disabled");
                call.resolve(res);
            } catch (RuntimeException e) {
                call.reject("No se pudo mostrar la notificación del evento", e);
            }
        });
    }

    @PluginMethod
    public void stopLiveActivity(PluginCall call) {
        synchronized (this) {
            lastEventId = null;
            lastSteps = 0;
        }
        RootLiveStepsService.stop(getContext());
        cancel(getContext());
        JSObject res = new JSObject();
        res.put("stopped", true);
        call.resolve(res);
    }

    @Override
    protected void handleOnDestroy() {
        RootLiveStepsService.setStepsListener(null);
        worker.shutdown();
    }

    private static void cancel(Context context) {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) manager.cancel(RootLiveNotification.NOTIFICATION_ID);
    }

    private static boolean notificationsAllowed(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            && ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        return NotificationManagerCompat.from(context).areNotificationsEnabled();
    }
}

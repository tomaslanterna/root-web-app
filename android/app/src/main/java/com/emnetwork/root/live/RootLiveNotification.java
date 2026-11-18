package com.emnetwork.root.live;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.drawable.IconCompat;
import com.emnetwork.root.MainActivity;
import com.emnetwork.root.R;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * Notificación en curso que hace de "Live Activity" en Android: se ve en la pantalla de bloqueo y
 * en el panel, con el mismo diseño que la de iOS (flyer, nombre, cuenta regresiva o pasos).
 * La cuenta regresiva corre sola con un Chronometer: no hay que actualizarla cada segundo.
 */
final class RootLiveNotification {
    static final String CHANNEL_ID = "root_live_event";
    static final int NOTIFICATION_ID = 7421;

    private RootLiveNotification() {}

    static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            context.getString(R.string.root_live_channel_name),
            // LOW: se actualiza seguido (pasos) y nunca debe sonar ni vibrar.
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription(context.getString(R.string.root_live_channel_description));
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.setShowBadge(false);
        manager.createNotificationChannel(channel);
    }

    static Notification build(Context context, RootLiveEventState state, Bitmap thumbnail) {
        Intent intent = new Intent(context, MainActivity.class)
            .setAction(Intent.ACTION_VIEW)
            .setData(Uri.parse("root://events/" + Uri.encode(state.eventId)))
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent open = PendingIntent.getActivity(
            context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(smallIcon(context))
            .setColor(ContextCompat.getColor(context, R.color.root_lime))
            .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
            .setCustomContentView(views(context, R.layout.root_live_collapsed, state, thumbnail))
            .setCustomBigContentView(views(context, R.layout.root_live_expanded, state, thumbnail))
            .setContentTitle(state.title)
            .setContentIntent(open)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build();
    }

    private static RemoteViews views(Context context, int layout, RootLiveEventState state, Bitmap thumbnail) {
        RemoteViews v = new RemoteViews(context.getPackageName(), layout);
        v.setTextViewText(R.id.root_live_title, state.title.toUpperCase(Locale.ROOT));

        if (thumbnail != null) {
            v.setImageViewBitmap(R.id.root_live_image, thumbnail);
        } else {
            v.setImageViewResource(R.id.root_live_image, R.drawable.ic_root_logo);
        }

        boolean dancing = RootLiveEventState.MODE_DANCING.equals(state.mode);
        boolean away = RootLiveEventState.MODE_STARTED_AWAY.equals(state.mode);
        boolean countingDown = !dancing && !away && state.eventStartEpochMs > System.currentTimeMillis();

        v.setViewVisibility(R.id.root_live_status, away ? View.GONE : View.VISIBLE);
        if (dancing) {
            v.setTextViewText(R.id.root_live_status, "● " + context.getString(R.string.root_live_now));
            v.setTextColor(R.id.root_live_status, 0xFFFF5A36);
        } else if (!away) {
            v.setTextViewText(R.id.root_live_status, "◷ " + state.startHourLabel);
            v.setTextColor(R.id.root_live_status, 0xFFFFFFFF);
        }

        v.setViewVisibility(R.id.root_live_countdown, countingDown ? View.VISIBLE : View.GONE);
        if (countingDown) {
            long base = SystemClock.elapsedRealtime() + (state.eventStartEpochMs - System.currentTimeMillis());
            v.setChronometerCountDown(R.id.root_live_countdown, true);
            v.setChronometer(R.id.root_live_countdown, base, null, true);
        }

        v.setViewVisibility(R.id.root_live_steps, dancing ? View.VISIBLE : View.GONE);
        if (dancing) {
            NumberFormat format = NumberFormat.getIntegerInstance(new Locale("es", "UY"));
            v.setTextViewText(R.id.root_live_steps, format.format(state.steps));
        }

        v.setViewVisibility(R.id.root_live_away, away ? View.VISIBLE : View.GONE);

        boolean showLabel = dancing || countingDown;
        v.setViewVisibility(R.id.root_live_label, showLabel ? View.VISIBLE : View.GONE);
        if (dancing) {
            v.setTextViewText(R.id.root_live_label, context.getString(R.string.root_live_steps_label));
        } else if (countingDown) {
            v.setTextViewText(R.id.root_live_label, context.getString(R.string.root_live_starts_in));
        }
        return v;
    }

    private static IconCompat smallIcon(Context context) {
        Drawable glyph = ContextCompat.getDrawable(context, R.drawable.ic_stat_root);
        int size = Math.max(24, Math.round(24 * context.getResources().getDisplayMetrics().density));
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        glyph.setBounds(0, 0, size, size);
        glyph.draw(new Canvas(bitmap));
        return IconCompat.createWithBitmap(bitmap);
    }
}

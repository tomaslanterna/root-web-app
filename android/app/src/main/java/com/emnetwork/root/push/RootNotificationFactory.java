package com.emnetwork.root.push;

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
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.drawable.IconCompat;
import com.emnetwork.root.MainActivity;
import com.emnetwork.root.R;
import java.util.Map;

final class RootNotificationFactory {
    // No renombrar: es el canal de chats y el default del manifest; cambiarlo borra la configuración del usuario.
    static final String CHANNEL_ID = "root_messages";

    /** { categoría, id de canal, nombre, descripción }. Mensajes queda primero con importancia alta. */
    private static final String[][] CHANNELS = {
        {RootPushData.MESSAGES, CHANNEL_ID, "Mensajes", "Mensajes de tus chats y squads"},
        {RootPushData.EVENTS, "root_events", "Eventos", "Recordatorios y novedades de tus eventos"},
        {RootPushData.SOCIAL, "root_social", "Social", "Seguidores, likes y comentarios"},
        {RootPushData.CREWS, "root_crews", "Crews", "Matches y solicitudes de tus crews"},
        {RootPushData.COMMUNITIES, "root_communities", "Comunidades", "Anuncios de tus comunidades"},
        {RootPushData.ACTIVITY, "root_activity", "Actividad", "Otras novedades de root"},
        {RootPushData.ACCOUNT, "root_account", "Cuenta", "Tu cuenta, verificación y transferencias"},
    };

    static String channelId(String category) {
        for (String[] channel : CHANNELS) {
            if (channel[0].equals(category)) return channel[1];
        }
        return "root_activity";
    }

    /** Idempotente: solo crea los que faltan, así no pisa nombre ni ajustes que el usuario cambió. */
    static void ensureChannels(NotificationManager manager) {
        for (String[] channel : CHANNELS) {
            if (manager.getNotificationChannel(channel[1]) != null) continue;
            boolean messages = CHANNEL_ID.equals(channel[1]);
            NotificationChannel created = new NotificationChannel(
                channel[1], channel[2],
                messages ? NotificationManager.IMPORTANCE_HIGH : NotificationManager.IMPORTANCE_DEFAULT
            );
            created.setDescription(channel[3]);
            created.enableVibration(true);
            manager.createNotificationChannel(created);
        }
    }

    static Notification create(Context context, RootPushData data, String fcmMessageId) {
        Intent intent = new Intent(context, MainActivity.class)
            .setAction(Intent.ACTION_VIEW)
            // Identidad única por cuenta/notificación: un PendingIntent no puede abrir el destino de otro.
            .setData(Uri.parse("root://notification/" + data.recipientId + "/" + data.identity))
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        // Capacitor (handleOnNewIntent) arma pushNotificationActionPerformed con estos extras como notification.data.
        for (Map.Entry<String, String> entry : data.fields.entrySet()) {
            intent.putExtra(entry.getKey(), entry.getValue());
        }
        // Va al final: es la llave que Capacitor exige para reconocer el tap (y no un campo de data).
        intent.putExtra("google.message_id", fcmMessageId == null ? data.identity : fcmMessageId);
        PendingIntent open = PendingIntent.getActivity(
            context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        return new NotificationCompat.Builder(context, channelId(data.category))
            .setSmallIcon(smallIcon(context))
            .setColor(ContextCompat.getColor(context, R.color.root_lime))
            .setContentTitle(data.title)
            .setContentText(data.body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(data.body))
            .setContentIntent(open)
            .setAutoCancel(true)
            .setPriority(data.isChat() ? NotificationCompat.PRIORITY_HIGH : NotificationCompat.PRIORITY_DEFAULT)
            .setDefaults(NotificationCompat.DEFAULT_SOUND | NotificationCompat.DEFAULT_VIBRATE)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .build();
    }

    private static IconCompat smallIcon(Context context) {
        // Send the actual glyph, not a resource ID that an OEM may cache across APK updates.
        // All supported Android versions (API 24+) accept bitmap small icons.
        Drawable glyph = ContextCompat.getDrawable(context, R.drawable.ic_stat_root);
        int size = Math.max(24, Math.round(24 * context.getResources().getDisplayMetrics().density));
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        glyph.setBounds(0, 0, size, size);
        glyph.draw(new Canvas(bitmap));
        return IconCompat.createWithBitmap(bitmap);
    }
}

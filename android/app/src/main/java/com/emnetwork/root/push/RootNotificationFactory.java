package com.emnetwork.root.push;

import android.app.Notification;
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

final class RootNotificationFactory {
    static final String CHANNEL_ID = "root_messages";

    static Notification create(Context context, RootPushData data, String fcmMessageId) {
        Intent intent = new Intent(context, MainActivity.class)
            .setAction(Intent.ACTION_VIEW)
            // Unique identity per account/chat: pending intents cannot open another chat.
            .setData(Uri.parse("root://notification/" + data.recipientId + "/" + data.chatId))
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP)
            .putExtra("google.message_id", fcmMessageId == null ? data.messageId : fcmMessageId)
            .putExtra("type", "chat.message")
            .putExtra("chat_id", data.chatId)
            .putExtra("message_id", data.messageId)
            .putExtra("recipient_id", data.recipientId);
        PendingIntent open = PendingIntent.getActivity(
            context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        return new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(smallIcon(context))
            .setColor(ContextCompat.getColor(context, R.color.root_lime))
            .setContentTitle(data.title)
            .setContentText(data.body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(data.body))
            .setContentIntent(open)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
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

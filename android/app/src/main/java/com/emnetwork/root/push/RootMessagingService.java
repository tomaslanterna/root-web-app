package com.emnetwork.root.push;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class RootMessagingService extends MessagingService {
    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        RootPushData data = RootPushData.from(message.getData());
        // Legacy notification payloads still use Capacitor; data-only messages
        // are rendered here in foreground and background without a WebView.
        if (data != null && message.getNotification() == null && permitted()) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                manager.getNotificationChannel(RootNotificationFactory.CHANNEL_ID) == null) {
                NotificationChannel channel = new NotificationChannel(
                    RootNotificationFactory.CHANNEL_ID, "Mensajes", NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Mensajes de tus chats y squads");
                channel.enableVibration(true);
                manager.createNotificationChannel(channel);
            }
            manager.notify(data.chatId, 0, RootNotificationFactory.create(this, data, message.getMessageId()));
        }
        // Reuse Capacitor listeners and its inherited token-rotation handling.
        // Data-only messages do not generate a second notification in the plugin.
        super.onMessageReceived(message);
    }

    private boolean permitted() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }
}

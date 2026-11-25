package com.emnetwork.root.push;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

final class RootPushData {
    private static final Pattern UUID = Pattern.compile(
        "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
    );
    static final String CHAT_MESSAGE = "chat.message";
    // Mismas categorías que el backend (domain.NotificationCategory).
    static final String MESSAGES = "messages", EVENTS = "events", SOCIAL = "social", CREWS = "crews",
        COMMUNITIES = "communities", ACTIVITY = "activity", ACCOUNT = "account";

    final String type, category, chatId, messageId, notificationId, recipientId, title, body;
    /** Tag estable de la notificación: una reentrega de FCM la reemplaza en vez de duplicarla. */
    final String identity;
    /** Payload completo: viaja en el PendingIntent y llega a JS como notification.data. */
    final Map<String, String> fields;

    private RootPushData(Map<String, String> data, String type) {
        boolean chat = CHAT_MESSAGE.equals(type);
        Map<String, String> copy = new HashMap<>(data);
        copy.put("type", type);
        fields = Collections.unmodifiableMap(copy);
        this.type = type;
        chatId = data.get("chat_id");
        messageId = data.get("message_id");
        recipientId = data.get("recipient_id");
        String id = data.get("notification_id");
        notificationId = isUuid(id) ? id : null;
        category = category(data.get("category"), type);
        if (chat) {
            title = preview(data.get("title"), "Nuevo mensaje", 81);
            body = preview(data.get("body"), "Tenés un mensaje nuevo.", 241);
            // Un chat por notificación (como hasta ahora): el mensaje nuevo reemplaza al anterior.
            identity = chatId;
        } else {
            // El backend recorta a 120/500 code points + "…".
            title = preview(data.get("title"), "root", 121);
            body = preview(data.get("body"), "Tenés una novedad.", 501);
            identity = notificationId != null ? notificationId : "type:" + type;
        }
    }

    boolean isChat() {
        return CHAT_MESSAGE.equals(type);
    }

    static RootPushData from(Map<String, String> data) {
        if (data == null) return null;
        String type = data.get("type");
        type = type == null ? "" : type.trim();
        if (type.isEmpty()) return null;
        String[] required = CHAT_MESSAGE.equals(type)
            ? new String[]{"chat_id", "message_id", "recipient_id"}
            : new String[]{"recipient_id"};
        for (String field : required) {
            if (!isUuid(data.get(field))) return null;
        }
        return new RootPushData(data, type);
    }

    /** Usa la categoría del backend; si falta o es desconocida (backend viejo), la infiere del type. */
    static String category(String declared, String type) {
        if (declared != null) {
            switch (declared.trim()) {
                case MESSAGES: return MESSAGES;
                case EVENTS: return EVENTS;
                case SOCIAL: return SOCIAL;
                case CREWS: return CREWS;
                case COMMUNITIES: return COMMUNITIES;
                case ACTIVITY: return ACTIVITY;
                case ACCOUNT: return ACCOUNT;
                default: break;
            }
        }
        int dot = type.indexOf('.');
        switch (dot < 0 ? type : type.substring(0, dot)) {
            case "chat": return MESSAGES;
            case "event": return EVENTS;
            case "social":
            case "post": return SOCIAL;
            case "crew": return CREWS;
            case "community": return COMMUNITIES;
            case "user":
            case "kyc":
            case "transfer": return ACCOUNT;
            default: return ACTIVITY;
        }
    }

    private static boolean isUuid(String value) {
        return value != null && UUID.matcher(value).matches();
    }

    private static String preview(String text, String fallback, int limit) {
        if (text == null || text.trim().isEmpty()) return fallback;
        text = text.trim();
        if (text.codePointCount(0, text.length()) > limit) {
            return text.substring(0, text.offsetByCodePoints(0, limit));
        }
        return text;
    }
}

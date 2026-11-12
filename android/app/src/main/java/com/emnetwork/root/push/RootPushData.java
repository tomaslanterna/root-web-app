package com.emnetwork.root.push;

import java.util.Map;
import java.util.HashMap;
import java.util.regex.Pattern;

final class RootPushData {
    private static final Pattern UUID = Pattern.compile(
        "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
    );
    final String type, chatId, messageId, notificationId, recipientId, title, body, identity;
    final Map<String, String> fields;

    private RootPushData(Map<String, String> data) {
        fields = new HashMap<>(data);
        type = data.get("type");
        chatId = data.get("chat_id");
        messageId = data.get("message_id");
        notificationId = data.get("notification_id");
        recipientId = data.get("recipient_id");
        title = preview(data.get("title"), "Nuevo mensaje", 81);
        body = preview(data.get("body"), "Tenés un mensaje nuevo.", 241);
        identity = chatId != null ? chatId : notificationId;
    }

    static RootPushData from(Map<String, String> data) {
        String type = data.get("type");
        if ("chat.message".equals(type)) {
            for (String field : new String[]{"chat_id", "message_id", "recipient_id"}) {
                String value = data.get(field);
                if (value == null || !UUID.matcher(value).matches()) return null;
            }
            return new RootPushData(data);
        }
        if (type == null || !(type.startsWith("event.") || type.startsWith("social.") ||
            type.startsWith("post.") || type.startsWith("crew.") || type.startsWith("community.") ||
            type.startsWith("kyc.") || type.startsWith("transfer."))) return null;
        for (String field : new String[]{"notification_id", "recipient_id"}) {
            String value = data.get(field);
            if (value == null || !UUID.matcher(value).matches()) return null;
        }
        return new RootPushData(data);
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

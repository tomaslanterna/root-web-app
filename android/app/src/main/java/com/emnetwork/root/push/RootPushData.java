package com.emnetwork.root.push;

import java.util.Map;
import java.util.regex.Pattern;

final class RootPushData {
    private static final Pattern UUID = Pattern.compile(
        "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
    );
    final String chatId, messageId, recipientId, title, body;

    private RootPushData(Map<String, String> data) {
        chatId = data.get("chat_id");
        messageId = data.get("message_id");
        recipientId = data.get("recipient_id");
        title = preview(data.get("title"), "Nuevo mensaje", 81);
        body = preview(data.get("body"), "Tenés un mensaje nuevo.", 241);
    }

    static RootPushData from(Map<String, String> data) {
        if (!"chat.message".equals(data.get("type"))) return null;
        for (String field : new String[]{"chat_id", "message_id", "recipient_id"}) {
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

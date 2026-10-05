package com.emnetwork.root.push;

import static org.junit.Assert.*;
import java.util.HashMap;
import java.util.Map;
import org.junit.Test;

public class RootPushDataTest {
    private Map<String, String> payload() {
        Map<String, String> data = new HashMap<>();
        data.put("type", "chat.message");
        data.put("chat_id", "c06a06ad-717b-4892-9e85-45e66e2c69d1");
        data.put("message_id", "48a09314-cedb-410b-a243-e45e688fb47e");
        data.put("recipient_id", "dbf72152-6958-407f-bb5d-29c4b05b8392");
        data.put("title", "María");
        data.put("body", "Nos vemos 🎉");
        return data;
    }

    @Test public void preservesSenderAndPreview() {
        RootPushData data = RootPushData.from(payload());
        assertNotNull(data);
        assertEquals("María", data.title);
        assertEquals("Nos vemos 🎉", data.body);
    }

    @Test public void rejectsUnknownTypesAndInvalidIdentifiers() {
        for (String field : new String[]{"chat_id", "message_id", "recipient_id"}) {
            Map<String, String> data = payload();
            data.put(field, "https://outside.example");
            assertNull(RootPushData.from(data));
            data.remove(field);
            assertNull(RootPushData.from(data));
        }
        Map<String, String> data = payload();
        data.put("type", "unknown");
        assertNull(RootPushData.from(data));
    }

    @Test public void boundsUnicodePreviewsAndProvidesFallbacks() {
        Map<String, String> values = payload();
        values.put("title", " ");
        values.put("body", "🎉".repeat(400));
        RootPushData data = RootPushData.from(values);
        assertNotNull(data);
        assertEquals("Nuevo mensaje", data.title);
        assertEquals("🎉".repeat(241), data.body);
        values.remove("body");
        assertEquals("Tenés un mensaje nuevo.", RootPushData.from(values).body);
    }
}

package com.emnetwork.root.push;

import static org.junit.Assert.*;
import java.util.HashMap;
import java.util.Map;
import org.junit.Test;

public class RootPushDataTest {
    private static final String RECIPIENT = "dbf72152-6958-407f-bb5d-29c4b05b8392";
    private static final String NOTIFICATION = "7f3d0f0e-2b1a-4c55-9a7e-0c9f1d2e3b4a";

    private Map<String, String> payload() {
        Map<String, String> data = new HashMap<>();
        data.put("type", "chat.message");
        data.put("chat_id", "c06a06ad-717b-4892-9e85-45e66e2c69d1");
        data.put("message_id", "48a09314-cedb-410b-a243-e45e688fb47e");
        data.put("recipient_id", RECIPIENT);
        data.put("title", "María");
        data.put("body", "Nos vemos 🎉");
        return data;
    }

    private Map<String, String> birthday() {
        Map<String, String> data = new HashMap<>();
        data.put("type", "user.birthday");
        data.put("category", "account");
        data.put("notification_id", NOTIFICATION);
        data.put("recipient_id", RECIPIENT);
        data.put("username", "maria");
        data.put("title", "¡Feliz cumpleaños!");
        data.put("body", "Hoy es tu día 🎂");
        return data;
    }

    @Test public void preservesSenderAndPreview() {
        RootPushData data = RootPushData.from(payload());
        assertNotNull(data);
        assertTrue(data.isChat());
        assertEquals("María", data.title);
        assertEquals("Nos vemos 🎉", data.body);
        assertEquals(RootPushData.MESSAGES, data.category);
        assertEquals(RootNotificationFactory.CHANNEL_ID, RootNotificationFactory.channelId(data.category));
        assertEquals("c06a06ad-717b-4892-9e85-45e66e2c69d1", data.identity);
        assertEquals("48a09314-cedb-410b-a243-e45e688fb47e", data.fields.get("message_id"));
    }

    @Test public void rejectsChatsWithInvalidIdentifiers() {
        for (String field : new String[]{"chat_id", "message_id", "recipient_id"}) {
            Map<String, String> data = payload();
            data.put(field, "https://outside.example");
            assertNull(RootPushData.from(data));
            data.remove(field);
            assertNull(RootPushData.from(data));
        }
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

    @Test public void acceptsGenericBirthdayWithFullPayload() {
        RootPushData data = RootPushData.from(birthday());
        assertNotNull(data);
        assertFalse(data.isChat());
        assertEquals("user.birthday", data.type);
        assertEquals(RootPushData.ACCOUNT, data.category);
        assertEquals("root_account", RootNotificationFactory.channelId(data.category));
        assertEquals(NOTIFICATION, data.notificationId);
        assertEquals(NOTIFICATION, data.identity);
        assertEquals("¡Feliz cumpleaños!", data.title);
        assertEquals("Hoy es tu día 🎂", data.body);
        // Todo lo que JS necesita para notificationPath(...) viaja en el tap.
        assertEquals("user.birthday", data.fields.get("type"));
        assertEquals(RECIPIENT, data.fields.get("recipient_id"));
        assertEquals("maria", data.fields.get("username"));
    }

    @Test public void rejectsGenericWithInvalidRecipient() {
        Map<String, String> data = birthday();
        data.put("recipient_id", "not-a-uuid");
        assertNull(RootPushData.from(data));
        data.remove("recipient_id");
        assertNull(RootPushData.from(data));
    }

    @Test public void rejectsEmptyType() {
        Map<String, String> data = birthday();
        data.put("type", "  ");
        assertNull(RootPushData.from(data));
        data.remove("type");
        assertNull(RootPushData.from(data));
    }

    @Test public void acceptsUnknownTypes() {
        Map<String, String> data = birthday();
        data.put("type", "promo.flash_sale");
        data.remove("category");
        RootPushData parsed = RootPushData.from(data);
        assertNotNull(parsed);
        assertEquals("promo.flash_sale", parsed.type);
        assertEquals(RootPushData.ACTIVITY, parsed.category);
        assertEquals("root_activity", RootNotificationFactory.channelId(parsed.category));
    }

    @Test public void infersCategoryFromTypePrefixWhenMissingOrUnknown() {
        String[][] cases = {
            {"chat.created", RootPushData.MESSAGES},
            {"event.today", RootPushData.EVENTS},
            {"event.starting_soon", RootPushData.EVENTS},
            {"social.follow", RootPushData.SOCIAL},
            {"post.like", RootPushData.SOCIAL},
            {"crew.join_request", RootPushData.CREWS},
            {"community.announcement", RootPushData.COMMUNITIES},
            {"user.birthday", RootPushData.ACCOUNT},
            {"kyc.status", RootPushData.ACCOUNT},
            {"transfer.status", RootPushData.ACCOUNT},
            {"mystery", RootPushData.ACTIVITY},
        };
        for (String[] item : cases) {
            Map<String, String> data = birthday();
            data.put("type", item[0]);
            data.remove("category");
            assertEquals(item[0], item[1], RootPushData.from(data).category);
            data.put("category", "nonsense");
            assertEquals(item[0], item[1], RootPushData.from(data).category);
        }
        // La categoría explícita del backend gana sobre el prefijo (event.comment es social).
        Map<String, String> comment = birthday();
        comment.put("type", "event.comment");
        comment.put("category", "social");
        assertEquals(RootPushData.SOCIAL, RootPushData.from(comment).category);
    }

    @Test public void boundsGenericPreviewsAndProvidesFallbacks() {
        Map<String, String> values = birthday();
        values.put("title", "á".repeat(300));
        values.put("body", "🎉".repeat(700));
        RootPushData data = RootPushData.from(values);
        assertEquals("á".repeat(121), data.title);
        assertEquals("🎉".repeat(501), data.body);
        values.put("title", "");
        values.remove("body");
        data = RootPushData.from(values);
        assertEquals("root", data.title);
        assertEquals("Tenés una novedad.", data.body);
    }

    @Test public void genericWithoutNotificationIdStillHasStableIdentity() {
        Map<String, String> values = birthday();
        values.remove("notification_id");
        RootPushData data = RootPushData.from(values);
        assertNotNull(data);
        assertNull(data.notificationId);
        assertEquals("type:user.birthday", data.identity);
    }
}

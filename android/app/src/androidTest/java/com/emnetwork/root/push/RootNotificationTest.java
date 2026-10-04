package com.emnetwork.root.push;

import static org.junit.Assert.*;
import android.app.Notification;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.Icon;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.HashMap;
import java.util.Map;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class RootNotificationTest {
    @Test public void usesRootAppIconWithoutRightHandImage() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Map<String, String> values = new HashMap<>();
        values.put("type", "chat.message");
        values.put("chat_id", "c06a06ad-717b-4892-9e85-45e66e2c69d1");
        values.put("message_id", "48a09314-cedb-410b-a243-e45e688fb47e");
        values.put("recipient_id", "dbf72152-6958-407f-bb5d-29c4b05b8392");
        values.put("title", "María");
        values.put("body", "Nos vemos 🎉");
        RootPushData data = RootPushData.from(values);
        assertNotNull(data);
        Notification notification = RootNotificationFactory.create(context, data, "test-fcm-id");
        assertEquals("María", notification.extras.getString(Notification.EXTRA_TITLE));
        assertEquals("Nos vemos 🎉", notification.extras.getString(Notification.EXTRA_TEXT));
        assertEquals(Icon.TYPE_BITMAP, notification.getSmallIcon().getType());
        Drawable smallIcon = notification.getSmallIcon().loadDrawable(context);
        assertNotNull(smallIcon);
        Bitmap smallImage = Bitmap.createBitmap(24, 24, Bitmap.Config.ARGB_8888);
        smallIcon.setBounds(0, 0, 24, 24);
        smallIcon.draw(new Canvas(smallImage));
        assertEquals(Color.WHITE, smallImage.getPixel(10, 12));
        assertEquals(Color.TRANSPARENT, smallImage.getPixel(2, 2));
        assertNotNull(notification.contentIntent);
        assertEquals(Notification.VISIBILITY_PRIVATE, notification.visibility);
        // The system places the app/small icon; a large icon adds a right-hand image.
        assertNull(notification.getLargeIcon());
        Drawable logo = context.getPackageManager().getApplicationIcon(context.getPackageName());
        assertNotNull(logo);
        Bitmap image = Bitmap.createBitmap(64, 64, Bitmap.Config.ARGB_8888);
        logo.setBounds(0, 0, 64, 64);
        logo.draw(new Canvas(image));
        // OEMs which show the app icon must get Root, not the default Capacitor icon.
        assertEquals(Color.rgb(212, 255, 0), image.getPixel(32, 10));
    }
}

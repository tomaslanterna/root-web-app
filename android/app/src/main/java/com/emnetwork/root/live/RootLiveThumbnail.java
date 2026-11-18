package com.emnetwork.root.live;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** Descarga el flyer del evento y lo deja chico y con esquinas redondeadas para la notificación. */
final class RootLiveThumbnail {
    private static final int MAX_BYTES = 4 * 1024 * 1024;
    private static final int TARGET_PX = 192;

    private static String cachedUrl;
    private static Bitmap cachedBitmap;

    private RootLiveThumbnail() {}

    /** Bloqueante: llamar desde un hilo de fondo. Devuelve null si no se pudo obtener. */
    static synchronized Bitmap load(String urlString) {
        if (urlString == null || urlString.isEmpty()) return null;
        if (urlString.equals(cachedUrl) && cachedBitmap != null) return cachedBitmap;
        // Solo http(s): el flyer viene de la API, no se acepta ningún otro esquema.
        if (!urlString.startsWith("https://") && !urlString.startsWith("http://")) return null;
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(urlString).openConnection();
            connection.setConnectTimeout(6000);
            connection.setReadTimeout(8000);
            try (InputStream in = connection.getInputStream()) {
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buffer = new byte[8192];
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                    if (out.size() > MAX_BYTES) return null;
                }
                byte[] bytes = out.toByteArray();

                BitmapFactory.Options bounds = new BitmapFactory.Options();
                bounds.inJustDecodeBounds = true;
                BitmapFactory.decodeByteArray(bytes, 0, bytes.length, bounds);
                int sample = 1;
                while (bounds.outWidth / (sample * 2) >= TARGET_PX && bounds.outHeight / (sample * 2) >= TARGET_PX) {
                    sample *= 2;
                }
                BitmapFactory.Options opts = new BitmapFactory.Options();
                opts.inSampleSize = sample;
                Bitmap decoded = BitmapFactory.decodeByteArray(bytes, 0, bytes.length, opts);
                if (decoded == null) return null;
                Bitmap rounded = squareRounded(decoded);
                cachedUrl = urlString;
                cachedBitmap = rounded;
                return rounded;
            }
        } catch (Exception ignored) {
            return null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    /** Recorte cuadrado centrado (como scaledToFill) con esquinas redondeadas. */
    private static Bitmap squareRounded(Bitmap source) {
        Bitmap scaled = Bitmap.createBitmap(TARGET_PX, TARGET_PX, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(scaled);
        float scale = Math.max((float) TARGET_PX / source.getWidth(), (float) TARGET_PX / source.getHeight());
        float w = source.getWidth() * scale;
        float h = source.getHeight() * scale;
        RectF dest = new RectF((TARGET_PX - w) / 2f, (TARGET_PX - h) / 2f, (TARGET_PX + w) / 2f, (TARGET_PX + h) / 2f);
        Paint bitmapPaint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        canvas.drawBitmap(source, null, dest, bitmapPaint);

        Bitmap result = Bitmap.createBitmap(TARGET_PX, TARGET_PX, Bitmap.Config.ARGB_8888);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setShader(new BitmapShader(scaled, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP));
        float radius = TARGET_PX * 0.2f;
        new Canvas(result).drawRoundRect(new RectF(0, 0, TARGET_PX, TARGET_PX), radius, radius, paint);
        return result;
    }
}

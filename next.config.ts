import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";

// La URL del backend es obligatoria al compilar para producción: antes caía en silencio a una IP de la red local
// (http://192.168.1.9:8080) y la app quedaba rota sin ningún error visible.
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.BACKEND_PUBLIC_API_URL || "";
if (isProduction && !backendUrl) {
  throw new Error(
    "Falta NEXT_PUBLIC_BACKEND_API_URL (o BACKEND_PUBLIC_API_URL): definila antes de compilar para producción.",
  );
}

// Origen del backend (https y wss) para la política de contenido.
function backendOrigins(raw: string): string[] {
  try {
    const url = new URL(raw);
    const ws = url.protocol === "https:" ? "wss:" : "ws:";
    return [url.origin, `${ws}//${url.host}`];
  } catch {
    return [];
  }
}

// Política de contenido completa, en modo "solo reporte": el navegador avisa en la consola lo que bloquearía,
// pero no bloquea nada. Cuando se confirme en producción (web e iOS/Android) que no hay avisos, cambiar la key a
// "Content-Security-Policy" para que se aplique. Google y Apple son los únicos scripts de terceros (login).
// Ojo al aplicarla: el service worker (/sw.js) baja imágenes del CDN con fetch, y eso lo controla connect-src,
// no img-src. Antes de aplicarla, sumar el CDN de imágenes a connect-src o dejar /sw.js fuera de esta regla.
const reportOnlyCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com https://appleid.cdn-apple.com`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https:",
  `connect-src 'self' ${[...backendOrigins(backendUrl), "https://accounts.google.com", "https://appleid.apple.com"].join(" ")}${isDev ? " ws: http:" : ""}`,
  "frame-src https://accounts.google.com https://appleid.apple.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

// Esto sí se aplica desde ya: no rompe nada y frena el clickjacking (iframes ajenos), <base> y plugins.
const enforcedCsp = ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'"].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: enforcedCsp },
  { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Cámara (KYC), ubicación (asistencia) y sensores de movimiento (pasos) solo en el propio sitio.
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), geolocation=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self), microphone=(), payment=(), usb=(), browsing-topics=()",
  },
  // HSTS solo en producción (en desarrollo se usa http://localhost).
  ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=63072000" }] : []),
];

// Hosts de imágenes de desarrollo (backend local): no se habilitan en producción.
const devImageHosts = isProduction
  ? []
  : [
      { protocol: "http" as const, hostname: "localhost" },
      { protocol: "http" as const, hostname: "127.0.0.1" },
      { protocol: "http" as const, hostname: "192.168.*.*" },
    ];

const nextConfig: NextConfig = {
  // Transiciones entre pantallas con el View Transitions API (ver <ViewTransition> en app/layout.tsx).
  experimental: {
    viewTransition: true,
  },
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    BACKEND_PUBLIC_API_URL: process.env.BACKEND_PUBLIC_API_URL,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // El service worker nunca se cachea: así las versiones nuevas llegan al instante.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  allowedDevOrigins: isDev ? ["192.168.1.9", "http://192.168.1.9:3000"] : [],
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 2592000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    remotePatterns: [
      ...devImageHosts,
      // Dominio ajeno heredado: se deja solo por HTTPS hasta confirmar que ninguna imagen guardada en la base lo
      // usa (si se quita y hay una, next/image corta la página). Pendiente de revisar y borrar.
      {
        protocol: "https",
        hostname: "perito-app-service.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "passline.com",
      },
      {
        protocol: "https",
        hostname: "**.passline.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;

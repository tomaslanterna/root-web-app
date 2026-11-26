import { readFileSync, writeFileSync } from "node:fs";
import type { CapacitorConfig } from "@capacitor/cli";
import type {} from "@capacitor/push-notifications";

// El CLI de Capacitor no lee .env por sí solo: lo cargamos (no pisa variables ya definidas en el shell).
try {
  process.loadEnvFile(".env");
} catch {
  // sin .env: se usan las variables del entorno
}

// Local: CAP_SERVER_URL=http://<ip-de-tu-mac>:3000 en .env (o scripts cap:local / cap:prod).
// Sin la variable apunta a producción.
// www directo: estoesroot.com redirige a www.estoesroot.com, así la app se ahorra esa redirección al abrir.
const PROD_URL = "https://www.estoesroot.com";
// Dominios de producción donde iOS conecta el puente de Capacitor (push, Apple/Google, salud...). Si se cambia el
// dominio del server, tiene que estar acá (máximo 10).
const APP_BOUND_DOMAINS = ["www.estoesroot.com", "estoesroot.com", "root-web-app.vercel.app"];
const serverUrl = PROD_URL;
const isLocal = serverUrl !== PROD_URL;

// La pantalla local de "Sin conexión" necesita saber a qué servidor volver (local o producción).
try {
  writeFileSync(
    "native-shell/server-url.js",
    `window.ROOT_SERVER_URL = ${JSON.stringify(serverUrl)};\n`,
  );
} catch {
  // error.html cae a producción
}

// iOS: con WKAppBoundDomains declarado, WKWebView NO inyecta el puente de Capacitor en dominios que no estén en la
// lista (se rompe el splash nativo, push, geolocalización...). Solo se declara en producción, donde hace falta
// para los service workers; con una URL local se quita.
try {
  const plistPath = "ios/App/App/Info.plist";
  const domains = APP_BOUND_DOMAINS.map((domain) => `\t\t<string>${domain}</string>\n`).join("");
  const block = `\t<key>WKAppBoundDomains</key>\n\t<array>\n${domains}\t</array>\n`;
  const existing = /\t<key>WKAppBoundDomains<\/key>\n\t<array>[\s\S]*?<\/array>\n/;
  const plist = readFileSync(plistPath, "utf8");
  const has = existing.test(plist);
  if (isLocal && has) {
    writeFileSync(plistPath, plist.replace(existing, ""));
  } else if (!isLocal && has) {
    // Mantiene la lista al día si cambian los dominios.
    const updated = plist.replace(existing, block);
    if (updated !== plist) writeFileSync(plistPath, updated);
  } else if (!isLocal && !has) {
    writeFileSync(
      plistPath,
      plist.replace(
        "\t<key>CAPACITOR_DEBUG</key>",
        `${block}\t<key>CAPACITOR_DEBUG</key>`,
      ),
    );
  }
} catch {
  // sin proyecto iOS
}

const config: CapacitorConfig = {
  appId: "com.emnetwork.root",
  appName: "Root",
  // Mismo fondo que el splash nativo y el loader web: sin destello blanco mientras carga la webview.
  backgroundColor: "#0A0B0D",
  // Next uses dynamic routes: the native shell loads server.url, not a static export.
  webDir: "native-shell",
  ios: {
    // WKWebView solo permite service workers en dominios "app-bound" (ver WKAppBoundDomains en Info.plist).
    // Con una URL local (http) esto rompería el puente de Capacitor: solo en producción.
    limitsNavigationsToAppBoundDomains: !isLocal,
  },
  server: {
    url: serverUrl,
    cleartext: true, // Permite conexiones HTTP (sin SSL) en el emulador
    allowNavigation: ["*"],
    // Si el servidor no responde (sin red / mala conexión y sin copia guardada), se muestra esta pantalla local.
    errorPath: "error.html",
  },
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
      style: "DARK",
    },
    // La "r" nativa queda visible mientras carga la webview; la web la oculta apenas pinta su loader
    // (AppSplash). La duración es el tope por si la página no llega.
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 6000,
      launchFadeOutDuration: 200,
      backgroundColor: "#0A0B0D",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    PushNotifications: {
      presentationOptions: ["sound", "alert"],
    },
    GoogleSignIn: {
      scopes: ["profile", "email"],
      serverClientId: process.env.GOOGLE_CLIENT_ID,
      iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;

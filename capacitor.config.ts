import type { CapacitorConfig } from "@capacitor/cli";
import type {} from "@capacitor/push-notifications";

const config: CapacitorConfig = {
  appId: "com.emnetwork.root",
  appName: "root",
  // Mismo fondo que el splash nativo y el loader web: sin destello blanco mientras carga la webview.
  backgroundColor: "#0A0B0D",
  // Next uses dynamic routes: the native shell loads server.url, not a static export.
  webDir: "native-shell",
  server: {
    url: "http://192.168.1.9:3000",
    cleartext: true, // Permite conexiones HTTP (sin SSL) en el emulador
    allowNavigation: ["*"],
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

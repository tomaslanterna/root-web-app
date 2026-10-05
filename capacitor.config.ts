import type { CapacitorConfig } from "@capacitor/cli";
import type {} from "@capacitor/push-notifications";

const config: CapacitorConfig = {
  appId: "com.emnetwork.root",
  appName: "root-electronic-network",
  // Next uses dynamic routes: the native shell loads server.url, not a static export.
  webDir: "native-shell",
  server: {
    // Aquí ponemos la IP de tu red local y el puerto de Next.js
    url: "https://root-web-app.vercel.app",
    cleartext: true, // Permite conexiones HTTP (sin SSL) en el emulador
    allowNavigation: ["*"],
  },
  plugins: {
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

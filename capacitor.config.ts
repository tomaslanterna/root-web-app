import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.emnetwork.root",
  appName: "root-electronic-network",
  // Cambiamos 'public' por 'out' porque es el estándar cuando se exporta Next.js (aunque para el Live Reload no se usará)
  webDir: "out",
  server: {
    // Aquí ponemos la IP de tu red local y el puerto de Next.js
    url: "http://192.168.1.9:3000/feed",
    cleartext: true, // Permite conexiones HTTP (sin SSL) en el emulador
    allowNavigation: ["*"],
  },
  plugins: {
    GoogleSignIn: {
      scopes: ["profile", "email"],
      serverClientId: process.env.GOOGLE_CLIENT_ID,
      iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;

# Probar notificaciones en un Android, sin publicar en Google Play

## Qué está implementado

Notificaciones de mensajes nuevos de chats directos, crews/squads y cualquier conversación que use las tablas existentes de chat. Las push complementan al WebSocket, no lo reemplazan. No se envían al autor del mensaje ni a usuarios ajenos a la conversación. Se omiten los mensajes ya leídos antes de procesar la cola. El cuerpo es genérico para no exponer conversaciones en la pantalla bloqueada. Tocar el aviso abre `/chat/{id}` después de comprobar el destinatario actual.

La activación es voluntaria, por dispositivo, desde **Perfil → Configuración → Activar notificaciones**. Se vuelve a registrar al iniciar sesión/recargar si ese usuario había activado la opción. El cierre de sesión revoca la instalación en el servidor y elimina el token nativo. Si falla la baja del servidor, se intenta invalidar el token de Firebase. Si ambas fallan, se pide reconectar para cerrar sesión de forma segura.

Esta etapa es solo Android nativo. Abrir localhost en Chrome no prueba el plugin. No incluye Web Push ni APNs/iOS, avisos de nuevos matches ni anuncios de comunidades. Tampoco se deduce “entregado”/“leído” de la aceptación de FCM: siguen siendo confirmaciones reales del chat.

## 1. Preparar Firebase (gratuito para Cloud Messaging)

1. Entrar a [Firebase Console](https://console.firebase.google.com/) y crear/elegir un proyecto. No hace falta activar Analytics, Firestore ni Functions para esta integración.
2. Agregar una **app Android** con el paquete exacto `com.emnetwork.root` (ya está en `android/app/build.gradle`). Para push no es necesario SHA-1; el login nativo con Google sí tiene su configuración OAuth aparte. Para la primera prueba podés usar email y contraseña.
3. Descargar `google-services.json` y ponerlo en `android/app/google-services.json` del frontend. Es la configuración Android, **no** la clave privada del servidor.
4. En Configuración del proyecto → Cloud Messaging, comprobar que **Firebase Cloud Messaging API (V1)** esté habilitada.
5. En Configuración del proyecto → Cuentas de servicio, generar una clave privada y guardar el JSON solamente en el backend, por ejemplo `secrets/firebase-service-account.json`. No pegar su contenido en el chat, no ponerlo en `public`, no subirlo a Git ni incluirlo en la app. En producción, preferir credenciales de identidad del entorno cuando estén disponibles.
6. Agregar en el `.env` del backend (el ID es el del proyecto Firebase, no el app ID):

```dotenv
PUSH_ENABLED=true
FIREBASE_PROJECT_ID=tu-id-de-proyecto
GOOGLE_APPLICATION_CREDENTIALS=./secrets/firebase-service-account.json
```

7. Reiniciar el backend desde su carpeta con `go run ./cmd/api`. Sin estas variables, sigue funcionando el chat pero el servidor no enviará push. El arranque crea el esquema requerido de forma transaccional; no ejecutar un script manual en otra base.

El JSON de Android y las claves del servidor deben corresponder al mismo proyecto. La cuenta del servidor necesita permiso para enviar mensajes FCM; un 403 suele indicar API/permisos/proyecto incorrectos. Ver [autenticación de FCM](https://firebase.google.com/docs/cloud-messaging/send/v1-api) y [plugin de Capacitor](https://capacitorjs.com/docs/apis/push-notifications).

## 2. Preparar Android Studio y el teléfono

1. Instalar [Android Studio](https://developer.android.com/studio). Para Capacitor 8 usar 2025.2.1 o posterior; este proyecto compila con SDK 36 y Java 21. Android Studio incluye Java: seleccionar su JDK integrado si Gradle pide uno. Desde SDK Manager instalar Android SDK Platform 36 y Platform-Tools. [Requisitos de Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup).
2. Usar un Android 7 o posterior con Google Play Services e internet. Activar Opciones de desarrollador → Depuración USB.
3. Conectarlo por USB y aceptar en el teléfono la autorización para esta PC. [Guía oficial de dispositivos](https://developer.android.com/studio/run/device).

## 3. Conectar el Android a los servidores de esta PC por USB

Esta opción evita depender de la IP del Wi-Fi. Mantener el teléfono conectado durante la prueba local.

En una terminal del frontend:

```powershell
$androidAdb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $androidAdb devices
& $androidAdb reverse tcp:3000 tcp:3000
& $androidAdb reverse tcp:8080 tcp:8080
```

Debe aparecer el teléfono como `device`, no `unauthorized`. Si hay varios dispositivos, agregar `-s SERIAL` antes de cada comando `reverse`. Si instalaste el SDK en otra ubicación, usar el path que muestra Android Studio. Repetir el port forwarding al reconectar el cable. [Referencia de ADB](https://developer.android.com/tools/adb).

En el `.env.local` del frontend, verificar:

```dotenv
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8080
```

Mantener corriendo el frontend (`npm run dev`) y el backend (`go run ./cmd/api`, en su repo). Reiniciar Next si cambiaste el `.env.local`. No reemplazar ni borrar otras variables existentes.

Después, desde el frontend:

```powershell
$env:CAPACITOR_SERVER_URL = "http://localhost:3000/feed"
npm run android:sync
npm run android:open
```

`android:sync` copia la configuración y registra los plugins nativos. El proyecto Android ya está creado: no repetir `cap add android`. La shell `native-shell/` permite sincronizar sin un export estático, que no sería compatible con las rutas dinámicas actuales. Esta versión carga Next desde el servidor configurado, igual que la integración Capacitor existente. **La PC y los servidores deben quedar encendidos**, también para abrir el chat al tocar el aviso. En producción usar un servidor HTTPS; el manifiesto de depuración permite HTTP solo para desarrollo.

## 4. Instalar y probar

1. En Android Studio, esperar la sincronización de Gradle, elegir el teléfono y pulsar **Run ▶**. Eso compila e instala una versión de depuración directamente: no necesita cuenta de Google Play ni subir la app a la tienda.
2. Iniciar sesión con el **usuario receptor** en el teléfono.
3. Abrir Configuración, pulsar **Activar notificaciones** y aceptar el permiso de Android 13+ si aparece. Debe mostrarse “Notificaciones activadas en este dispositivo”.
4. En la PC, iniciar sesión con **otra cuenta** y abrir un chat con el receptor; también sirve un squad donde ambos sean miembros.
5. En el teléfono, salir al inicio de Android (botón Home) o bloquear la pantalla. Enviar un mensaje desde la PC. Esperar unos segundos: debe llegar “Nuevo mensaje en root”.
6. Tocar el aviso: debe abrir la conversación correcta. Al leerla, las palomitas siguen actualizándose por WebSocket.
7. Cambiar entre cuentas y cerrar sesión en el teléfono. La cuenta anterior no debe seguir recibiendo nuevos avisos. Volver a entrar permite reactivar/registrar esa cuenta.
8. Probar **Desactivar notificaciones**, enviar otro mensaje y comprobar que no llegue un nuevo aviso a esa instalación.

No usar “Forzar detención” desde Ajustes como prueba de app cerrada: Android puede bloquear FCM hasta que abras la app otra vez. Revisar permiso de notificaciones y canal **Mensajes**, conexión, Google Play Services y restricciones de batería del fabricante. La entrega es best effort: no se promete llegar en todos los estados del sistema.

## Verificación y límites

`npm run test:push` ejecuta pruebas de registro, navegación segura, rotación de token y revocación. El backend tiene pruebas unitarias de HTTP/worker/FCM y una integración PostgreSQL que crea y elimina únicamente un esquema propio de prueba (`PUSH_TEST_DATABASE_URL`, o `PUSH_TEST_USE_LOCAL_ENV=1` para el `.env` local).

La cola se guarda junto con la inserción del mensaje y usa claves únicas, leases y `SKIP LOCKED` para varias instancias. Reintenta hasta cinco veces con backoff y descarta mensajes de más de 24 horas; limpia trabajos de más de siete días. Ante un timeout después de que FCM aceptó, podría repetirse un envío: el tag por chat reemplaza la notificación anterior en Android. Las push no son una fuente alternativa del historial.

El backend guarda una fila por instalación y permite varios teléfonos por usuario. Cambiar el origen de la web nativa (por ejemplo, LAN a localhost) cambia el localStorage; el token único del backend evita duplicar instalaciones para el mismo token.

No se pudo verificar una notificación real ni generar un APK sin las credenciales de Firebase, Android Studio/SDK y un teléfono conectado. Nunca usar tokens o claves ficticios para declarar que el envío funciona.

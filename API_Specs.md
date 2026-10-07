# Especificaciones de API y Arquitectura Frontend

Este documento detalla el relevamiento funcional del proyecto `root-web-app` para definir los endpoints necesarios en la creación de una futura API, así como las recomendaciones de arquitectura de estado y sistema de chat en tiempo real.

---

## 1. Relevamiento de Endpoints (RESTful API)

Se estiman entre **20 y 25 endpoints principales** para cubrir la funcionalidad actual del prototipo. A continuación se detalla el contrato de Request/Response de cada uno (Alineado con las interfaces del Frontend en `mocks.ts`).

### Usuarios y Vibe Profile (Auth & Preferences)

- `POST /v1/auth/login` (Autenticación y registro).
  - **Request Body**: `{ "email": "user@example.com", "password": "..." }`
  - **Response (200 OK)**: `{ "token": "jwt-token-string", "user": { "id": "1", "name": "Admin Root", "username": "admin", "role": "ADMIN", "avatarUrl": "https://...", "isKycVerified": true } }`

- `GET /v1/users/me` (Traer datos del usuario actual y su Vibe Profile).
  - **Response (200 OK)**: `{ "id": "1", "name": "Admin Root", "username": "admin", "role": "ADMIN", "avatarUrl": "https://...", "isKycVerified": true, "vibeProfile": { "favoriteGenres": ["Melodic Techno", "Progressive House"], "departureZone": "Palermo / Recoleta", "partyStyle": "full_night", "verifiedKycOnly": true, "spotifyConnected": true } }`

- `PUT /v1/users/me` (Actualizar preferencias del Vibe Profile).
  - **Request Body**: `{ "vibeProfile": { "favoriteGenres": ["Hard Techno"], "departureZone": "Costanera", "partyStyle": "chill_previa" } }`
  - **Response (200 OK)**: `{ "success": true, "user": { ... } }`

- `GET /v1/users/:id` (Ver el perfil público de otra persona).
  - **Response (200 OK)**: `{ "id": "2", "name": "Alex RRPP", "username": "alex_rrpp", "avatarUrl": "https://...", "isKycVerified": true, "publicVibeProfile": { "favoriteGenres": ["Hard Techno"] } }`

### Feed y Publicaciones

- `GET /v1/posts?filter=all|featured|following` (Traer el feed dinámico paginado).
  - **Response (200 OK)**: `{ "data": [ { "id": "p1", "authorId": "2", "eventId": "e1", "communityId": null, "title": "Lanzamiento de tickets", "content": "¡Ya están disponibles...", "longContent": "La preventa oficial...", "headerImageUrl": "https://...", "timestamp": "2024-02-15T10:00:00Z", "likesCount": 145 } ], "meta": { "nextPage": 2 } }`

- `POST /v1/posts` (Crear una nueva publicación).
  - **Request Body**: `{ "title": "...", "content": "...", "longContent": "...", "headerImageUrl": "...", "eventId": "e1", "communityId": null }`
  - **Response (201 Created)**: `{ "id": "p2", "authorId": "1", "timestamp": "2024-02-15T12:00:00Z", ... }`

- `POST /v1/posts/:id/like` (Dar/Quitar me gusta a una publicación).
  - **Request Body**: `{ "action": "like" | "unlike" }`
  - **Response (200 OK)**: `{ "success": true, "likesCount": 146 }`

- `POST /v1/posts/:id/comments` (Comentar en una publicación o evento).
  - **Request Body**: `{ "content": "Excelente data" }`
  - **Response (201 Created)**: `{ "id": "cm1", "targetId": "p1", "authorId": "1", "content": "Excelente data", "timestamp": "2024-02-15T12:05:00Z" }`

### Eventos y Entradas

- `GET /v1/events` (Listado público de próximos eventos, con autenticación opcional para incluir `userRsvp`).
  - **Query params combinables**: `featured`, `genre`, `location`, `minPrice`, `maxPrice`, `isFree`, `startDate`, `endDate`, `query`, `limit`, `offset`.
  - `startDate` y `endDate` aceptan RFC3339 o `YYYY-MM-DD`; el frontend envía instantes UTC RFC3339.
  - `isFree=true` incluye únicamente precio explícito `0`; `isFree=false` únicamente precios mayores a `0`. Precio desconocido (`null`) no se considera gratis.
  - Solo devuelve eventos con `date >= NOW()`, ordenados por `date ASC, id ASC`. `limit` predeterminado: 12; máximo: 50.
  - **Response (200 OK)**: `{ "data": [ { "id": "e1", "title": "AFTERLIFE BUENOS AIRES", "date": "2026-09-08T23:00:00Z", "location": "Mandarine Park", "cinematicBannerUrl": "https://...", "description": "Una odisea visual...", "lineup": ["Tale Of Us"], "genre": "Electrónica", "price": 45000, "isFree": false, "goingCount": 184, "notGoingCount": 46, "userRsvp": "going" } ], "meta": { "total": 15, "limit": 12, "offset": 0, "hasMore": true } }`
  - Parámetros inválidos devuelven `400 Bad Request`.

- `GET /v1/events/:id` (Obtener detalles de un evento particular).
  - **Response (200 OK)**: `{ "id": "e1", "title": "AFTERLIFE BUENOS AIRES", "producerId": "p1", "date": "2024-03-08", "location": "Mandarine Park", "cinematicBannerUrl": "https://...", "description": "Una odisea visual...", "lineup": ["Tale Of Us", "Anyma"], "goingCount": 184, "notGoingCount": 46 }`

- `POST /v1/events/:id/rsvp` (Acción de Voy / No Voy).
  - **Request Body**: `{ "status": "going" | "not_going" }`
  - El usuario se obtiene exclusivamente del JWT. Campos adicionales como `userId` son rechazados.
  - **Response (200 OK)**: `{ "success": true, "goingCount": 185, "notGoingCount": 46, "userRsvp": "going" }`

- `GET /v1/events/:id/attendees/followed?limit=20&offset=0` (Personas que el usuario autenticado sigue y marcaron `going`).
  - La restricción se aplica en PostgreSQL mediante `users.following`; nunca devuelve asistentes no seguidos.
  - **Response (200 OK)**: `{ "data": [ { "id": "u2", "name": "Alex", "username": "alex", "avatarUrl": "https://...", "isKycVerified": true } ], "meta": { "total": 1, "limit": 20, "offset": 0, "hasMore": false } }`

- `GET /v1/events/:id/comments?limit=20&offset=0` (Comentarios públicos, del más reciente al más antiguo).
  - **Response (200 OK)**: `{ "data": [ { "id": "c1", "targetId": "e1", "authorId": "u2", "authorName": "Alex", "authorUsername": "alex", "content": "Nos vemos ahí", "timestamp": "2026-09-01T18:00:00Z" } ], "meta": { "total": 1, "limit": 20, "offset": 0, "hasMore": false } }`

- `POST /v1/events/:id/comments` (Crear comentario autenticado).
  - **Request Body**: `{ "content": "Nos vemos ahí" }` (1 a 1000 caracteres después de recortar espacios).
  - **Response (201 Created)**: comentario creado con datos públicos del autor.

- `GET /v1/events/:id/tickets` (Ver entradas de reventa disponibles).
  - **Response (200 OK)**: `{ "data": [ { "id": "t1", "eventId": "e1", "sellerId": "2", "price": 45000, "status": "AVAILABLE" } ] }`

### Comunidades

- `GET /v1/communities?country=UY&category=electronica&department=Rio%20Negro&query=reggaeton&limit=12&offset=0` (Descubrimiento público con filtros combinables y paginación; texto, categorías y departamentos ignoran mayúsculas y tildes).
  - **Response (200 OK)**: `{ "data": [ { "id": "c1", "slug": "electronica", "name": "Electrónica", "category": "electrónica", "zone": "Uruguay", "countryId": "UY", "coverImageUrl": "", "membersCount": 1250, "description": "...", "isMember": false, "canPublish": false, "isActive": true } ], "meta": { "total": 1, "limit": 12, "offset": 0, "hasMore": false } }`

- `GET /v1/communities/:id-or-slug` (Detalle público; con JWT opcional incluye `isMember` y `canPublish`).

- `POST /v1/communities/:id-or-slug/join` (Membresía autenticada e idempotente; no lleva body).
  - **Response (200 OK)**: `{ "isMember": true, "membersCount": 1251 }`

- `DELETE /v1/communities/:id-or-slug/membership` (Salir de forma autenticada e idempotente).
  - **Response (200 OK)**: `{ "isMember": false, "membersCount": 1250 }`

- `GET /v1/users/me/communities` (Comunidades del usuario autenticado).

- `GET /v1/communities/:id-or-slug/announcements?limit=10&offset=0` (Canal de anuncios público, ordenado del más reciente al más antiguo).
  - **Response (200 OK)**: `{ "data": [ { "id": "p1", "communityId": "c1", "authorId": "rrpp1", "title": "Nueva fecha", "content": "...", "timestamp": "2026-10-01T18:00:00Z" } ], "meta": { "total": 1, "limit": 10, "offset": 0, "hasMore": false } }`

- `POST /v1/communities/:id-or-slug/announcements` (Solo `ADMIN`, propietario legado o RRPP asignado en `community_managers`).
  - **Request Body**: `{ "title": "Nueva fecha", "content": "...", "headerImageUrl": "posts/...jpg", "eventId": "e1" }`
  - **Response**: `201 Created`; `403` para miembros sin permiso y `404` si la comunidad no existe.

Las comunidades son predefinidas por el sistema. No existe un endpoint público para crearlas y las Crews conservan su flujo independiente.

### Crews Matcher (Event Squads)

- `GET /v1/crews/deck` (El motor de matchmaking devuelve un mazo de Squads sugeridos).
  - **Response (200 OK)**: `{ "data": [ { "id": "sq1", "eventId": "e1", "name": "Afterlife Melodic Crew BA", "members": [ { "userId": "1", "hasTicket": true, "joinedAt": "2024-02-17T10:00:00Z", "role": "host" } ], "matchScore": 96, "departureZone": "Palermo / Recoleta", "chatRoomId": "sq_chat_1", "status": "active", "createdAt": "2024-02-17T10:00:00Z", "expiresAt": "2024-03-10T12:00:00Z" } ] }`

- `POST /v1/crews/swipe` (EventSwipeAction).
  - **Request Body**: `{ "eventId": "e1", "direction": "like" | "pass" | "superlike", "lookingForSquad": true }`
  - **Response (200 OK)**: `{ "success": true, "isMatch": true, "matchDetails": { "squadId": "sq1", "chatRoomId": "sq_chat_1" } }`

- `GET /v1/crews/matches` (JWT obligatorio; squads reales del usuario autenticado).
  - **Response (200 OK)**: `{ "data": [{ "id": "UUID", "eventId": "UUID", "name": "New Crew", "eventTitle": "Evento", "eventImage": "", "location": "Lugar", "chatRoomId": "UUID", "status": "forming", "createdAt": "RFC3339", "expiresAt": "RFC3339", "members": [{ "userId": "UUID", "name": "Nombre", "username": "alias", "avatarUrl": null, "hasTicket": false, "joinedAt": "RFC3339", "role": "member" }] }] }`.
  - No incluye usuarios/grupos mock ni un porcentaje de compatibilidad inventado. El usuario se obtiene del JWT, no del perfil de preferencias.
- `POST /v1/events/{eventId}/swipes` (JWT obligatorio).
  - Body: `{ "direction": "like" | "pass" | "superlike", "preferences": { ... } }`.
  - Respuesta: `{ "status": "queued" }` o `{ "status": "matched", "crew": <squad del contrato anterior> }`.
  - Mantiene la política actual de emparejamiento por pares; no implementa un nuevo algoritmo de afinidades. Squad, conversación CREWS, integrantes y swipes reclamados se guardan en una transacción. Las solicitudes concurrentes/repetidas reutilizan el match existente.
- `POST /v1/crews/{id}/chat` (JWT obligatorio, sin body).
  - Respuesta: `{ "chatId": "UUID" }`. Resuelve/repara idempotentemente el chat de un squad histórico usando `squads.chat_room_id` y `squad_members` reales. No acepta integrantes enviados por el cliente.
  - `400` ID inválido, `401` sin sesión, `403` no miembro, `404` inexistente, `409` relación incompatible con otro chat.
  - Publica `chat.created` al crear la conversación o incorporar participantes faltantes. Solo sus participantes reciben el evento.

`/chat/squad/[id]` y `/chat/[id]` reutilizan la misma pantalla y el mismo transporte WebSocket, historial, recibos y reintentos. Los endpoints antiguos `/crews/deck` y `/crews/swipe` permanecen como legado mock y no son utilizados por este flujo.

---

## 2. Arquitectura del Frontend (Manejo de Estados)

Se recomienda un **enfoque Híbrido (Server State + Global State)** para mantener la escalabilidad y performance de la aplicación.

1. **Estado de Servidor (React Query o SWR):**
   Utilizado para toda la data transaccional que viene de la API (Feed, Eventos, Comunidades).
   - Beneficios: Caché automático, reintentos (retries) de fallos de red y _optimistic updates_ (actualizaciones instantáneas en la UI sin esperar al servidor, ej: al darle "Voy" a un evento).
2. **Estado Global (Zustand o Context API):**
   Utilizado **exclusivamente** para el estado de la sesión (`Auth`, `User`), el perfil de preferencias (`VibeProfile`) y controladores de UI de alto nivel (como si el menú `QuickActionMenu` está abierto).
3. **Estado de Componente (useState):**
   Para estados efímeros que no interesan al resto de la app (animaciones del swipe, tab activa actual del Feed, inputs controlados de formularios).

---

## 3. Arquitectura y Abstracción del Sistema de Chats

El chat utiliza HTTP para enviar mensajes y cargar historial, y WebSocket nativo para recibir mensajes nuevos y cambios de recibos. No realiza polling.

### Estrategia de Conexión

1. `GET /v1/chats/ws`: upgrade a WebSocket. El primer frame es `{ "type": "authenticate", "token": "<JWT actual>" }`. No se aceptan tokens ni otros parámetros en la URL. La conexión cierra con `4401` si la sesión es inválida o expira.
2. Eventos: `ready`, `resync`, `chat.created`, `message.created` y `message.updated`. `chat.created` incluye `chat_id`; los dos últimos contienen `chat_id` y `message` con los campos `id`, `sender_id`, `content`, `timestamp`, `type`, `status`, `read_at` y `delivered_at`. El servidor restringe cada evento a participantes actuales.
3. `GET /v1/chats`: array de conversaciones con `participants`, `last_message`, `updated_at` y `unread_count`.
4. `GET /v1/chats/:id/messages`: array de los últimos 50 mensajes, cronológico con desempate por ID. `before=<RFC3339>|<UUID>` permite cargar mensajes anteriores. Consultar el historial no marca lectura.
5. `POST /v1/chats/:id/messages`: `{ "content": "Hola", "type": "text", "client_message_id": "<UUID>" }`. El mismo UUID se reutiliza en reintentos para evitar duplicados. Máximo 4000 caracteres; `system` queda reservado al servidor.
6. `POST /v1/chats/:id/receipts`: `{ "message_ids": ["<UUID>"], "read": false }` confirma entrega; `read: true` confirma lectura. Máximo 100 IDs, identidad del JWT y validación de pertenencia al chat.

### Arquitectura de UI

- `ChatRealtimeProvider` abre una conexión por sesión, limpia al salir y reconecta con espera progresiva. Los hooks se suscriben antes de cargar el historial y sincronizan al reconectar para recuperar mensajes perdidos.
- `src/services/chat.ts` concentra HTTP y transporte. `useChat` combina respuestas por UUID, mantiene estados monotónicos y pagina el historial. `useChatDirectory` actualiza la bandeja en respuesta a eventos.
- `sent` significa guardado; `delivered`, recibido por los otros participantes; `read`, leído por ellos. `sending` y `failed` son locales. La lectura depende de visibilidad del mensaje y de una pestaña visible/enfocada; una respuesta no implica lectura.
- PostgreSQL LISTEN/NOTIFY distribuye eventos entre instancias después del commit. Configuración de orígenes, conexión directa a la base, TLS/proxy y pruebas se documenta en `root-backend-service/CHAT_REALTIME.md`.

## 4. Comunidades: membresía, lectura y moderación

`GET /v1/communities` conserva los filtros combinables y la respuesta `{ data, meta: { total, limit, offset, hasMore } }`. Añade `scope=mine` (JWT obligatorio) y `scope=explore` (excluye las comunidades propias si hay sesión). Sin `scope` mantiene el listado anterior. `limit` 1–50, por defecto 12. El servidor obtiene la identidad del JWT, nunca de parámetros del cliente.

Cada comunidad incluye `unreadCount`, `muted` y, si existe un RRPP responsable, `contact: { id, name, username, avatarUrl }`. El contacto prioriza al propietario RRPP y luego un manager RRPP; no inventa un administrador. Contactar usa el endpoint de chat directo existente.

- `PUT /v1/communities/{id}/membership/preferences`: `{ muted: boolean }`, solo miembros. Silencia el indicador de novedades, sin abandonar la comunidad ni modificar notificaciones de chats. No implementa push de anuncios.
- `POST /v1/communities/{id}/read`: `{ postId: UUID }`, solo miembros. El listado de anuncios devuelve `readThroughPostId` calculado en el servidor, preservando precisión y desempates incluso con fijados. Marca lectura hasta ese anuncio cargado, con watermark `(timestamp, id)` monotónico. Anuncios concurrentes posteriores permanecen sin leer. Los anuncios anteriores a la incorporación no cuentan como nuevos.
- `PUT /v1/communities/{id}/announcements/{postID}/pin`: `{ pinned: boolean }`, solo ADMIN o RRPP autorizado por la comunidad. El listado se ordena por `is_pinned DESC, timestamp DESC, id DESC` en PostgreSQL; cada anuncio incluye `isPinned`.
- `POST /v1/communities/{id}/reports`: JWT, `{ targetType: "post" | "comment", targetId: UUID, reason: "spam" | "abuse" | "other", details: string }`. Detalles recortados, máximo 1000 caracteres. Verifica que el anuncio/comentario pertenezca a esa comunidad. Un reporte por usuario y contenido, idempotente. Devuelve `{ id }`.
- `GET /v1/communities/{id}/reports?limit=10&offset=0`: solo administración autorizada, pendientes paginados, snapshot de contenido y nombre del denunciante. Nunca devuelve reportes a otros miembros.
- `PATCH /v1/communities/{id}/reports/{reportID}`: `{ status: "reviewed" | "dismissed" }`, solo administración autorizada; guarda quién revisó y cuándo. No elimina contenido.

Todas las escrituras tienen autenticación y validación estricta del JSON (incluida prohibición de `userId`). Errores: 400 solicitud inválida, 401 sin sesión, 403 sin permiso, 404 comunidad/contenido inexistente, 500 persistencia fallida. Se reutilizan `community_members`, `posts`, `comments` y `community_managers`; `community_reports` es la única tabla nueva.

### Navegación de mensajes

Comunidades reemplaza Chat en la navegación principal. El Feed abre `/chat?from=feed` por botón o swipe horizontal izquierdo, mediante un slot interceptado limitado al Feed. Mantiene el Feed montado e inerte, bloquea el scroll de fondo y restaura foco/scroll al regresar. Recarga y accesos directos usan `/chat` normal. Conversaciones, squads y destinos de push siguen usando sus rutas originales y el mismo `ChatRealtimeProvider`.

`FeedLayout` conserva una única instancia de la bandeja: durante el arrastre la revela desde la derecha en proporción 1:1 con el dedo, sin navegar todavía. Al superar el umbral y soltar completa la transición y actualiza la ruta; un gesto corto/cancelado vuelve a cero sin crear historial. La vuelta revela el Feed durante el arrastre derecho. Scroll vertical, carruseles, formularios y modales quedan excluidos; movimiento reducido evita desplazamientos visuales.

Android usa `@capacitor/app` con un solo listener `backButton`, registrado/limpiado desde `CapacitorSetup`: primero cierra el overlay activo; luego vuelve en el historial o al padre de un deep link. Solo `/` y `/feed` ofrecen confirmar la salida mediante `ConfirmModal`. `SystemBars` de Capacitor 8 aporta los insets y el dock suma `--root-safe-bottom` a su margen inferior, con fallback al `env()` del navegador/iOS.

En el directorio, los filtros se muestran únicamente en Explorar. Cambiar a Mis comunidades cierra el panel y elimina los filtros de descubrimiento para listar todas las membresías propias.

### Verificación

Frontend: `npx tsc --noEmit --incremental false`; lint de archivos modificados; `node --test src/lib/horizontalSwipe.test.mjs src/hooks/useHorizontalSwipe.test.mjs src/lib/nativeBack.test.mjs src/services/notifications.test.mjs`.
Backend: `go test ./...`. Integración PostgreSQL opt-in: `COMMUNITY_TEST_DATABASE_URL` o `COMMUNITY_TEST_USE_LOCAL_ENV=1` y `go test ./internal/adapters/repository/postgres -run TestCommunityExperiencePostgresIntegration -v`. Crea un esquema aleatorio, verifica aislamiento y lo elimina al terminar; no modifica usuarios ni contenido reales.

## 5. Contrato de notificaciones push Android

- `GET /v1/push/status` (JWT) → `{ "enabled": boolean }`.
- `PUT /v1/push/devices/{installationUUID}` (JWT) → 204. Body: `{ "token": "<FCM token>", "platform": "android" }`. No acepta identidad del usuario en el body. 400 para campos/token/plataforma/UUID inválidos, 503 si Firebase no está configurado, 500 para errores de persistencia.
- `DELETE /v1/push/devices/{installationUUID}` (JWT) → 204 idempotente, restringido a la cuenta actual.

Las notificaciones se generan desde los mensajes persistidos de chats/squads con una cola transaccional. Payload: `type=chat.message`, `chat_id`, `message_id`, `recipient_id`. No muestran texto privado ni alteran recibos de entrega/lectura. El frontend pide permiso explícito desde Configuración, registra/renueva tokens y revoca al cerrar sesión. Navegar desde una notificación valida destinatario y UUID, y el chat conserva su autorización del backend.

Esta integración no incluye Web Push ni iOS/APNs. Preparación de Firebase y prueba por USB sin Google Play: `ANDROID_PUSH.md`; arquitectura/variables del servidor: `root-backend-service/PUSH_NOTIFICATIONS.md`.

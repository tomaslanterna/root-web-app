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

- `GET /v1/communities` (Listado general para la pestaña en el feed).
  - **Response (200 OK)**: `{ "data": [ { "id": "c1", "name": "Techno Argentina", "prOwnerId": "2", "coverImageUrl": "https://...", "membersCount": 1250, "description": "Comunidad oficial..." } ] }`

- `GET /v1/communities/:id` (Detalle de la comunidad y posteos internos).
  - **Response (200 OK)**: `{ "id": "c1", "name": "Techno Argentina", "prOwnerId": "2", "coverImageUrl": "https://...", "membersCount": 1250, "description": "Comunidad oficial...", "posts": [ ... ] }`

- `POST /v1/communities/:id/join` (Ingresar a una comunidad).
  - **Request Body**: `{ "action": "join" }`
  - **Response (200 OK)**: `{ "success": true, "membersCount": 1251 }`

### Crews Matcher (Event Squads)

- `GET /v1/crews/deck` (El motor de matchmaking devuelve un mazo de Squads sugeridos).
  - **Response (200 OK)**: `{ "data": [ { "id": "sq1", "eventId": "e1", "name": "Afterlife Melodic Crew BA", "members": [ { "userId": "1", "hasTicket": true, "joinedAt": "2024-02-17T10:00:00Z", "role": "host" } ], "matchScore": 96, "departureZone": "Palermo / Recoleta", "chatRoomId": "sq_chat_1", "status": "active", "createdAt": "2024-02-17T10:00:00Z", "expiresAt": "2024-03-10T12:00:00Z" } ] }`

- `POST /v1/crews/swipe` (EventSwipeAction).
  - **Request Body**: `{ "eventId": "e1", "direction": "like" | "pass" | "superlike", "lookingForSquad": true }`
  - **Response (200 OK)**: `{ "success": true, "isMatch": true, "matchDetails": { "squadId": "sq1", "chatRoomId": "sq_chat_1" } }`

- `GET /v1/crews/matches` (Listado de Squads confirmados a los que pertenecés).
  - **Response (200 OK)**: `{ "data": [ { "id": "sq1", "name": "Afterlife Melodic Crew BA", "chatRoomId": "sq_chat_1", "status": "active" } ] }`

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

El chat es un ecosistema que requiere comunicación bidireccional y tiempo real. Se abstraerá de las peticiones REST tradicionales para evitar la sobrecarga del servidor (_polling_).

### Estrategia de Conexión

1. **Protocolo WebSockets:**
   Implementar `Socket.io` (si el backend es Node.js) o conectores administrados (Supabase Realtime, Pusher).
2. **Endpoints Híbridos (REST de respaldo):**
   - `GET /v1/chats` (Listar bandeja de entrada).
     - **Response (200 OK)**: `{ "data": [ { "id": "ch1", "participants": [ { "id": "1", "name": "Admin Root" }, { "id": "2", "name": "Alex RRPP" } ], "lastMessage": "Perfecto, te paso el ticket por acá.", "updatedAt": "2024-02-17T15:30:00Z" } ] }`
   - `GET /v1/chats/:id/messages?page=1` (Cargar historial antiguo).
     - **Response (200 OK)**: `{ "data": [ { "id": "sqm_1", "squadId": "sq1", "senderId": "system", "content": "¡Match de Crew completado!", "type": "system_icebreaker", "timestamp": "2024-02-17T10:30:00Z" } ], "meta": { "nextPage": 2 } }`

### Arquitectura de UI

- **ChatEngineProvider:** Un provider global que establece y mantiene activa la conexión WebSocket desde el login. Escucha eventos globales (ej. `onNewMessage`) y actualiza silenciosamente los contadores de notificaciones (bagdes en la navegación).
- **Almacenamiento Local (Caché):** Utilizar `IndexedDB` o `LocalStorage` para persistir los últimos mensajes. Esto permite un renderizado instantáneo (como WhatsApp) al abrir un chat, mientras sincroniza cambios asincrónicamente de fondo.
- **Componentes Orientados a Eventos:** Renderizado dinámico de burbujas. En los Crews, se desarrollarán `SystemBubble` y `IcebreakerBubble` para destacar visualmente acciones administrativas o "rompehielos" automatizados, en contraposición a los simples mensajes de texto.

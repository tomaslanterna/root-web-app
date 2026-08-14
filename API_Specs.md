# Especificaciones de API y Arquitectura Frontend

Este documento detalla el relevamiento funcional del proyecto `root-web-app` para definir los endpoints necesarios en la creación de una futura API, así como las recomendaciones de arquitectura de estado y sistema de chat en tiempo real.

---

## 1. Relevamiento de Endpoints (RESTful API)

Se estiman entre **20 y 25 endpoints principales** para cubrir la funcionalidad actual del prototipo.

### Usuarios y Vibe Profile (Auth & Preferences)
- `POST /api/auth/login` (Autenticación y registro).
- `GET /api/users/me` (Traer datos del usuario actual y su Vibe Profile).
- `PUT /api/users/me` (Actualizar preferencias musicales, tipos de fiesta, tags de vibra).
- `GET /api/users/:id` (Ver el perfil público de otra persona).

### Feed y Publicaciones
- `GET /api/posts?filter=all|featured|following` (Traer el feed dinámico paginado).
- `POST /api/posts` (Crear una nueva publicación).
- `POST /api/posts/:id/like` (Dar/Quitar me gusta a una publicación).
- `POST /api/posts/:id/comments` (Comentar en una publicación).

### Eventos y Entradas
- `GET /api/events?featured=true` (Traer la lista de eventos).
- `GET /api/events/:id` (Obtener detalles de un evento particular).
- `POST /api/events/:id/rsvp` (Acción de Voy / No Voy para alterar la estadística visual del evento).
- `POST /api/events/:id/tickets` (Gestión de compra o reventa de entradas).

### Comunidades
- `GET /api/communities` (Listado general para la pestaña en el feed).
- `GET /api/communities/:id` (Detalle de la comunidad y posteos internos).
- `POST /api/communities/:id/join` (Ingresar a una comunidad).

### Crews Matcher (Motor tipo "Tinder")
- `GET /api/crews/deck` (El motor de matchmaking devuelve un mazo de cards de eventos/crews según el Vibe Profile).
- `POST /api/crews/swipe` (Enviar la acción: `direction: right|left`, enviando `eventId` y `crewId`).
- `GET /api/crews/matches` (Listado de Crews confirmadas a las que pertenecés tras un match exitoso).
- `POST /api/crews/:id/utilities` (Para disparar acciones especiales de Crew, como fijar el punto de encuentro).

---

## 2. Arquitectura del Frontend (Manejo de Estados)

Se recomienda un **enfoque Híbrido (Server State + Global State)** para mantener la escalabilidad y performance de la aplicación.

1. **Estado de Servidor (React Query o SWR):** 
   Utilizado para toda la data transaccional que viene de la API (Feed, Eventos, Comunidades).
   - Beneficios: Caché automático, reintentos (retries) de fallos de red y *optimistic updates* (actualizaciones instantáneas en la UI sin esperar al servidor, ej: al darle "Voy" a un evento).
2. **Estado Global (Zustand o Context API):**
   Utilizado **exclusivamente** para el estado de la sesión (`Auth`, `User`), el perfil de preferencias (`VibeProfile`) y controladores de UI de alto nivel (como si el menú `QuickActionMenu` está abierto).
3. **Estado de Componente (useState):**
   Para estados efímeros que no interesan al resto de la app (animaciones del swipe, tab activa actual del Feed, inputs controlados de formularios).

---

## 3. Arquitectura y Abstracción del Sistema de Chats

El chat es un ecosistema que requiere comunicación bidireccional y tiempo real. Se abstraerá de las peticiones REST tradicionales para evitar la sobrecarga del servidor (*polling*).

### Estrategia de Conexión
1. **Protocolo WebSockets:**
   Implementar `Socket.io` (si el backend es Node.js) o conectores administrados (Supabase Realtime, Pusher).
2. **Endpoints Híbridos (REST de respaldo):**
   - `GET /api/chats` (Listar bandeja de entrada).
   - `GET /api/chats/:id/messages?page=1` (Cargar historial antiguo al abrir la vista de chat).

### Arquitectura de UI
- **ChatEngineProvider:** Un provider global que establece y mantiene activa la conexión WebSocket desde el login. Escucha eventos globales (ej. `onNewMessage`) y actualiza silenciosamente los contadores de notificaciones (bagdes en la navegación).
- **Almacenamiento Local (Caché):** Utilizar `IndexedDB` o `LocalStorage` para persistir los últimos mensajes. Esto permite un renderizado instantáneo (como WhatsApp) al abrir un chat, mientras sincroniza cambios asincrónicamente de fondo.
- **Componentes Orientados a Eventos:** Renderizado dinámico de burbujas. En los Crews, se desarrollarán `SystemBubble` y `IcebreakerBubble` para destacar visualmente acciones administrativas o "rompehielos" automatizados, en contraposición a los simples mensajes de texto.

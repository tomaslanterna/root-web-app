# Diseño de Base de Datos (PostgreSQL)

Este documento detalla el esquema de base de datos relacional propuesto para el proyecto `root-web-app`, diseñado específicamente para PostgreSQL. La estructura está alineada con las entidades del Frontend (`mocks.ts`) y los contratos de la API.

---

## 1. Tablas de Usuarios y Autenticación

### `users`
Almacena la información principal de los usuarios y credenciales.
- `id` (UUID, Primary Key, Default: gen_random_uuid())
- `email` (VARCHAR(255), Unique, Not Null)
- `password_hash` (VARCHAR(255), Not Null)
- `name` (VARCHAR(100), Not Null)
- `username` (VARCHAR(50), Unique, Not Null)
- `role` (VARCHAR(20), Not Null, Default: 'USER') - *Enum: 'USER', 'RRPP', 'ADMIN'*
- `avatar_url` (TEXT)
- `is_kyc_verified` (BOOLEAN, Default: false)
- `created_at` (TIMESTAMP, Default: NOW())
- `updated_at` (TIMESTAMP, Default: NOW())

### `vibe_profiles`
Relación 1 a 1 con `users`. Almacena las preferencias del Matcher.
- `user_id` (UUID, Primary Key, Foreign Key -> `users.id` ON DELETE CASCADE)
- `favorite_genres` (TEXT[]) - *Array de strings*
- `departure_zone` (VARCHAR(100))
- `party_style` (VARCHAR(50)) - *Enum: 'chill_previa', 'full_night', 'main_act_only'*
- `verified_kyc_only` (BOOLEAN, Default: false)
- `spotify_connected` (BOOLEAN, Default: false)

### `kyc_sessions`
Registra los intentos de validación de identidad para auditoría y proceso asíncrono.
- `id` (VARCHAR(100), Primary Key) - *Ej: 'kyc_sess_169...' o UUID*
- `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
- `status` (VARCHAR(30), Not Null, Default: 'CREATED') - *Enum: 'CREATED', 'DOCUMENT_UPLOADED', 'FACE_UPLOADED', 'PROCESSING', 'APPROVED', 'REJECTED', 'MANUAL_REVIEW'*
- `document_type` (VARCHAR(50), Default: 'ID_CARD') - *Ej: 'ID_CARD', 'PASSPORT'*
- `document_country` (VARCHAR(3), Default: 'URY') - *Código ISO del país, Ej: 'URY'*
- `doc_front_url` (TEXT) - *Ruta en S3*
- `doc_back_url` (TEXT) - *Ruta en S3*
- `face_url` (TEXT) - *Ruta en S3*
- `match_score` (DECIMAL(5,2)) - *Score devuelto por IA*
- `extracted_data` (JSONB) - *Nombre y número de documento extraídos*
- `failure_reason` (TEXT) - *Motivo de rechazo devuelto por la IA o el backend*
- `created_at` (TIMESTAMP, Default: NOW())
- `updated_at` (TIMESTAMP, Default: NOW())

---

## 2. Tablas de Eventos y Entradas

### `events`
Información sobre las fiestas y eventos publicados.
- `id` (UUID, Primary Key)
- `title` (VARCHAR(150), Not Null)
- `producer_id` (UUID, Foreign Key -> `users.id`)
- `date` (TIMESTAMP, Not Null)
- `location` (VARCHAR(255), Not Null)
- `cinematic_banner_url` (TEXT)
- `description` (TEXT)
- `lineup` (TEXT[]) - *Array de DJs/Artistas*
- `is_featured` (BOOLEAN, Default: false)
- `created_at` (TIMESTAMP, Default: NOW())
*(Nota: `going_count` y `not_going_count` se pueden calcular en base a la tabla `event_rsvps` o mantener desnormalizados como contadores actualizados por triggers).*

### `event_rsvps`
Registra la intención de asistencia de los usuarios (Voy / No Voy).
- `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
- `event_id` (UUID, Foreign Key -> `events.id` ON DELETE CASCADE)
- `status` (VARCHAR(20)) - *Enum: 'going', 'not_going', 'interested'*
- `created_at` (TIMESTAMP, Default: NOW())
- **Primary Key Compuesta**: `(user_id, event_id)`

### `tickets` (Reventa)
Gestión de entradas de reventa seguras.
- `id` (UUID, Primary Key)
- `event_id` (UUID, Foreign Key -> `events.id` ON DELETE CASCADE)
- `seller_id` (UUID, Foreign Key -> `users.id`)
- `buyer_id` (UUID, Foreign Key -> `users.id`, Nullable)
- `price` (DECIMAL(10,2), Not Null)
- `status` (VARCHAR(30), Not Null, Default: 'AVAILABLE') - *Enum: 'AVAILABLE', 'PENDING_CONFIRMATION', 'COMPLETED', 'DISPUTED', 'CANCELLED'*
- `created_at` (TIMESTAMP, Default: NOW())
- `updated_at` (TIMESTAMP, Default: NOW())

---

## 3. Tablas de Feed, Publicaciones y Comunidades

### `communities`
- `id` (UUID, Primary Key)
- `name` (VARCHAR(100), Not Null)
- `pr_owner_id` (UUID, Foreign Key -> `users.id`)
- `cover_image_url` (TEXT)
- `description` (TEXT)
- `created_at` (TIMESTAMP, Default: NOW())

### `community_members`
- `community_id` (UUID, Foreign Key -> `communities.id` ON DELETE CASCADE)
- `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
- `joined_at` (TIMESTAMP, Default: NOW())
- **Primary Key Compuesta**: `(community_id, user_id)`

### `posts`
Publicaciones en el Feed (pueden pertenecer a un evento, a una comunidad, o ser globales).
- `id` (UUID, Primary Key)
- `author_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
- `event_id` (UUID, Foreign Key -> `events.id` ON DELETE CASCADE, Nullable)
- `community_id` (UUID, Foreign Key -> `communities.id` ON DELETE CASCADE, Nullable)
- `title` (VARCHAR(255))
- `content` (TEXT, Not Null)
- `long_content` (TEXT)
- `header_image_url` (TEXT)
- `timestamp` (TIMESTAMP, Default: NOW())
*(Nota: `likesCount` y `commentsCount` se manejan vía conteo o triggers)*

### `post_likes`
- `post_id` (UUID, Foreign Key -> `posts.id` ON DELETE CASCADE)
- `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
- `created_at` (TIMESTAMP, Default: NOW())
- **Primary Key Compuesta**: `(post_id, user_id)`

### `comments`
Sistema polimórfico o genérico para comentarios (puede aplicar a posts o eventos).
- `id` (UUID, Primary Key)
- `target_type` (VARCHAR(20), Not Null) - *Enum: 'post', 'event'*
- `target_id` (UUID, Not Null) - *ID del post o evento asociado*
- `author_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
- `content` (TEXT, Not Null)
- `timestamp` (TIMESTAMP, Default: NOW())

---

## 4. Tablas de Crews Matcher (Event Squads)

### `squads` (Crews)
Grupos formados para asistir a un evento.
- `id` (UUID, Primary Key)
- `event_id` (UUID, Foreign Key -> `events.id` ON DELETE CASCADE)
- `name` (VARCHAR(100), Not Null)
- `departure_zone` (VARCHAR(100))
- `chat_room_id` (UUID, Unique) - *Referencia al ID del chat generado*
- `status` (VARCHAR(30), Not Null, Default: 'forming') - *Enum: 'forming', 'active', 'in_event', 'post_event', 'archived'*
- `created_at` (TIMESTAMP, Default: NOW())
- `expires_at` (TIMESTAMP, Not Null)

### `squad_members`
Integrantes de un Squad.
- `squad_id` (UUID, Foreign Key -> `squads.id` ON DELETE CASCADE)
- `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
- `role` (VARCHAR(20), Default: 'member') - *Enum: 'member', 'host'*
- `has_ticket` (BOOLEAN, Default: false)
- `joined_at` (TIMESTAMP, Default: NOW())
- **Primary Key Compuesta**: `(squad_id, user_id)`

---

## 5. Tablas de Chat (Tiempo Real)

### `chats`
Representa una sala de chat (puede ser 1 a 1, o grupal para un Squad).
- `id` (UUID, Primary Key)
- `type` (VARCHAR(20), Not Null) - *Enum: 'direct', 'squad'*
- `last_message` (TEXT)
- `updated_at` (TIMESTAMP, Default: NOW())
- `created_at` (TIMESTAMP, Default: NOW())

### `chat_participants`
- `chat_id` (UUID, Foreign Key -> `chats.id` ON DELETE CASCADE)
- `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
- `joined_at` (TIMESTAMP, Default: NOW())
- **Primary Key Compuesta**: `(chat_id, user_id)`

### `messages`
Historial de mensajes de texto y eventos del sistema (icebreakers).
- `id` (UUID, Primary Key)
- `chat_id` (UUID, Foreign Key -> `chats.id` ON DELETE CASCADE)
- `sender_id` (UUID, Foreign Key -> `users.id`, Nullable) - *Puede ser NULL o 'system' si es del sistema*
- `content` (TEXT, Not Null)
- `type` (VARCHAR(30), Not Null, Default: 'text') - *Enum: 'text', 'image', 'system_icebreaker', 'meeting_point', 'ticket_share'*
- `metadata` (JSONB) - *Para almacenar datos adicionales (ej. coordenadas, ids de tickets)*
- `timestamp` (TIMESTAMP, Default: NOW())

---

## 6. Índices Recomendados (Performance)

Para optimizar las consultas principales descritas en los endpoints:
- `CREATE INDEX idx_events_date ON events(date);`
- `CREATE INDEX idx_posts_event_id ON posts(event_id);`
- `CREATE INDEX idx_posts_community_id ON posts(community_id);`
- `CREATE INDEX idx_comments_target ON comments(target_type, target_id);`
- `CREATE INDEX idx_messages_chat_id_timestamp ON messages(chat_id, timestamp DESC);`
- `CREATE INDEX idx_squads_event_id ON squads(event_id);`
- `CREATE INDEX idx_tickets_event_status ON tickets(event_id, status);`

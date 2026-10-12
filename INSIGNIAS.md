# Colección de insignias

Las asignaciones administrativas autorizadas reutilizan el mismo registro con
`source=manual`, sin inventar presencia, pasos ni reseñas. Su detalle muestra
«Insignia asignada manualmente · No acredita asistencia por ubicación.».
La agrupación utiliza la fecha real de asignación; no se adelanta una asistencia
a eventos futuros. No hay un botón público para fabricar insignias.

La nueva pestaña **Insignias** aparece inmediatamente después de Eventos en
el perfil, sin rediseñar sus otras secciones. Consulta datos reales, con
contador total y páginas de 12, ordenadas por la primera confirmación de
asistencia (más reciente primero) en PostgreSQL.

«Tu colección» y «Cada insignia, una noche para recordar.» encabezan una
cuadrícula de tres columnas, agrupada por mes/año de asistencia, no por fecha
de un evento futuro. Se usa `America/Montevideo` para esa agrupación y para
el calendario anual del reconocimiento. Se conserva el orden SQL y se unen
los grupos al cargar más páginas. El contenedor tiene un máximo de 512 px;
los círculos, 128 px. Por el ajuste más reciente, debajo se muestran solamente
el DJ principal registrado y los pasos en formato `10,4 k pasos` (coma decimal,
una cifra y k minúscula). Si faltan datos, «DJ no informado» y «— pasos»; no se
utiliza el nombre del evento como supuesto artista ni se inventan pasos.
Ambas líneas son compactas, sin fechas ni notas, y se truncan para evitar
desbordamientos. Las pendientes llevan «Reseñar» dentro de la insignia.
Los botones conservan sus etiquetas accesibles y la animación sigue tomando
solo el círculo como elemento compartido.

El apartado «Info · Los diseños de tus insignias» viene cerrado y explica los
estados reseñada, sin reseñar y la más bailada. Usa el mismo componente visual
con un flyer de la colección y variantes ilustrativas explícitas; el arco de
ejemplo es 4/5, no una valoración del usuario ni una nueva insignia. No escribe
datos. Cuando existen fotografías oficiales de headliners registrados, la guía
las presenta en hasta tres miniaturas equilibradas; no inventa artistas ni usa
retratos de terceros. Sin insignias disponibles sigue mostrando
la explicación textual. La distinción anual es independiente de la reseña.

`EventBadgeArtwork` se reutiliza en colección y detalle: flyer original
circular, proporción intacta y recorte centrado. Si falla, reutiliza el retrato
disponible del evento y finalmente una inicial neutral; no genera imágenes.
Sin valoración, el flyer tiene saturación .25, brillo .8 y opacidad .65, y el
arco está inactivo. Con valoración,
incluso 0, recupera el color. El SVG usa `pathLength=100`, progreso `nota/5`
y extremos redondeados; 0 no dibuja un progreso ficticio. El reconocimiento
anual utiliza UN único círculo lime con radio 45 y grosor 10 en el SVG 100×100;
su radio interior 40 toca el flyer (inset 10%). Se omiten el track y el arco
independiente para evitar un segundo anillo; la puntuación real sigue en el
detalle. Conserva la distinción tanto con reseña como pendiente.

El dueño puede abrir, puntuar 0–5, escribir un recuerdo opcional de hasta
1000 caracteres antes de confirmar. `null` significa sin valoración; 0 es válido y
tiene una posición explícita en el slider. Las reseñas son personales: el servidor no
devuelve puntuación/texto a visitantes de otros perfiles.

El detalle utiliza `Modal` en modo pantalla con foco, teclado y back nativo;
no desmonta el perfil, conservando su scroll, pestaña y colección. Incluye
estadísticas, «Tu noche» con una estrella verde central y un slider de 0 a 5, lineup real y reseña
editable únicamente mientras no esté guardada. La valoración sigue siendo **entera**.
El mismo control se utiliza para cada DJ y los criterios de la página de reseña.
Es un range nativo, accesible con teclado y táctil, paso 1. En reseñas nuevas
la nota del evento y las de los DJs comienzan preseleccionadas en 1; esas notas
solo se guardan después de confirmar. Abrir un formulario con el valor inicial
no se considera un cambio sin guardar. Se espera a cargar el lineup para no
confirmar irreversiblemente una reseña sin sus artistas. Cada estrella crece
progresivamente de 1 a 5, y en 0 queda pequeña, punteada y sin relleno.
Transform/color y el thumb tienen transiciones breves, omitiéndolas con reducción
de movimiento. Las notas confirmadas conservan sus valores (incluido 0) y
muestran el slider deshabilitado; una nota histórica ausente no se convierte en 1.
Antes de guardar se abre `ConfirmModal`, con Confirmar y Cancelar, indicando
que todas las puntuaciones y el texto quedarán definitivos. Cancelar conserva
el borrador. Tras el guardado se actualiza la colección y se cierra el detalle
con su animación inversa. Las reseñas ya guardadas (incluidas las anteriores)
son de solo lectura; el backend devuelve 409 ante cualquier intento de edición.
Hay confirmación al salir con cambios pendientes y protección
`beforeunload`; mientras guarda no permite cerrar.

`useBadgeTransition` anima una sola pieza mediante Web Animations API y
`transform` durante 320 ms. El resto aparece con opacity/transform; no hay
librerías nuevas. El regreso invierte la transición si ambas posiciones son
visibles; si se desplazó el detalle fuera de pantalla, usa un fade de 160 ms.
`prefers-reduced-motion` omite el movimiento. El historial mantiene un estado
de detalle en la misma URL para que Back no abandone el perfil ni evite la
confirmación de cambios. Las activaciones repetidas quedan bloqueadas.

Los pasos provienen únicamente de las sesiones validadas de `dance_sessions`:
se suman por usuario/evento en SQL. Ausencia de datos se muestra como «— / Sin
datos de pasos», no cero ficticio. El máximo anual se calcula sobre **toda**
la colección, antes de paginar; solo un total positivo habilita el premio.
Empates: primera confirmación más reciente, luego event_id descendente.
No se cambió el contador, sus permisos ni el detector. Si la tabla no existe,
el backend devuelve pasos NULL y ningún reconocimiento.

El detalle carga el lineup solo al abrirlo y lo conserva en caché. Reutiliza
`event_artists`/`artists` y `events.lineup` como respaldo; no infiere artistas
por el título. `ArtistRatings` reutiliza la misma escala entera 0–5 y la tabla
`survey_artist_ratings`, con valoraciones opcionales e independientes por DJ,
usuario y evento. Actualiza solo las modificadas, sin borrar las demás. Los
nombres heredados sin un artista registrado se muestran sin controles, no se
convierten en nuevas entidades. La colección no consulta el lineup por cada insignia.

El lugar del detalle y de la tarjeta compartible incorpora `department` y
`country` nullable. Los códigos ISO se muestran en español (también fuera de
Uruguay); si faltan datos no se infieren a partir de la sede o el usuario.
No se muestran fotografías de integrantes de crews en estas vistas; sus
registros y archivos permanecen intactos.

## Compartir y recordatorio opcional

`useBadgeShare` genera mediante Canvas una tarjeta PNG 1080×1350: flyer oficial
circular, estado real, título, fecha, ubicación y marca Root. El botón superior
abre una vista previa con «Compartir imagen» y «Descargar imagen». La segunda
acción explícita conserva la activación necesaria para Web Share. Nunca incluye
el texto privado de la reseña ni puntuaciones individuales de DJs. Un 0 guardado
es completado; una pendiente no tiene puntuación inventada.

Web Share comparte el archivo cuando `canShare` lo permite; en otros navegadores
se descarga. Capacitor Share/Filesystem v8 guardan un archivo en caché, abren el
menú nativo y borran solo ese archivo al finalizar. Las aplicaciones disponibles
dependen del dispositivo: no se promete integración directa con Instagram.
Android/iOS se sincronizaron y se agregó el manifiesto iOS de timestamps C617.1.
Una actualización web no instala esos nuevos plugins en una APK ya existente.

Los flyers históricos son claves S3. Se cargan a través del endpoint público de
imagen oficial del evento, también usado para Canvas sin problemas de CORS.
Valida pertenencia del artista, formatos y tamaño; no permite imágenes privadas
ni un proxy de URLs arbitrarias. Si falla un flyer, el arte reutiliza el retrato
registrado disponible o una inicial neutral. La tarjeta muestra un error/reintento
si no pudo cargar un flyer existente ni su retrato oficial de respaldo, en lugar
de simular su descarga.

No había un check-out ni detección confiable de salida: «Terminé mi noche» es
una confirmación explícita del usuario, visible solo con asistencia geofence de
un evento ya iniciado. No infiere la salida por perder GPS ni terminar la fecha.
Las asignaciones manuales no disparan recordatorios.

`ReviewReminder` se monta una sola vez en el layout existente. El servidor
registra la apertura ANTES de la salida y solo ofrece una pendiente con salida
anterior a otra apertura, como máximo una por apertura y una vez por evento.
Una apertura web es un nuevo documento/recarga, no cada navegación o cambio de
visibilidad. En Capacitor también se considera apertura volver desde segundo
plano. El estado durable está en PostgreSQL; las preferencias de movimiento
reducido y el back nativo se conservan. «Ahora no» cierra sin guardar reseña:
la insignia sigue pendiente y accesible desde la colección.

El aviso existente de presencia `LiveEventBanner` muestra la insignia
desbloqueada y abre la pantalla de valoración existente, con sus criterios
opcionales y artistas preservados. También se puede valorar después desde
la colección. No se agregó un sistema paralelo de presencia o push.

## Archivos

- Perfil: `src/app/profile/[username]/page.tsx`.
- Componentes: `src/components/profile/BadgeCollection.tsx`,
  `BadgeDetail.tsx`, `EventBadgeArtwork.tsx`, `BadgeDesignGuide.tsx`, `EventReviewForm.tsx`;
  `src/components/ui/StarRating.tsx`, `Modal.tsx`.
- Servicios/tipos: `src/services/badges.ts`, `presence.ts`, `surveys.ts`,
  `src/types/badges.ts`.
- Hooks/contexto: `src/hooks/useBadges.ts`, `useEventPresence.ts`,
  `useDanceSync.ts`, `src/context/DanceContext.tsx`.
- Integración: `src/components/LiveEventBanner.tsx`,
  `src/app/events/[id]/survey/page.tsx`, `src/lib/badgeAppearance.ts`.
- Animación: `src/hooks/useBadgeTransition.ts`, `src/lib/badgeTransition.ts`.
- Tests: `src/components/profile/badges.test.mjs`,
  `src/lib/badgeAppearance.test.mjs`, `src/hooks/useBadgeTransition.test.mjs`.

Todos los requests nuevos se definen en servicios, y las cargas/mutaciones
usan hooks y `useMutation`. No hay datos mock ni premios locales como fallback.
Ver `INSIGNIAS.md` del backend para contratos, migración y límites del detector.

## Verificar

1. Iniciar sesión, marcar Voy y abrir la app dentro de la sede y ventana
   temporal del evento: el backend confirma presencia usando el detector
   existente. Un RSVP desde otra ubicación no genera insignia.
2. Tocar «Estás aquí» y guardar 0 estrellas, con o sin texto. Volver al perfil:
   la colección debe conservar la insignia y mostrar 0/5.
3. Abrir esa insignia: nota, DJs y texto quedan de solo lectura. Un intento
directo de modificación devuelve 409 sin alterar lo guardado. Cambiar/quitar
RSVP no elimina el recuerdo.
4. Visitar otro perfil: ver la colección, no sus reseñas personales.
5. Probar estado vacío, errores/reintento, paginación, móvil y teclado.

```powershell
node --test src/components/profile/badges.test.mjs
node --test src/services/badgeSharing.test.mjs src/hooks/useReviewReminder.test.mjs
npx tsc --noEmit
npm run build
```

Se verificó el flujo visual con handlers reales y un esquema SQL temporal,
incluyendo guardado y recuperación de 0; ese esquema se eliminó al terminar.
Las capturas históricas de QA usan fixtures solamente en el entorno aislado.
Luego, con autorización explícita, se asignaron siete insignias manuales a
mathi.mai mediante la CLI administrativa. No se copiaron pasos ni reseñas DEMO
a esa cuenta real. Actualmente esos eventos tampoco tienen artistas, departamento
ni país registrados: estas interfaces no fabrican esos datos.

Por pedido posterior explícito, las siete insignias manuales de mathi.mai
pueden valorar tres DJs privados de ejemplo (DJ 1, DJ 2 y DJ 3). Se identifican
como ficticios en la reseña y nunca sustituyen el lineup público del evento.
No se asignan puntuaciones, textos ni fotos ficticias automáticamente.
El dueño del perfil se reconoce por su ID, no por su alias almacenado.
Si falta sesión local, el detalle ofrece iniciar sesión y volver a la reseña;
el regreso solo acepta rutas internas de reseñas con UUID válido.

`badgePreview` marca KEY - ARGY como «La más bailada» SOLO en el perfil pocho
y en desarrollo, por solicitud explícita para comprobar su borde visual.
También agrega, por pedido explícito posterior, siete cantidades de pasos
sintéticas para probar su formato: 10.400, 18.300, 12.600, 24.200, 31.100,
9.700 y 38.500 (ARGY, la mayor). Son un overlay local, NO actividad real.
La colección tiene un aviso, el detalle indica «Pasos de prueba» y la tarjeta
compartida identifica los datos de prueba. No persiste pasos ni cambia el ranking SQL;
el build de producción no aplica esta excepción.

La revisión actual pasó 77 tests frontend (incluye chats/push), typecheck, lint
focalizado, build Next.js y assembleDebug de Android con JDK 21. Pasaron
`go test ./...` y la integración SQL aislada (esquema eliminado al finalizar),
incluidos cambios de DJs sin duplicación y aperturas/salidas. El flyer oficial
live fue comprobado vía HTTP 200. La automatización visual se detuvo porque el
control de pantalla no pudo identificar con seguridad la URL; no equivale a
una prueba manual en móvil. iOS requiere compilar/verificar en macOS/Xcode.

La muestra manual también puede copiar el catálogo público que utiliza Vercel
mediante `BADGES_TEST_PREVIEW_EVENTS_URL` en el test del backend. Se importaron
42 eventos con títulos, fechas e imágenes originales y se asignaron exactamente
7 insignias DEMO al perfil ficticio `one`. No es una confirmación de asistencia
a eventos futuros ni modifica cuentas reales. Se usan sus flyers originales;
por defecto no se crean pasos, retratos, artistas ni lineups. Las otras fiestas quedan
disponibles sin otorgar más insignias al perfil. Se pueden conservar reseñas
y fechas de una muestra localhost anterior al renovar el esquema.

Para comparar los estados visuales, `BADGES_TEST_PREVIEW_SAMPLES=1` carga,
**solo con opt-in en el esquema aislado**, seis totales de pasos DEMO y hasta
cuatro reseñas de muestra (notas 5, 4, 3 y 0), sin reemplazar reseñas manuales.
Incluye un máximo anual de muestra, un total de 0 y una insignia sin pasos.
Son datos sintéticos solicitados para QA, nunca datos del contador real.

**Pendiente de publicar:** primero debe desplegarse/migrarse el backend. El
backend live todavía no expone estos endpoints; apuntar un frontend local al
live no sustituye ese despliegue. La prueba GPS en una fiesta real y en un
Android físico depende de estar allí y otorgar permisos. No se realizó un
despliegue, commit ni push durante esta implementación.

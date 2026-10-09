# SPEC 06 — Dialog "Nueva publicación" (composer del feed)

> **Status:** Approved
> **Depends on:** SPEC 01 (`specs/01-home-feed.md`) — hereda la ruta `/`, el sidebar con el botón "Nueva publicación", la caja `ShareBox`, `PostCard` con sus chips por tipo, los mocks de `app/_data/mock.ts` y los tokens de `globals.css`; SPEC 02 (`specs/02-kids-and-kid-profile.md`) — reusa `app/_data/kids.ts` y `AVATAR_COLORS` para las pills de PARA; SPEC 04/05 (`specs/04-add-kid-dialog.md`, `specs/05-link-parent-dialog.md`) — reusa el patrón de dialog modal (`<dialog>` + `showModal()`, backdrop translúcido, focus trap, cierre por Escape/backdrop, errores en línea) y la decisión de alta en memoria sin persistencia
> **Date:** 2026-10-09
> **Objective:** Implementar el dialog modal de nueva publicación (`references/pantallas/crear-publicacion.dc.html`) que se abre desde el botón del sidebar, el drawer móvil y la caja "Compartí un momento…" del feed, con PARA (un niño o Toda la sala), TIPO y descripción obligatorios con errores en línea, fotos inertes y alta del post al tope del feed en memoria.

## Por qué existe esta spec

SPEC 01 dejó el botón "Nueva publicación" del sidebar y la caja "Compartí un momento…" inertes a la espera de esta pantalla. Es el primer dialog disparado desde el layout (los de SPEC 04/05 se abrían desde un botón local a una página), lo que exige compartir estado entre páginas: un provider en `app/(daycare)/layout.tsx` con los posts de la sesión para que lo publicado en el dialog aparezca en el feed. También amplía el modelo: `PostType` suma 4 tipos (COMIDA, SIESTA, ÁNIMO, FOTO) que no existían en el feed.

## Scope

**In:**

- **Tres triggers abren el mismo dialog sin cambiar la URL** (client components):
  - El botón "Nueva publicación" del sidebar (visible en todas las páginas `(daycare)` en desktop).
  - El mismo botón dentro del drawer móvil (cierra el drawer y abre el dialog).
  - La caja "Compartí un momento…" de `/`.
- **`ComposeProvider`** (context client) montado en `app/(daycare)/layout.tsx` envolviendo sidebar, drawer y contenido: expone `openCompose()`, `addPost(post)` y `sessionPosts: FeedPost[]`, y renderiza el dialog una sola vez a nivel layout. El grupo `(auth)` queda fuera del provider.
- **Dialog** con overlay oscuro translúcido y card centrada `max-w-[580px]` con el diseño de la referencia:
  - Cabecera sobre borde inferior: **Cancelar** (`ink-faint`, `type="button"`, cierra), título "Nueva publicación" (Fredoka 18px semibold) y **Publicar** (`accent`, extrabold, `type="submit"`).
  - Labels 12px extrabold tracking `.7px` en `#94887B`, como las referencias anteriores.
  - **PARA** (obligatorio): pills de los 8 niños de `app/_data/kids.ts` (círculo de avatar 26px con `AVATAR_COLORS` por `kid.avatarColor` + nombre) y una pill "Toda la sala" sin avatar. **Selección única, arranca vacía.** Sin elegir: borde `line`, fondo `surface`, texto `ink-muted`. Elegida: borde y fondo `#3F362E`, texto blanco (el avatar conserva su color). "Toda la sala" es excluyente: elegirla desmarca al niño activo.
  - **TIPO** (obligatorio): pills Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio. **Selección única, arranca vacía.** Sin elegir: estilo chip claro por tipo (el de los chips del feed; Comida usa el par dorado `#F4DC8E`/`#9A7B1E`). Elegida: sólida con el color del tipo y texto blanco (como Actividad en la referencia).
  - **DESCRIPCIÓN** (obligatorio): textarea `min-height 120px`, `resize: vertical`, radio 14px, borde 1.5px `auth-line`, fondo blanco, placeholder "Contá cómo le fue hoy…". Arranca vacía.
  - **FOTOS** (inertes, sin interacción): tile placeholder 96px (icono de imagen sobre `placeholder-bg`) + tile punteado "Agregar" (borde `placeholder-line`, ícono `+` en `accent-strong`), solo visuales.
- **Validación al Publicar** (submit del `<form>`): PARA sin elegir, TIPO sin elegir o descripción vacía (tras trim) marcan borde `accent` y mensaje en español bajo la sección. Publicar siempre habilitado. Enter en el textarea dispara la misma validación.
- **Publicar con todo válido** arma el `FeedPost` en memoria y vuelve al feed:
  - `author`/`initial`: nombre de pila e inicial del niño elegido en PARA; "Anuncio general" sin inicial con "Toda la sala".
  - `audience`: "familia de {nombre de pila}" o "toda la sala".
  - `time`: hora local del cliente formateada HH:MM al publicar.
  - `likes: 0`, `comments: 0`, sin `photo`.
  - `addPost(post)` al provider, cierre del dialog y `router.push("/")`: el post aparece **al tope** del feed. Sin persistencia: al refrescar vuelven los 3 posts de `mock.ts`.
- **Feed en `/`**: la página queda como header (server) + `FeedScreen` (client) que consume `useCompose().sessionPosts` y renderiza `[...sessionPosts, ...initialPosts]` con la `ShareBox` arriba; `PostCard` gana chips para los 4 tipos nuevos. El divisor "PUBLICADO HOY" queda literal.
- **Cierre**: Cancelar, tecla Escape y click en el backdrop cierran y descartan (reset). `<dialog>` nativo con `showModal()`; `overflow: hidden` en `body` mientras está abierto; foco inicial en la primera pill de PARA; al cerrar, el foco vuelve al trigger (si el trigger fue desmontado — drawer móvil —, cae al botón "Abrir menú").
- **Estado inicial en cada apertura**: sin PARA, sin TIPO, textarea vacía, sin errores.
- Responsive: card con margen lateral en viewport angosto, sin scroll horizontal desde 360px; en pantallas bajas el cuerpo del dialog scrollea internamente.
- `/`, `/kids`, `/kids/[id]`, `/login` y `/activate-account` siguen intactas (el sidebar y la ShareBox solo cambian de inerte a abrir el dialog).

**Out of scope (for future specs):**

- Upload real de fotos y photos en posts publicados: los tiles FOTOS son inertes; la integración va en un spec futuro junto con el backend. _(decisión del usuario)_
- Persistencia: los posts de la sesión viven solo en memoria del provider; `mock.ts` no se muta.
- `detalle-publicacion` y `foto` (pantallas pendientes, cada una con su spec).
- Likes, comentarios y "Editar" funcionales; agrupar el feed o fecha dinámica ("martes 17 jun" y "PUBLICADO HOY" quedan literales).
- Validación de duplicados, límite de largo del texto, borradores.
- El resto de pantallas pendientes; backend.

## Data model

```ts
// app/_data/mock.ts — PostType y POST_TYPE_LABEL suman los 4 tipos nuevos
export type PostType =
  | "achievement"
  | "activity"
  | "announcement" // LOGRO · ACTIVIDAD · ANUNCIO (existentes)
  | "meal"
  | "nap"
  | "mood"
  | "photo"; // COMIDA · SIESTA · ÁNIMO · FOTO (nuevos)

export const POST_TYPE_LABEL: Record<PostType, string> = {
  achievement: "LOGRO",
  activity: "ACTIVIDAD",
  announcement: "ANUNCIO",
  meal: "COMIDA",
  nap: "SIESTA",
  mood: "ÁNIMO",
  photo: "FOTO",
};
```

```css
/* app/globals.css — tokens nuevos (patrón SPEC 01: color + bg por tipo) */
--color-meal: #9a7b1e;
--color-meal-bg: #f4dc8e; /* par dorado del avatar amber */
--color-nap: #7b5fc0;
--color-nap-bg: #e7dcf6; /* Siesta de la referencia */
--color-mood: #c56486;
--color-mood-bg: #f9d2de; /* Ánimo de la referencia */
--color-photo: #d9684a;
--color-photo-bg: #fbd8cc; /* Foto de la referencia */
```

No hay estructuras nuevas persistidas: `sessionPosts: FeedPost[]` vive en `ComposeProvider` (context), el estado del formulario en `ComposeDialog.tsx` (`useState`: kid elegido o "Toda la sala", tipo, texto, errores por campo). El `FeedPost` nuevo se construye en memoria al Publicar y desaparece al refrescar. Estilos de pills y chips quedan en los componentes (`ComposeDialog.tsx`, `PostCard.tsx`), no en el dato.

## Estructura de archivos

```
app/
  globals.css                       # + tokens meal/nap/mood/photo (color + -bg)
  _data/mock.ts                     # PostType y POST_TYPE_LABEL suman 4 valores; posts intactos
  components/
    compose/
      ComposeProvider.tsx           # NUEVO (client): context (sessionPosts, openCompose, addPost) + monta <ComposeDialog/>
      ComposeDialog.tsx             # NUEVO (client): <dialog>, overlay, card, PARA/TIPO pills, textarea, FOTOS, validación, submit
    shared/
      Sidebar.tsx                   # "Nueva publicación": Link → <button> que llama openCompose() (+ onNavigate en el drawer)
    home/
      ShareBox.tsx                  # Link → <button> que llama openCompose()
      FeedScreen.tsx                # NUEVO (client): sessionPosts + ShareBox + divisor + lista de posts
      PostCard.tsx                  # CHIP_STYLES suma los 4 tipos nuevos
  (daycare)/
    layout.tsx                      # envuelve sidebar + MobileMenu + main con <ComposeProvider>
    page.tsx                        # header server + <FeedScreen initialPosts={posts} />
```

`/` sigue teniendo header server: solo el subtree del feed pasa a cliente (`FeedScreen` consume el context). El avatar por tipo en `PostCard` no se toca (el megáfono sigue keyed a `type === "announcement"`).

## Implementation plan

Cada paso deja la app funcionando y verificable.

1. **`app/_data/mock.ts`**: `PostType` y `POST_TYPE_LABEL` suman `meal`/`nap`/`mood`/`photo`. Manual: `pnpm exec tsc --noEmit`.
2. **`app/globals.css` + `PostCard.tsx`**: tokens de los 4 tipos y `CHIP_STYLES` extendido. Manual: `tsc` y `/` renderiza igual que antes (los posts existentes no usan los tipos nuevos).
3. **`ComposeDialog.tsx` (shell estático)**: `<dialog>` con `showModal()/close()` controlado por props `open`/`onClose`/`onPublish`, `aria-label "Nueva publicación"`, backdrop estilado, card de la referencia (cabecera Cancelar/título/Publicar, pills de PARA desde `kids.ts` con `AVATAR_COLORS` + "Toda la sala", pills de TIPO con los 7 tipos, textarea, FOTOS inertes, `<form>` con Publicar `type="submit"`). Manual: `pnpm exec tsc --noEmit` (aún no montado).
4. **Validación y submit**: errores en línea de los 3 obligatorios, reset al cerrar, construcción del `FeedPost` (author/audience por PARA, hora HH:MM del cliente, likes/comments 0). Manual: `tsc`.
5. **`ComposeProvider.tsx` + montaje**: context con `sessionPosts`/`openCompose`/`addPost` y el dialog dentro; envoltura en `app/(daycare)/layout.tsx`; triggers en `Sidebar.tsx` (botón + cierre del drawer) y `ShareBox.tsx`; `/` pasa a header + `FeedScreen`. Manual: en runtime abrir el dialog desde los 3 triggers, publicar y ver el post al tope de `/`.
6. **Pulido de fidelidad y responsive**: comparación lado a lado contra `references/pantallas/crear-publicacion.dc.html` en desktop; márgenes en angosto; sin scroll horizontal desde 360px; recorrido con teclado (Tab/Escape/Enter) y retorno de foco (incluido el caso drawer móvil).
7. **Verificación final con reinicio limpio del dev server** (en ese orden, sin saltos):
   1. `pnpm exec eslint app`, `pnpm exec tsc --noEmit` y `pnpm build` terminan sin errores.
   2. Matar el dev server corriendo: leer el PID y el puerto de `.next/dev/lock`; si vive, `kill <pid>` y confirmar el puerto libre; si no hay lock, revisar `lsof -ti :3000` y matar solo los de este proyecto.
   3. Re-levantar con `pnpm dev`.
   4. Comprobar en runtime, sin errores ni warnings en la terminal: dialog abierto/cerrado por los 3 triggers desde `/`, `/kids` y `/kids/[id]` (y drawer móvil), validación de los 3 obligatorios, Publicar con post visible al tope de `/` desde otra página, reopen en estado inicial, foco y Escape; `/`, `/kids`, `/kids/1`, `/login` y `/activate-account` siguen igual.

## Acceptance criteria

- [ ] `pnpm exec eslint app` termina sin errores.
- [ ] `pnpm exec tsc --noEmit` termina sin errores.
- [ ] `pnpm build` completa con éxito.
- [ ] Con el dev server relanzado limpio (PID de `.next/dev/lock` matado antes), el dialog abierto y cerrado no loguea errores ni warnings en la terminal.
- [ ] Click en "Nueva publicación" del sidebar abre el dialog sobre la página actual (`/`, `/kids` y `/kids/[id]`) sin cambiar la URL; el fondo queda oscurecido y el scroll bloqueado mientras está abierto.
- [ ] Click en "Nueva publicación" del drawer móvil cierra el drawer y abre el mismo dialog; click en "Compartí un momento…" en `/` también lo abre.
- [ ] En desktop, el dialog replica `references/pantallas/crear-publicacion.dc.html`: card 580px crema, cabecera Cancelar/"Nueva publicación"/Publicar, pills de PARA con avatars circulares, 7 pills de TIPO, textarea con placeholder "Contá cómo le fue hoy…" y los 2 tiles de FOTOS.
- [ ] PARA muestra los 8 niños de `kids.ts` + "Toda la sala"; arranca sin selección; solo una pill queda activa a la vez y "Toda la sala" desmarca al niño activo; la activa toma fondo `#3F362E` con texto blanco.
- [ ] TIPO arranca sin selección; la elegida se vuelve sólida con su color y texto blanco y las demás quedan claras.
- [ ] Publicar sin PARA muestra mensaje de error bajo PARA y no cierra el dialog.
- [ ] Publicar sin TIPO muestra mensaje de error bajo TIPO y no cierra el dialog.
- [ ] Publicar con la descripción vacía (o solo espacios) muestra borde y mensaje bajo DESCRIPCIÓN y no cierra el dialog.
- [ ] Publicar con todo válido cierra el dialog y lleva a `/`, donde el post nuevo aparece al tope del feed con el chip de su tipo, autor e inicial según PARA (o "Anuncio general" con Toda la sala), "Para: familia de {nombre}"/"toda la sala", hora HH:MM actual y 0 likes/0 comentarios.
- [ ] Al refrescar `/` vuelven exactamente los 3 posts de `mock.ts` (sin persistencia).
- [ ] Cancelar, Escape y click en el backdrop cierran el dialog sin cambios en la página.
- [ ] Reabrir el dialog tras cerrarlo lo muestra en estado inicial: sin PARA, sin TIPO, textarea vacía, sin errores.
- [ ] El foco entra al dialog en la primera pill de PARA y queda atrapado dentro; al cerrar, el foco vuelve al trigger (o al botón "Abrir menú" si el trigger fue el drawer móvil).
- [ ] Los tiles de FOTOS son inertes: "Agregar" no navega ni cambia nada.
- [ ] Sin scroll horizontal desde 360px con el dialog abierto; la card respeta márgenes laterales.
- [ ] `/`, `/kids`, `/kids/[id]`, `/login` y `/activate-account` siguen funcionando igual.

## Decisions

- **Sí:** dialog modal sobre la página actual en vez de ruta propia — patrón SPEC 04/05; el header Cancelar/Publicar de la referencia se lee como cabecera del dialog. _(decisión del usuario, explícita en el pedido)_
- **Sí:** Publicar vuelve a `/` y el post aparece al tope del feed en memoria — patrón SPEC 04/05 de alta sin persistencia; exige el provider en el layout. _(decisión del usuario)_
- **Sí:** PARA selección única, arranca vacía, obligatoria con error en línea; "Toda la sala" excluyente. _(decisión del usuario; la selección de Mateo en la referencia es ilustrativa, como los campos prellenados de SPEC 04/05)_
- **Sí:** TIPO clara=sin elegir / sólida=elegida, arranca vacía y obligatoria — el feed renderiza ACTIVIDAD clara, así que lo sólido de la referencia se lee como estado elegido. _(decisión del usuario)_
- **Sí:** DESCRIPCIÓN obligatoria (no vacía tras trim). _(decisión del usuario)_
- **Sí:** hora del post = reloj del cliente en HH:MM al publicar. _(decisión del usuario)_
- **Sí:** FOTOS inertes; upload real va en un spec futuro junto con el backend. _(decisión del usuario)_
- **Sí:** los 8 niños de `kids.ts` dinámicos en PARA — la referencia muestra 3 porque es un mock estático; `AVATAR_COLORS` ya replica los círculos M/S/B de la referencia.
- **Sí:** versión clara de Comida inventada con el par dorado existente del avatar amber (`#F4DC8E`/`#9A7B1E`) — la referencia solo define su versión sólida.
- **Sí:** `author`/`initial` derivados de PARA y no del TIPO — así lo hacen los posts de `mock.ts`; el megáfono de `PostCard` sigue keyed a `type === "announcement"` (sin tocar `PostCard` más allá de los chips).
- **Sí:** `ComposeProvider` (context client) en `app/(daycare)/layout.tsx` — única forma de compartir `sessionPosts` entre el dialog (nivel layout) y el feed (`/`) sin persistencia; `(auth)` queda fuera.
- **Sí:** tokens nuevos `meal`/`nap`/`mood`/`photo` en `globals.css` (patrón SPEC 01); colores puntuales inline. `globals.css` solo suma tokens.
- **Sí:** `<dialog>` nativo con `showModal()`, cierre por Cancelar/Escape/backdrop, focus trap y `overflow: hidden` en `body` — patrón SPEC 04/05 tal cual, con Cancelar en el rol de la X (así lo dibuja esta referencia).
- **Sí:** al abrir desde el drawer móvil se cierra el drawer; si el retorno nativo de foco falla (trigger desmontado), el foco cae al botón "Abrir menú".
- **No:** upload de fotos, persistencia, backend ni mutar `mock.ts`.
- **No:** likes, comentarios, "Editar" o detalle del post funcionales (`detalle-publicacion`/`foto` van en specs propias).
- **No:** límite de largo ni duplicados en la descripción.

## Risks

| Riesgo                                                                                           | Mitigación                                                                                                                                  |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| La referencia no define estados de error, backdrop ni versión clara de Comida                    | Errores y backdrop con la paleta existente (`accent`, ink translúcido — patrón SPEC 04/05); Comida clara con el par dorado del avatar amber |
| El retorno nativo de foco falla cuando el trigger fue desmontado (drawer móvil)                  | Al cerrar, si el foco cayó en `body`, enfocar el botón "Abrir menú"                                                                         |
| Escape con el dialog abierto sobre el drawer cierra ambas capas a la vez                         | Comportamiento aceptable (ambas se cierran); si molesta, frenar la propagación en el paso 6                                                 |
| `sessionPosts` vive en el layout: la navegación dentro de `(daycare)` lo conserva, el refresh no | Es el comportamiento buscado (sin persistencia); `(auth)` está fuera del provider                                                           |
| Cerrar el dialog y `router.push("/")` en el mismo handler puede competir                         | Cerrar primero, navegar después; probar en runtime en el paso 7                                                                             |
| Pills de TIPO con 7 colores pueden leerse como multiselección                                    | Solo una sólida a la vez; cursor y estados hover/focus visibles                                                                             |

## What is **not** in this spec

- Upload real de fotos (spec futuro con backend); posts publicados sin foto.
- Persistencia de posts: `mock.ts`, backend.
- `detalle-publicacion` y `foto` (pantallas pendientes con sus propias specs).
- Likes, comentarios y "Editar" funcionales; feed agrupado o fecha dinámica.
- Las demás pantallas pendientes (cada una va en su propia spec).

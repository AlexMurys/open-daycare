# SPEC 01 — Home `/` con el diseño del Feed

> **Status:** Approved
> **Depends on:** ninguna (primera spec del proyecto)
> **Date:** 2026-10-02
> **Objective:** Implementar la pantalla Feed (`references/pantallas/feed.dc.html`) como página Home (`/`) con fidelidad visual total en desktop y menú hamburguesa responsive, sin autenticación ni base de datos.

## Por qué existe esta spec

El repo es un andamiaje limpio de create-next-app esperando la implementación de las referencias Penpot. Esta es la primera pantalla y establece la base que heredarán las demás: tokens de diseño en `globals.css`, fuentes del proyecto, layout compartido con sidebar, estructura de `app/components/` y patrón de datos mock en `app/_data/`.

## Scope

**In:**

- Ruta `/` con el feed completo de la referencia: encabezado ("GUARDERÍA · SALA SOLES", "Buenas, Caro", "12 niños · martes 17 jun"), caja "Compartí un momento…", divisor "PUBLICADO HOY" y los 3 posts (logro, actividad con placeholder de foto, anuncio). Los nombres de tipo en el código son en inglés (`achievement` / `activity` / `announcement`); en pantalla se muestran los chips LOGRO / ACTIVIDAD / ANUNCIO de la referencia.
- Sidebar completo de la referencia: logo "OpenDayCare · Sala Soles", botón "Nueva publicación", nav Feed/Niños/Avisos/Mi cuenta (Feed en estado activo) y chip "Caro Giménez · Maestra" con icono de cerrar sesión.
- Responsive completo con TailwindCSS: sidebar fijo desde `md` (768px); por debajo, botón hamburguesa fijo arriba-izquierda + drawer lateral izquierdo con el mismo contenido del sidebar + overlay detrás.
- Migración tipográfica en `app/layout.tsx`: Nunito (cuerpo) + Fredoka (títulos) vía `next/font/google`, eliminando Geist; `lang="es"` y metadata "OpenDayCare".
- Tokens de diseño en `app/globals.css` (`@theme` de Tailwind v4) con la paleta exacta de la referencia y modo claro fijo (sin `prefers-color-scheme`).
- Módulo mock tipeado `app/_data/mock.ts` (carpeta privada `_data`, fuera del routing) con el contenido literal de la referencia.
- Estructura de componentes por contexto: `app/components/shared/` (elementos en común) y `app/components/home/` (propios del Home).
- Elementos interactivos renderizados pero inertes (sin navegación ni handlers).

**Out of scope (for future specs):**

- Todas las demás pantallas: crear-publicacion, detalle-publicacion, foto, ninos, perfil-nino, agregar-nino, avisos, resumen-dia, mi-cuenta, familia-feed, familia-cuenta, login, activar-cuenta, vincular-padre, index.
- Autenticación y cierre de sesión real.
- Base de datos, persistencia, likes, comentarios, creación/edición de posts.
- Fecha dinámica: "martes 17 jun" es contenido mock literal.
- Fotos reales: solo el placeholder punteado de la referencia.
- FAB de "Nueva publicación" en móvil (el drawer ya lo contiene).

## Data model

```ts
// app/_data/mock.ts
export type PostType = "achievement" | "activity" | "announcement";
export type NavIcon = "home" | "kids" | "bell" | "user";

export interface FeedPost {
  id: string; // "achievement-potty"
  type: PostType;
  author: string; // "Mateo" · "Anuncio general"
  initial?: string; // "M" (children); announcements use an icon, no initial
  time: string; // "14:20"
  audience: string; // "familia de Mateo" · "toda la sala"
  text: string;
  photo?: string; // placeholder caption: "Foto · pintando con témperas"
  likes: number;
  comments: number;
}

export interface NavItem {
  label: string; // "Feed" · "Niños" · "Avisos" · "Mi cuenta"
  href: string; // future route; rendered inert in this spec
  icon: NavIcon;
  isActive?: boolean; // true only for Feed
}

export interface SidebarUser {
  name: string; // "Caro Giménez"
  role: string; // "Maestra · Soles"
  initial: string; // "C"
}

export interface Classroom {
  name: string; // "Sala Soles"
  childrenCount: number; // 12
  date: string; // "martes 17 jun"
}

export const POST_TYPE_LABEL: Record<PostType, string> = {
  achievement: "LOGRO",
  activity: "ACTIVIDAD",
  announcement: "ANUNCIO",
};

export const staff: SidebarUser = {
  name: "Caro Giménez",
  role: "Maestra · Soles",
  initial: "C",
};
export const classroom: Classroom = {
  name: "Sala Soles",
  childrenCount: 12,
  date: "martes 17 jun",
};
export const navItems: NavItem[] = [
  /* the 4 nav entries from the reference */
];
export const posts: FeedPost[] = [
  /* the 3 posts from the reference, in order */
];
```

Convenciones: identificadores en inglés; strings visibles al usuario en español. `POST_TYPE_LABEL` es el único lugar donde vive el mapeo tipo → etiqueta de pantalla. Los colores del chip y el ícono de megáfono del avatar son preocupación visual y quedan en `PostCard.tsx`, no en el dato. `navItems[].href` documenta la ruta futura pero `Sidebar.tsx` la renderiza inerte (`<a>` sin `href`) hasta que esas pantallas existan. El texto "publicado por vos" lo pinta el componente (todos los posts son de la usuaria actual). Horas y fechas son strings literales, sin parsing.

Estilo por tipo (lo resuelve `PostCard.tsx`, no el dato):

| `PostType`     | Chip (`POST_TYPE_LABEL`)                  | Avatar              |
| -------------- | ----------------------------------------- | ------------------- |
| `achievement`  | LOGRO (verde `#CFEBD8` / `#3E9B6C`)       | Inicial (`initial`) |
| `activity`     | ACTIVIDAD (celeste `#C7E7F1` / `#2E89A6`) | Inicial (`initial`) |
| `announcement` | ANUNCIO (azul `#CCD8F4` / `#4E72C8`)      | Ícono de megáfono   |

## Estructura de archivos

```
app/
  layout.tsx                    # fuentes, lang="es", metadata
  globals.css                   # tokens @theme + base
  _data/mock.ts                 # tipos, mocks y POST_TYPE_LABEL (privado, sin routing)
  components/
    shared/
      Sidebar.tsx               # logo, botón Nueva publicación, navItems, SidebarUser
      MobileMenu.tsx            # botón hamburguesa + drawer + overlay (client)
    home/
      PostCard.tsx              # tarjeta de post (3 variantes por tipo)
      ShareBox.tsx              # caja "Compartí un momento…"
  (daycare)/
    layout.tsx                  # sidebar/md + MobileMenu + main scrollable
    page.tsx                    # feed: encabezado, divisor, posts
```

Archivos de componentes en PascalCase. `app/page.tsx` se elimina (reemplazado por `app/(daycare)/page.tsx`).

## Implementation plan

1. `app/globals.css`: reemplazar tokens por la paleta de la referencia en `@theme` (crema `#F6ECDF`, panel `#FFFDF9`, borde `#ECE0D0`, tinta `#3F362E`/`#6E6359`/`#94887B`/`#A89A8B`, acento coral `#D9583C`/`#E0654A`/`#F2937A`/`#EE8164`, chips verde `#3E9B6C`/`#CFEBD8`, celeste `#2E89A6`/`#A9D9E8`/`#C7E7F1`, azul `#4E72C8`/`#CCD8F4`), body base y scrollbar; quitar el bloque `prefers-color-scheme`. La app sigue corriendo.
2. `app/layout.tsx`: cargar Fredoka + Nunito con `next/font/google` (variables CSS), eliminar Geist, `lang="es"`, metadata "OpenDayCare". Manual: `pnpm dev` sin errores en terminal.
3. `app/_data/mock.ts`: tipos y mocks (`PostType`, `NavIcon`, `FeedPost`, `NavItem`, `SidebarUser`, `Classroom`, `POST_TYPE_LABEL`, `staff`, `classroom`, `navItems`, `posts`). Manual: `pnpm exec tsc --noEmit`.
4. Route group + shared: crear `app/(daycare)/layout.tsx` (sidebar fijo `hidden md:flex` + `MobileMenu` `md:hidden` + main scrollable), `app/components/shared/Sidebar.tsx`, `app/components/shared/MobileMenu.tsx` (drawer + overlay + cierre por overlay/X/Esc) y `app/(daycare)/page.tsx` mínimo, y borrar `app/page.tsx` en el mismo paso (dos páginas paralelas para `/` rompen el build). Manual: `/` muestra sidebar en desktop y hamburguesa en ventana angosta.
5. Feed: `app/components/home/PostCard.tsx` y `ShareBox.tsx` + página completa (encabezado, divisor, lista desde `posts`), enlaces inertes. Manual: `/` muestra los 3 posts.
6. Pulido responsive + fidelidad: comparación lado a lado contra `references/pantallas/feed.dc.html` y `references/screenshots/feed.png` en desktop; probar el drawer en angosto (abrir/cerrar/Esc/overlay, sin scroll horizontal desde 360px); ajustar espaciados, sombras, radios y tipografía.

## Acceptance criteria

- [ ] `pnpm exec eslint app` termina sin errores.
- [ ] `pnpm exec tsc --noEmit` termina sin errores.
- [ ] `pnpm build` completa con éxito.
- [ ] `pnpm dev` + abrir `/` no loguea errores ni warnings en la terminal.
- [ ] En desktop (≥768px): sidebar fijo de 248px + feed centrado (máx 760px) con la paleta de la referencia.
- [ ] En angosto (<768px): el sidebar fijo desaparece y el botón hamburguesa queda fijo arriba-izquierda.
- [ ] El drawer se abre con el mismo contenido del sidebar y cierra por overlay, botón X y tecla Esc.
- [ ] No hay scroll horizontal en viewports desde 360px.
- [ ] Los títulos usan Fredoka y el cuerpo Nunito; Geist quedó eliminado.
- [ ] El feed muestra los 3 `FeedPost` del mock en orden: `achievement` (3 likes/1 comentario), `activity` (5/2, con placeholder de foto), `announcement` (8/0).
- [ ] Ningún elemento navega: clic en "Nueva publicación", nav, "Editar", "cerrar sesión", placeholder de foto y comentarios no cambia la URL ni da 404.
- [ ] En desktop, la página se ve idéntica a `references/pantallas/feed.dc.html` (comparación visual).

## Decisions

- **Sí:** responsive completo con menú hamburguesa — cambia la decisión anterior de "solo desktop". _(decisión del usuario)_
- **Sí:** drawer lateral izquierdo + botón hamburguesa flotante — la cabecera del feed queda como único encabezado en móvil. _(acepta recomendación)_
- **Sí:** breakpoint `md` (768px) con layout fluido en todos los anchos — "full responsive como se recomienda". _(acepta recomendación)_
- **Sí:** `app/components/` dentro de `app/`, con subcarpetas por contexto: `shared/` (Sidebar, MobileMenu) y `home/` (PostCard, ShareBox). _(decisión del usuario)_
- **Sí:** mocks en `app/_data/mock.ts` — carpeta privada de Next (underscore), fuera del routing. _(decisión del usuario)_
- **Sí:** TailwindCSS (utilities + tokens `@theme`) — refuerza la convención del proyecto (Tailwind v4 CSS-first). _(decisión del usuario)_
- **Sí:** código en inglés (tipos, campos, funciones: `PostType`, `FeedPost`, `NavItem`, `SidebarUser`, `author`, `likes`, `classroom`) y strings visibles al usuario en español — Clean Code + convención de AGENTS.md. Los mocks tipan sus constantes (`staff: SidebarUser`, `navItems: NavItem[]`, `posts: FeedPost[]`) y `POST_TYPE_LABEL: Record<PostType, string>` concentrates el único mapeo tipo → etiqueta; colores e íconos quedan en `PostCard.tsx`.
- **Sí:** enlaces inertes (`<a>` sin `href`, `<button type="button">` sin handler) — fidelidad visual sin rutas fantasma. _(decisión del usuario)_
- **Sí:** un único `Sidebar.tsx` reutilizado por el layout desktop y el drawer — misma fuente visual, cero duplicación.
- **Sí:** `MobileMenu.tsx` como client component con `useState` — único estado cliente de la spec.
- **Sí:** drawer del mismo ancho que el sidebar (248px) — contenido idéntico.
- **Sí:** modo claro fijo — la referencia no tiene variante oscura.
- **Sí:** SVGs inline copiados de la referencia — no se agregan dependencias de íconos.
- **Sí:** archivos de componentes en PascalCase (`Sidebar.tsx`) — convención extendida de Next.js.
- **No:** barra superior móvil — duplicaría encabezados; el botón flotante es más liviano.
- **No:** FAB de "Nueva publicación" en móvil — redundante con la caja "Compartí un momento…" y el drawer.
- **No:** links a rutas 404 — mala UX y ruido en la verificación.
- **No:** fecha dinámica — sin fuente de datos no aporta nada.
- **No:** likes/comentarios funcionales — sin DB, los contadores son mock.

## Risks

| Riesgo                                                                  | Mitigación                                                                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| No existe referencia móvil: el drawer/hamburguesa es diseño inventado   | Reutilizar el `Sidebar` exacto y la paleta de la referencia; la fidelidad "idéntica" solo se exige en desktop. |
| `next/font` puede exigir `weight` explícito para Fredoka/Nunito         | Verificar la API exacta contra la documentación (Context7) durante el paso 2.                                  |
| Crear `app/(daycare)/page.tsx` sin borrar `app/page.tsx` rompe el build | El paso 4 hace ambas cosas juntas.                                                                             |
| Drawer abierto puede dejar scroll del fondo o foco atrapado             | Cierre por overlay/X/Esc; `aria-expanded` en el botón; body sin scroll mientras está abierto.                  |

## What is **not** in this spec

- Las otras 15 pantallas (cada una va en su propia spec).
- Autenticación y cierre de sesión real.
- Base de datos, persistencia y mutaciones (likes, comentarios, posts).
- Fecha dinámica y fotos reales.
- FAB de nueva publicación en móvil.

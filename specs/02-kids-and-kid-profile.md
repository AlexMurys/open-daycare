# SPEC 02 — Niños `/kids` y perfil del niño `/kids/[id]`

> **Status:** Implementado
> **Depends on:** SPEC 01 (`specs/01-home-feed.md`) — hereda tokens de `globals.css`, `Sidebar`/`MobileMenu`, layout `app/(daycare)/` y el patrón de mocks en `app/_data/`
> **Date:** 2026-10-05
> **Objective:** Implementar la pantalla Niños (`references/pantallas/ninos.dc.html`) en `/kids` y la de perfil de un niño (`references/pantallas/perfil-nino.dc.html`) en `/kids/[id]`, con mock completo de los 8 niños, buscador funcional, navegación real en el nav lateral y 404 estilado para ids inexistentes.

## Por qué existe esta spec

SPEC 01 resolvió el Feed (`/`) y dejó la base —tokens de diseño, fuentes, layout con sidebar, componentes compartidos y mocks— de la que heredan todas las pantallas. Esta spec agrega las dos primeras pantallas de gestión de niños y es la primera que necesita **más de una ruta** y **datos propios de dominio**: introduce el slug `id` en la URL, el patrón de ruta dinámica, `notFound()`, `generateStaticParams` y un módulo de mock por dominio (`app/_data/kids.ts`).

## Scope

**In:**

- Ruta `/kids` con el diseño completo de la referencia:
  - Encabezado con kicker "GESTIÓN", `h1` "Niños" y botón **Agregar niño** (inerte: `agregar-nino` no existe todavía).
  - Caja de búsqueda "Buscar niño…" **funcional**: filtra las tarjetas en vivo por nombre (estado local de React, sin persistencia).
  - Divisor "SALA SOLES · 8 niños" (literal de la referencia) con línea horizontal.
  - Grilla de 2 columnas con las 8 tarjetas de niño de la referencia, en su orden: Mateo Fernández, Sofía Méndez, Benjamín Ruiz, Valentina Soto, Tomás Díaz, Emma Castro, Lucas Romero, Olivia Vega. Cada tarjeta lleva avatar circular con inicial, nombre (Fredoka), línea "N años · X padres vinculados" y, a la derecha, chip **MANÍ** (Mateo), **LACTOSA** (Tomás), **VINCULAR** (Valentina) o chevron cuando no hay alerta.
  - Hover de tarjeta: borde `#F2A78E` y `translateY(-2px)` con transición de `.15s`.
- Ruta `/kids/[id]` con el diseño completo de la referencia:
  - Link **Volver a Niños** (navega a `/kids`).
  - Cabecera: avatar de 84px con inicial, nombre, línea "N años · Sala Soles" y botón **Editar** (inerte).
  - Caja **Alergias y notas** (rosa `#FBDAD6`, ícono de advertencia), solo cuando el niño tiene alergias.
  - Card de datos con tres filas: **Fecha de nacimiento**, **Sala**, **Ingreso**.
  - Columna derecha: botón oscuro **Resumen del día** (inerte) y card **PADRES VINCULADOS** con los padres del mock, chip de estado (`ACTIVA` / `PENDIENTE`) y link **Vincular otro padre** (inerte).
  - `params` leído como Promise (API async de Next 16) con el tipo global `PageProps<"/kids/[id]">`.
  - `generateStaticParams` con los 8 slugs.
  - `notFound()` + `app/(daycare)/not-found.tsx` estilado en español para ids inexistentes.
- Nav lateral del sidebar con navegación real:
  - **Feed** (`/`) y **Niños** (`/kids`) pasan a ser enlaces navegables; el ítem activo se deriva del `pathname` (`usePathname`), no del dato.
  - "Niños" queda activo tanto en `/kids` como en `/kids/[id]`.
  - `navItems[].href` de "Niños" pasa de `/ninos` a `/kids`; "Avisos" y "Mi cuenta" se documentan con su ruta futura pero se siguen renderizando inertes.
- Mock tipado de los 8 niños en `app/_data/kids.ts` (módulo nuevo, separado del mock del Feed): Mateo con los datos literales de la referencia, los otros 7 con datos plausibles y **consistentes con su tarjeta** de la grilla (edad, cantidad de padres y chip de alergia).
- Responsive heredado de SPEC 01: grilla de 1 columna por debajo de `md`, columnas del perfil apiladas en viewport angosto, sin scroll horizontal desde 360px, drawer móvil sigue funcionando con el nav real.

**Out of scope (for future specs):**

- Pantallas referenciadas que aparecen enlazadas desde estas dos pero no se construyen aquí: `agregar-nino`, `resumen-dia`, `vincular-padre`.
- El resto de pantallas pendientes: `crear-publicacion`, `detalle-publicacion`, `foto`, `avisos`, `mi-cuenta`, `login`, `activar-cuenta`, `familia-feed`, `familia-cuenta`, `index`.
- Autenticación, roles y cierre de sesión real.
- Base de datos, persistencia y mutaciones (alta de niños, vincular padres, editar).
- Búsqueda por otra cosa que no sea el nombre; ordenamiento; filtros por sala o por alerting.
- Un diseño de 404 tomado de Penpot: el 404 se diseña mínimo con la paleta del proyecto.

## Data model

```ts
// app/_data/kids.ts
export type KidAvatarColor =
  | "sky"
  | "rose"
  | "mint"
  | "amber"
  | "violet"
  | "blue";

export type ParentRelation = "Mamá" | "Papá";

export type ParentStatus = "active" | "pending";

export interface ParentLink {
  name: string; // "Lucía Fernández"
  initial: string; // "L"
  relation: ParentRelation; // "Mamá" · "Papá"
  status: ParentStatus; // "activa" · "invitación enviada"
  avatarColor: KidAvatarColor;
}

export interface Kid {
  id: string; // slug de la URL: "mateo-fernandez"
  name: string; // "Mateo Fernández"
  initial: string; // "M"
  age: number; // 3
  parents: ParentLink[]; // su longitud define "N padres vinculados"
  avatarColor: KidAvatarColor;
  allergyLabel?: string; // chip de la grilla: "MANÍ" · "LACTOSA"
  allergyNotes?: string; // texto de la caja "Alergias y notas"
  birthDate: string; // "12 mar 2022"
  room: string; // "Soles"
  enrolledSince: string; // "feb 2025"
}

export const kids: Kid[] = [
  /* los 8 de la grilla, en el orden de la referencia */
];
```

```ts
// app/_data/mock.ts (modificaciones)
export interface NavItem {
  label: string; // "Feed" · "Niños" · "Avisos" · "Mi cuenta"
  href: string; // ruta real si está en builtNavRoutes, si no ruta futura documentada
  icon: NavIcon;
} // isActive se elimina: el estado activo se deriva del pathname

export const builtNavRoutes: readonly string[] = ["/", "/kids"];
```

Convenciones: identificadores en inglés, strings visibles al usuario en español, fechas como strings literales sin parsing. Los datos de cada niño:

| `id`              | Nombre          | Edad | Padres | Chip        | Avatar |
| ----------------- | --------------- | ---- | ------ | ----------- | ------ |
| `mateo-fernandez` | Mateo Fernández | 3    | 2      | MANÍ        | sky    |
| `sofia-mendez`    | Sofía Méndez    | 2    | 1      | — (chevron) | rose   |
| `benjamin-ruiz`   | Benjamín Ruiz   | 3    | 2      | — (chevron) | mint   |
| `valentina-soto`  | Valentina Soto  | 2    | 0      | VINCULAR    | amber  |
| `tomas-diaz`      | Tomás Díaz      | 3    | 1      | LACTOSA     | violet |
| `emma-castro`     | Emma Castro     | 2    | 1      | — (chevron) | rose   |
| `lucas-romero`    | Lucas Romero    | 3    | 1      | — (chevron) | sky    |
| `olivia-vega`     | Olivia Vega     | 2    | 1      | — (chevron) | mint   |

Lo derivado (no vive en el dato):

- **"N padres vinculados" / "N padre vinculado" / "sin padres vinculados"**: se compone en el componente desde `parents.length` (0, 1, ≥2).
- **Chip VINCULAR**: se muestra cuando `allergyLabel` no existe y `parents.length === 0`; el chip de alergia manda sobre él.
- **Colores de avatar**: el dato guarda una clave semántica (`KidAvatarColor`) y el componente resuelve el par `bg`/`fg`. Paleta de la referencia:

  | Clave    | Fondo     | Texto                               |
  | -------- | --------- | ----------------------------------- |
  | `sky`    | `#A9D9E8` | `#1F7A93`                           |
  | `rose`   | `#F4B8CC` | `#C44A7A`                           |
  | `mint`   | `#B9DEC4` | `#3E8B62`                           |
  | `amber`  | `#F4DC8E` | `#9A7B1E`                           |
  | `violet` | `#C9B6E8` | `#7B5FC0`                           |
  | `blue`   | `#A9C7E8` | `#FFFFFF` (padres de la referencia) |

- **Colores de chip**: el de alergia usa `#FBD8CC`/`#D9684A`; el de vincular, `#F9D2DE`/`#C56486`. El texto "X padres vinculados" se compone en el componente.

Mateo reproduce los datos literales de la referencia (`birthDate: "12 mar 2022"`, `enrolledSince: "feb 2025"`, padres Lucía —Mamá, `active`— y Diego —Papá, `pending`—, `allergyNotes: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila."`). Los otros 7 se inventan de forma plausible y **consistente con su tarjeta**: la cantidad de padres coincide, y solo Mateo y Tomás tienen alergias (solo Mateo con `allergyNotes` largo, como en la referencia; los demás con una nota corta coherente con su chip).

## Estructura de archivos

```
app/
  layout.tsx                          # sin cambios
  globals.css                         # sin cambios (los colores nuevos van como valores inline en el mapa de avatares)
  _data/
    mock.ts                           # navItems: href "Niños" → /kids, se quita isActive, nuevo builtNavRoutes
    kids.ts                           # NUEVO: Kid, ParentLink, ParentStatus, KidAvatarColor, kids
  components/
    shared/
      Sidebar.tsx                     # pasa a client: usePathname + Link reales para builtNavRoutes
      MobileMenu.tsx                  # sin cambios (el drawer sigue cerrando con onNavigate)
    kids/
      KidsList.tsx                    # NUEVO client: input de búsqueda, filtro por nombre, grilla
      KidCard.tsx                     # NUEVO: tarjeta de la grilla (avatar, chip/chevron, hover) → /kids/[id]
      ProfileHeader.tsx               # NUEVO: avatar 84px, nombre, "N años · Sala Soles", Editar
      AllergyBox.tsx                  # NUEVO: caja rosa "Alergias y notas"
      DetailsCard.tsx                 # NUEVO: card con las tres filas de datos
      ParentsCard.tsx                 # NUEVO: PADRES VINCULADOS + chips de estado + "Vincular otro padre"
  (daycare)/
    layout.tsx                        # sin cambios
    page.tsx                          # sin cambios (Feed)
    not-found.tsx                     # NUEVO: 404 estilado en español
    kids/
      page.tsx                        # NUEVO: encabezado, buscador, divisor, grilla
      [id]/
        page.tsx                      # NUEVO: perfil del niño (params async, notFound, generateStaticParams)
```

`PageProps` y `LayoutProps` son globales (los genera `next typegen`); no se importan.

## Implementation plan

Cada paso deja la app funcionando y verificable.

1. **`app/_data/kids.ts`**: tipos (`KidAvatarColor`, `ParentRelation`, `ParentStatus`, `ParentLink`, `Kid`) y `kids` con los 8 niños en el orden de la grilla, con `avatarColor` semántico. Manual: `pnpm exec tsc --noEmit`.
2. **`app/_data/mock.ts`**: `navItems[].href` de "Niños" pasa a `/kids`, se elimina `isActive` del tipo y de los datos, y se agrega `builtNavRoutes = ["/", "/kids"]`. Manual: `pnpm exec tsc --noEmit` (el error de `isActive` es esperado hasta el paso 3).
3. **Nav real**: `Sidebar.tsx` pasa a `"use client"` con `usePathname`; cada ítem cuyo `href` está en `builtNavRoutes` se renderiza como `next/link` con el estado activo calculado (exacto para `/`, prefijo para `/kids/*`), los demás inertes como antes; el `onNavigate` del drawer se conserva en los enlaces nuevos. Manual: `/` sigue igual con Feed activo, `tsc` limpio, el drawer sigue abriendo y cerrando.
4. **404**: `app/(daycare)/not-found.tsx` mínimo y en español con los tokens del proyecto (título Fredoka, mensaje, link a `/`). Manual: `/ruta-inexistente` muestra el 404 dentro del layout con sidebar.
5. **Ruta `/kids`**: `app/(daycare)/kids/page.tsx` (kicker "GESTIÓN", `h1` "Niños", botón inerte "Agregar niño", divisor "SALA SOLES · 8 niños") + `components/kids/KidsList.tsx` (client: input con ícono de lupa, estado de búsqueda, filtra por nombre sin distinguir mayúsculas) + `components/kids/KidCard.tsx` (avatar, nombre, línea de padres, chip/chevron, hover) que enlaza a `/kids/[id]`. Manual: `/kids` muestra las 8 tarjetas en orden y el buscador filtra en vivo.
6. **Ruta `/kids/[id]`**: `app/(daycare)/kids/[id]/page.tsx` con `PageProps<"/kids/[id]">`, `const { id } = await params`, búsqueda en `kids` por `id`, `notFound()` cuando no existe, `generateStaticParams` con los 8 slugs; más `ProfileHeader.tsx`, `AllergyBox.tsx` (solo si hay notas), `DetailsCard.tsx` y `ParentsCard.tsx`, con "Resumen del día", "Editar" y "Vincular otro padre" inertes y "Volver a Niños" como `Link` a `/kids`. Manual: `/kids/mateo-fernandez` replica la referencia y `/kids/no-existe` devuelve el 404 estilado.
7. **Pulido responsive y fidelidad**: grilla de 1 columna por debajo de `md`, columnas del perfil apiladas en angosto, sin scroll horizontal desde 360px; comparación lado a lado contra `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html` en desktop, ajustando espaciados, radios, sombras y tipografía.
8. **Verificación final con reinicio limpio del dev server** (en ese orden, sin saltos):
   1. `pnpm exec eslint app`, `pnpm exec tsc --noEmit` y `pnpm build` terminan sin errores.
   2. **Matar el proyecto corriendo antes de comprobar**: leer el PID y el puerto de `.next/dev/lock`; si el proceso sigue vivo, `kill <pid>` y confirmar que el puerto quedó libre; si no hay lock, revisar que ningún proceso ocupe el puerto (por ejemplo `lsof -ti :3000`) y matar solo los que pertenezcan a este proyecto.
   3. Re-levantar con `pnpm dev` sobre el puerto libre.
   4. Comprobar en runtime, sin errores ni warnings en la terminal: `/` (con Feed activo), `/kids` (8 tarjetas, buscador filtrando, Niño activo), `/kids/mateo-fernandez` (perfil completo, Niño activo, "Volver a Niños" funciona), `/kids/<otro-slug>` y `/kids/no-existe` (404 estilado), el drawer móvil y la grilla en viewport angosto.

## Acceptance criteria

- [x] `pnpm exec eslint app` termina sin errores.
- [x] `pnpm exec tsc --noEmit` termina sin errores.
- [x] `pnpm build` completa con éxito.
- [x] Antes de la verificación en runtime, el dev server anterior fue matado (PID de `.next/dev/lock`, puerto 3000) y `pnpm dev` se volvió a levantar sobre el puerto libre.
- [x] Con el dev server recién levantado, `/`, `/kids` y `/kids/[id]` no loguean errores ni warnings en la terminal.
- [x] `/kids` muestra el kicker "GESTIÓN", el título "Niños" y el botón "Agregar niño" inerte (no navega ni cambia la URL).
- [x] `/kids` muestra el divisor "SALA SOLES · 8 niños".
- [x] `/kids` muestra las 8 tarjetas en el orden de la referencia: Mateo, Sofía, Benjamín, Valentina, Tomás, Emma, Lucas, Olivia.
- [x] Cada tarjeta muestra avatar con inicial, nombre y la línea correcta de edad y padres vinculados ("2 padres", "1 padre", "sin padres").
- [x] Los chips aparecen donde corresponde: MANÍ en Mateo, LACTOSA en Tomás, VINCULAR en Valentina, y chevron en las otras cinco.
- [x] Al escribir en el buscador, la grilla se filtra por nombre en vivo; al borrar el texto, vuelven a aparecer las 8 tarjetas.
- [x] La tarjeta tiene hover con borde más oscuro y elevación sutil, como en la referencia.
- [x] Clic en una tarjeta navega a `/kids/<slug>` del niño correcto.
- [x] `/kids/[id]` muestra "Volver a Niños" que lleva a `/kids`.
- [x] `/kids/[id]` muestra avatar, nombre, "N años · Sala Soles", la caja de alergias cuando corresponde y las tres filas de datos (fecha de nacimiento, sala, ingreso).
- [x] `/kids/[id]` muestra la card "PADRES VINCULADOS" con los padres del mock y sus chips de estado (`ACTIVA` / `PENDIENTE`).
- [x] "Editar", "Resumen del día" y "Vincular otro padre" se renderizan pero no navegan.
- [x] `/kids/no-existe` devuelve el 404 estilado en español dentro del layout con sidebar.
- [x] En el sidebar, "Niños" es el ítem activo en `/kids` y en `/kids/[id]`, y "Feed" lo es en `/`; "Avisos" y "Mi cuenta" no navegan.
- [x] Los enlaces "Feed" y "Niños" del sidebar navegan de verdad, y el drawer móvil sigue cerrando al navegar.
- [x] Por debajo de `md` la grilla pasa a 1 columna y las columnas del perfil se apilan; no hay scroll horizontal desde 360px.
- [x] En desktop, `/kids` y `/kids/[id]` se ven iguales a `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html` (comparación visual).

## Decisions

- **Sí:** las dos pantallas van en una sola spec — comparten datos, navegación y el mismo archivo de perfil. _(decisión del usuario)_
- **Sí:** `/kids` y `/kids/[id]` en inglés, como pidió el usuario, aunque el resto de rutas futuras del nav están en español. _(decisión del usuario)_
- **Sí:** rutas "/kids" y "/kids/[id]" como Path Alias de navegación. _(decisión del usuario)_
- **Sí:** `navItems[].href` de "Niños" pasa a `/kids`, aunque la referencia de Penpot use `ninos.dc.html`. _(decisión del usuario)_
- **Sí:** links reales en el nav lateral + estado activo derivado de `usePathname` (Sidebar pasa a client). _(decisión del usuario)_
- **Sí:** buscador funcional con filtro en vivo por nombre. _(decisión del usuario)_
- **Sí:** los 8 niños tienen perfil completo y cada tarjeta lleva a un perfil real. _(decisión del usuario)_
- **Sí:** `notFound()` en id desconocido + `app/(daycare)/not-found.tsx` estilado mínimo en español. _(decisión del usuario)_
- **Sí:** botones a pantallas no construidas (Agregar niño, Editar, Resumen del día, Vincular otro padre) inertes, como en SPEC 01. _(decisión del usuario)_
- **Sí:** mocks de niños en un módulo nuevo `app/_data/kids.ts` en vez de crecer `mock.ts` — separa el dominio de niños del Feed y deja el archivo listo para crecer con `agregar-nino`.
- **Sí:** `builtNavRoutes` en `mock.ts` como fuente de verdad de qué rutas del nav existen — el Sidebar no lleva una lista de rutas hardcodeada.
- **Sí:** `isActive` desaparece del dato y se calcula en el componente, para que `/kids/[id]` herede el activo sin props.
- **Sí:** el chip VINCULAR y la línea de padres se derivan de `parents.length`; solo el texto del chip de alergia es dato.
- **Sí:** claves de color de avatar semánticas (`sky`, `rose`, …) en el dato y paleta en el componente — cada niño tiene un color distinto, así que un mapa por tipo no alcanzaba.
- **Sí:** `generateStaticParams` con los 8 slugs, para que los perfiles se prerendericen en build.
- **Sí:** el 404 vive en `app/(daycare)/not-found.tsx` (nivel del grupo) para que lo reutilicen las pantallas siguientes.
- **Sí:** "8 niños" se muestra literal en `/kids` aunque el Feed diga "12 niños" — cada pantalla reproduce lo que dice su referencia.
- **No:** backend, base de datos, autenticación ni mutaciones — los mocks siguen siendo constantes.
- **No:** búsqueda por apellido, orden o filtros adicionales.
- **No:** enlazar las tarjetas de la grilla a rutas que no existen (404 evitables).
- **No:** modificar `globals.css` — los colores nuevos de avatar y chip son de uso puntual y van como valores inline en el mapa del componente.
- **No:** una pantalla de error sacada de Penpot; no existe referencia.

## Risks

| Riesgo                                                                                                  | Mitigación                                                                                              |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Siete perfiles inventados pueden contradecir pantallas futuras (`agregar-nino`, `resumen-dia`)          | Datos plausibles y coherentes con la grilla (padres, edad, alergias); fáciles de ajustar en el mock     |
| El 404 no tiene diseño de referencia                                                                    | Mínimo, en español, solo con tokens existentes y link de vuelta al Feed                                 |
| `Sidebar` como client component: `usePathname` no está disponible en server components                  | Marcarlo `"use client"` explícitamente; el resto sigue siendo render de servidor sin estado             |
| Detectar el activo con `pathname.startsWith("/kids")` puede activar "Niños" en rutas futuras unforeseen | Comparar contra `builtNavRoutes`; si en el futuro existe `/kids/foo`, el prefijo se revisa en esa spec  |
| `generateStaticParams` + `notFound()` en rutas dinámicas                                                | Verificar la API contra la documentación de Next 16 en `node_modules/next/dist/docs/` durante el paso 6 |
| Rejilla de 2 columnas en viewport angosto                                                               | Grid de 1 columna bajo `md` y sin anchos fijos; revisar sin scroll horizontal desde 360px               |

## What is **not** in this spec

- `agregar-nino`, `resumen-dia` y `vincular-padre` (los botones quedan inertes).
- El resto de pantallas pendientes (cada una va en su propia spec).
- Autenticación, roles y cierre de sesión real.
- Base de datos, persistencia y mutaciones.
- Búsqueda por otros criterios que no sean el nombre.
- Un diseño de 404 tomado de Penpot.

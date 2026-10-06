# SPEC 03 — Login `/login` y activar cuenta `/activate-account`

> **Status:** Approved
> **Depends on:** SPEC 01 (`specs/01-home-feed.md`) — hereda tokens de `globals.css`, fuentes del root layout y el patrón de mocks en `app/_data/`
> **Date:** 2026-10-06
> **Objective:** Implementar las pantallas Login (`references/pantallas/login.dc.html`) en `/login` y Activar cuenta (`references/pantallas/activar-cuenta.dc.html`) en `/activate-account`, como páginas pre-autenticación en un route group nuevo `app/(auth)/` sin sidebar, con fidelidad visual total en desktop (sin la sección "INGRESO COMO" del login) y responsive sin scroll horizontal desde 360px, sin autenticación real.

## Por qué existe esta spec

SPEC 01 y 02 cubrieron el área autenticada dentro de `app/(daycare)/` (layout con sidebar). Estas son las primeras pantallas fuera de esa área: introducen el route group `(auth)`, los primeros formularios de la app y la única interacción con estado de la spec (el checkbox de autorización). Además registran una decisión de producto: eliminar el selector de rol "Personal / Familia" del login.

## Scope

**In:**

- Ruta `/login` con el diseño completo de la referencia en desktop:
  - Grid de dos columnas (`1.05fr 1fr`) sobre fondo crema de auth (`#FBF4EC`), alto completo del viewport.
  - Panel coral izquierdo: gradiente `linear-gradient(155deg,#F6A98E 0%,#F2937A 45%,#EC7E62 100%)`, dos círculos decorativos blancos translúcidos (420px arriba-derecha al 12%, 300px abajo-izquierda al 10%), logo OpenDayCare (caja blanca al 22% + sol), titular "El día de cada niño, compartido con su familia." (Fredoka), tagline "Publicá momentos, gestioná las salas y mantené a las familias cerca, desde un solo lugar." y footer "🌿 Guardería Sala Soles".
  - Columna derecha: título "Iniciar sesión", subtítulo "Ingresá para ver el día de hoy.", label EMAIL + input **vacío** con placeholder `caro@opendaycare.com` (placeholder `#B6A99B`), label CONTRASEÑA + input password con placeholder `••••••••`, "¿Olvidaste tu contraseña?" (inerte), botón coral "Iniciar sesión" que navega a `/` y texto "¿Te invitó la guardería? **Activá tu cuenta**" con link a `/activate-account`.
  - **Sin** la sección "INGRESO COMO" ni los botones "Personal" / "Familia" ni ningún estado de rol (decisión del usuario).
- Ruta `/activate-account` con el diseño completo de la referencia:
  - Ícono-tile degradado con el sol (reutiliza los tokens `accent-mist` → `accent-pale`), título "Bienvenida a OpenDayCare" y subtítulo "Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta."
  - Card de invitación blanca con avatar "M" (tokens `activity-avatar` / `activity-deep`), "Te invitaron a seguir a" y "Mateo · Sala Soles", alimentada por `app/_data/invite.ts`.
  - Campos precargados y editables, sin validación: CÓDIGO DE INVITACIÓN (`7K4P9`, Fredoka, letter-spacing 3px), EMAIL (`lucia.fernandez@gmail.com`), CREAR CONTRASEÑA (`type="password"`, borde resaltado `#F2A78E`).
  - Checkbox de autorización (caja amarilla `#FBF1D6`, texto `#8A7234`, check verde `#5FB97E`) con **toggle funcional** (client component, `useState`, arranca marcado, sin persistencia).
  - Botón coral "Activar mi cuenta" **inerte** (`familia-feed` no existe) y "¿Ya tenés cuenta? **Iniciar sesión**" con link a `/login`.
- Mock tipado de la invitación en `app/_data/invite.ts` (módulo nuevo, separado de `mock.ts` y `kids.ts`).
- Componentes en `app/components/auth/` (contexto nuevo).
- Layout mínimo de `app/(auth)/` con el fondo de auth y alto completo; las pantallas **no** heredan el sidebar de `(daycare)`.
- Responsive: bajo `md` (768px) el panel coral del login se oculta y aparece una marca compacta (tile + "OpenDayCare") encima del formulario; `activate-account` es de una columna y solo ajusta padding; sin scroll horizontal desde 360px en ambas.
- Metadata por página: "Iniciar sesión · OpenDayCare" y "Activar cuenta · OpenDayCare".

**Out of scope (for future specs):**

- La sección "INGRESO COMO / Personal / Familia" y el estado de rol del login (eliminada por decisión del usuario).
- Autenticación real, validación de credenciales, submit de formularios y "¿Olvidaste tu contraseña?" funcional (queda inerte).
- El botón "Cerrar sesión" del sidebar del área daycare (sigue inerte; va con la autenticación real).
- `familia-feed` y el flujo post-activación (el botón "Activar mi cuenta" queda inerte hasta que esa pantalla exista).
- Redirecciones entre `/` y `/login` (el feed sigue siendo la home).
- El resto de pantallas pendientes: `crear-publicacion`, `detalle-publicacion`, `foto`, `agregar-nino`, `avisos`, `resumen-dia`, `mi-cuenta`, `familia-feed`, `familia-cuenta`, `index`, `vincular-padre`.
- Base de datos, persistencia y envío de emails de invitación.

## Data model

```ts
// app/_data/invite.ts
export interface Invitation {
  code: string; // "7K4P9"
  email: string; // "lucia.fernandez@gmail.com"
  childName: string; // "Mateo"
  room: string; // "Sala Soles"
  initial: string; // "M"
}

export const invitation: Invitation = {
  code: "7K4P9",
  email: "lucia.fernandez@gmail.com",
  childName: "Mateo",
  room: "Sala Soles",
  initial: "M",
};
```

Convenciones: identificadores en inglés, strings visibles al usuario en español. "Mateo · Sala Soles" se compone en `InviteCard.tsx` desde `childName`/`room` (patrón SPEC 02: lo derivado no vive en el dato). El avatar no guarda color: `InviteCard.tsx` usa directo los tokens `activity-avatar` (`#A9D9E8`) y `activity-deep` (`#1F7A93`), que ya existen de SPEC 02.

Tokens nuevos en `globals.css` (los únicos): `--color-auth-canvas: #fbf4ec` y `--color-auth-line: #eadfd0`. Las referencias de auth usan un crema y un borde de input propios (no son `canvas`/`line` de SPEC 01) y son la base de las dos pantallas, por eso van a tokens y no inline. El resto de colores puntuales (gradiente del panel, círculos, caja amarilla del consentimiento, `#F2A78E`, placeholder `#B6A99B`) van como valores inline en los componentes, como en SPEC 02.

## Estructura de archivos

```
app/
  globals.css                        # +2 tokens: --color-auth-canvas, --color-auth-line
  layout.tsx                         # sin cambios
  _data/
    mock.ts                          # sin cambios
    kids.ts                          # sin cambios
    invite.ts                        # NUEVO: Invitation + invitation
  components/
    auth/                            # NUEVO contexto
      BrandPanel.tsx                 # NUEVO (server): panel coral completo del login
      LoginForm.tsx                  # NUEVO (server): título, campos, olvidaste, Link → /, link a /activate-account
      InviteCard.tsx                 # NUEVO (server): card "Te invitaron a seguir a…" desde invitation
      ConsentCheckbox.tsx            # NUEVO (client): toggle useState, arranca marcado
  (auth)/
    layout.tsx                       # NUEVO mínimo: fondo auth-canvas + alto del viewport
    login/
      page.tsx                       # NUEVO: grid 2 columnas (BrandPanel + LoginForm) + marca compacta móvil
    activate-account/
      page.tsx                       # NUEVO: tile, título, InviteCard, campos, ConsentCheckbox, botón inerte
  (daycare)/                         # sin cambios en esta spec
```

`(auth)` no compite con `(daycare)`: `/login` y `/activate-account` son rutas nuevas, `/` y `/kids` no se tocan. Los elementos inertes siguen el patrón de SPEC 01/02: `<button type="button">` sin handler o `<a>`/`<span>` sin `href`.

## Implementation plan

Cada paso deja la app funcionando y verificable.

1. **Tokens**: `app/globals.css` agrega `--color-auth-canvas: #fbf4ec` y `--color-auth-line: #eadfd0` al `@theme`. Manual: la app sigue corriendo sin cambios visuales.
2. **`app/_data/invite.ts`**: tipo `Invitation` + `invitation` con los literales de la referencia. Manual: `pnpm exec tsc --noEmit`.
3. **`app/(auth)/layout.tsx`**: mínimo, fondo `auth-canvas` ocupando el alto del viewport. Manual: `/` y `/kids` siguen intactas (el route group nuevo no altera rutas existentes).
4. **`app/components/auth/BrandPanel.tsx`**: panel coral completo (gradiente, círculos, logo, titular, tagline, footer). Manual: `pnpm exec tsc --noEmit`.
5. **`LoginForm.tsx` + `app/(auth)/login/page.tsx`**: página desktop completa — grid `md:grid-cols-[1.05fr_1fr]`, BrandPanel + LoginForm, input email vacío con placeholder, botón como `Link` a `/`, link "Activá tu cuenta" a `/activate-account`, metadata de página. Manual: `/login` replica la referencia en desktop, sin la sección de rol.
6. **Responsive del login**: bajo `md` el BrandPanel se oculta (`hidden md:grid`) y la marca compacta (tile + "OpenDayCare") aparece encima del form; sin scroll horizontal desde 360px. Manual: emular viewport angosto en el navegador.
7. **`InviteCard.tsx` + `ConsentCheckbox.tsx`**: card de invitación desde `invitation` y checkbox client con toggle (arranca marcado; estado desmarcado con cuadrado bordeado del mismo tamaño). Manual: `pnpm exec tsc --noEmit`.
8. **`app/(auth)/activate-account/page.tsx`**: página completa — tile, título, subtítulo, InviteCard, tres campos precargados, ConsentCheckbox, "Activar mi cuenta" inerte, link "Iniciar sesión" a `/login`, metadata de página. Manual: `/activate-account` replica la referencia.
9. **Pulido de fidelidad**: comparación lado a lado en desktop contra `references/pantallas/login.dc.html` y `references/pantallas/activar-cuenta.dc.html`; ajustar espaciados, radios, sombras y tipografía; probar ambas en angosto.
10. **Verificación final con reinicio limpio del dev server** (en ese orden, sin saltos):
    1. `pnpm exec eslint app`, `pnpm exec tsc --noEmit` y `pnpm build` terminan sin errores.
    2. Matar el dev server corriendo: leer el PID y el puerto de `.next/dev/lock`; si el proceso sigue vivo, `kill <pid>` y confirmar el puerto libre; si no hay lock, revisar `lsof -ti :3000` y matar solo los de este proyecto.
    3. Re-levantar con `pnpm dev`.
    4. Comprobar en runtime, sin errores ni warnings en la terminal: `/login` (dos columnas, sin sección de rol, botón navega a `/`), `/activate-account` (campos precargados, checkbox alterna, botón inerte, link a `/login`), ambas en angosto, y `/`, `/kids`, `/kids/[id]` siguen intactas.

## Acceptance criteria

- [ ] `pnpm exec eslint app` termina sin errores.
- [ ] `pnpm exec tsc --noEmit` termina sin errores.
- [ ] `pnpm build` completa con éxito.
- [ ] Con el dev server relanzado limpio (PID de `.next/dev/lock` matado antes), `/login` y `/activate-account` no loguean errores ni warnings en la terminal.
- [ ] Ni `/login` ni `/activate-account` muestran el sidebar ni el layout de `(daycare)`; `/`, `/kids` y `/kids/[id]` siguen funcionando igual.
- [ ] `/login` en desktop muestra el grid de dos columnas y el panel coral con gradiente 155deg, los dos círculos blancos translúcidos, el logo con sol, el titular "El día de cada niño, compartido con su familia.", la tagline y el footer "🌿 Guardería Sala Soles".
- [ ] `/login` no renderiza la sección "INGRESO COMO" ni los botones "Personal" / "Familia".
- [ ] El input EMAIL está vacío con placeholder `caro@opendaycare.com` en `#B6A99B`; CONTRASEÑA es `type="password"` con placeholder `••••••••`; ambos editables y sin validación.
- [ ] "¿Olvidaste tu contraseña?" se renderiza y no navega.
- [ ] El botón "Iniciar sesión" navega a `/` (feed).
- [ ] El link "Activá tu cuenta" navega a `/activate-account`.
- [ ] Bajo `md`: el panel coral desaparece, la marca compacta aparece encima del form y no hay scroll horizontal desde 360px.
- [ ] `/activate-account` muestra el tile degradado con el sol, "Bienvenida a OpenDayCare" y su subtítulo.
- [ ] La card de invitación muestra el avatar "M" (celeste `#A9D9E8` / `#1F7A93`), "Te invitaron a seguir a" y "Mateo · Sala Soles", alimentada por `app/_data/invite.ts`.
- [ ] Los campos CÓDIGO (`7K4P9`, Fredoka, tracking 3px), EMAIL (`lucia.fernandez@gmail.com`) y CREAR CONTRASEÑA (enmascarado, borde `#F2A78E`) van precargados como en la referencia.
- [ ] El checkbox de autorización arranca marcado (check verde) y alterna su estado al clic; sin persistencia.
- [ ] El botón "Activar mi cuenta" se renderiza y no navega.
- [ ] El link "Iniciar sesión" del footer navega a `/login`.
- [ ] Las pestañas muestran "Iniciar sesión · OpenDayCare" y "Activar cuenta · OpenDayCare".
- [ ] En desktop, `/login` y `/activate-account` se ven idénticas a sus referencias `.dc.html` (comparación visual; única salvedad: la sección de rol eliminada por decisión).

## Decisions

- **Sí:** las dos pantallas en una sola spec — comparten route group, contexto `auth/` y convenciones de formulario. _(decisión del usuario)_
- **Sí:** rutas `/login` y `/activate-account` en inglés, como `/kids` en SPEC 02. _(decisión del usuario)_
- **Sí:** route group `app/(auth)/` con layout mínimo propio — separa las pre-auth del área `(daycare)` y centraliza el fondo de auth. _(acepta recomendación)_
- **Sí:** sin sección "INGRESO COMO / Personal / Familia" ni estado de rol en el login. _(decisión del usuario, explícita en el pedido)_
- **Sí:** el botón "Iniciar sesión" navega a `/` — el destino existe; sin backend es la forma más fiel de "entrar" y evita un botón muerto. _(acepta recomendación)_
- **Sí:** "Activar mi cuenta" inerte — `familia-feed` no existe todavía; consistente con la decisión de SPEC 01/02 de no enlazar a rutas 404. _(acepta recomendación)_
- **Sí:** "¿Olvidaste tu contraseña?" inerte — no hay pantalla destino ni flujo de recuperación.
- **Sí:** email del login vacío con placeholder `caro@opendaycare.com` — sin selector de rol ya no hay estado que lo precargue; el placeholder documenta la cuenta demo. _(acepta recomendación)_
- **Sí:** inputs editables sin validación ni submit; checkbox de autorización con toggle funcional (`useState`, único estado cliente de la spec). _(acepta recomendación)_
- **Sí:** campos de `/activate-account` precargados con los literales de la referencia — su estado es estático, no depende de interacción. _(acepta recomendación)_
- **Sí:** mock de la invitación en `app/_data/invite.ts` (módulo tipado nuevo) — sigue el patrón de `mock.ts`/`kids.ts` y deja la invitación reutilizable. _(decisión del usuario)_
- **Sí:** responsive con panel oculto bajo `md` + marca compacta — la referencia es solo desktop; inventar menos. _(acepta recomendación)_
- **Sí:** 2 tokens nuevos (`auth-canvas`, `auth-line`) — son la base de las dos pantallas, a diferencia de los colores puntuales de SPEC 02 que fueron inline. El resto de colores puntuales va inline.
- **No:** enlazar el logout del sidebar a `/login` — fuera de scope; se trata con la autenticación real. _(decisión del usuario)_
- **No:** autenticación, validación, redirección `/` → `/login` y flujo real de activación.
- **No:** botones como `<a href="#">` — los inertes se renderizan como `<button type="button">` sin handler, patrón SPEC 01.

## Risks

| Riesgo                                                                                                    | Mitigación                                                                                                                     |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| La referencia es solo desktop: la marca compacta móvil y el estado desmarcado del checkbox son inventados | Reusar piezas del propio diseño (tile del header, cuadrado del mismo tamaño); la fidelidad "idéntica" solo se exige en desktop |
| Colores de auth casi iguales a los de SPEC 01 (`#FBF4EC` vs `#F6ECDF`, `#EADFD0` vs `#ECE0D0`)            | Tokens con nombre propio `auth-*`; comparación visual lado a lado contra el `.dc.html`                                         |
| Checkbox como `<label>` estilizado (como la referencia) puede no ser operable por teclado                 | `<input type="checkbox">` nativo oculto + estilado; probar con Tab/Espacio                                                     |
| `(auth)` podría chocar con rutas existentes                                                               | `/login` y `/activate-account` son rutas nuevas; `/`, `/kids` y `/kids/[id]` no se tocan y se verifican al final               |
| Root layout usa `min-h-full` + `flex flex-col`                                                            | El layout de `(auth)` garantiza alto completo y fondo propio; verificar en runtime                                             |

## What is **not** in this spec

- La sección "INGRESO COMO / Personal / Familia" del login.
- Autenticación real, logout, recuperación de contraseña y validación de formularios.
- `familia-feed` y el flujo post-activación ("Activar mi cuenta" queda inerte).
- Redirección de `/` a `/login`.
- Las demás pantallas pendientes (cada una va en su propia spec).

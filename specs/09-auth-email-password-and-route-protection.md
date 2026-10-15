# SPEC 09 — Autenticación real (email + password) y protección de rutas

> **Status:** Implemented
> **Depends on:** SPEC 03 (`specs/03-login-and-account-activation.md`) — pantallas `/login` y `/activate-account` en `app/(auth)/` y `LoginForm.tsx` a convertir; SPEC 08 (`specs/database/08-users-table.md`) — seed staff (`staff@google.com` / `staff123@`) para verificar login real; SPEC 01/02 — rutas `(daycare)` a proteger
> **Date:** 2026-10-15
> **Objective:** Implementar el login real con email y password contra Supabase Auth (`signInWithPassword` vía server actions), el logout del sidebar y la protección de rutas en dos capas (proxy + layout) que dejan `/login` y `/activate-account` públicas y todo lo demás privado.

## Por qué existe esta spec

SPEC 03 dejó el login visual sin autenticación real y SPEC 08 sembró el usuario staff que desbloquea probarla contra Supabase. Los helpers de `@supabase/ssr` ya están instalados (`utils/supabase/{server,client,proxy}.ts`, `proxy.ts` raíz que refresca sesión con `getClaims()`), así que este spec solo agrega la protección y el flujo real. El patrón de protección se validó con Context7 contra la guía oficial de Supabase para Next.js 16 (redirect en el proxy tras `getClaims()`) y la guía de autenticación de Next.js 16 (`redirect()` en layout/server component como verificación autoritativa; nunca `getSession()` para autorización — regla del repo).

## Scope

**In:**

- **Login real en `/login`** (solo email + password):
  - Server actions en `app/actions/auth.ts` (`'use server'`): `login(prevState, formData)` usa `createClient` de `@/utils/supabase/server` + `supabase.auth.signInWithPassword`; con error devuelve `LoginState`; con éxito `revalidatePath("/", "layout")` + `redirect("/")` (patrón oficial Supabase Next.js).
  - `LoginForm.tsx` pasa a **client component** con `<form action={formAction}>` + `useActionState`: inputs con `name="email"`/`name="password"` (+ `required` nativo), botón "Iniciar sesión" pasa de `<Link>` a `type="submit"` con el mismo estilo, error inline en español (`"Email o contraseña incorrectos."`, `role="alert"`) entre el botón y el footer, con la paleta existente.
  - Mismo diseño que SPEC 03: la única adición visual es el estado de error.
- **Logout real**: el botón "Cerrar sesión" de `Sidebar.tsx` (cubre sidebar desktop y drawer móvil, que reusa `Sidebar`) llama la server action `logout()` (`signOut()` + `redirect("/login")`).
- **Protección de rutas en dos capas** (decisión del usuario; `/login` y `/activate-account` públicas, todo lo demás privado):
  - **Capa 1 — `utils/supabase/proxy.ts`**: tras el `getClaims()` existente, si no hay claims y el path no empieza con `/login` ni `/activate-account` → `NextResponse.redirect` a `/login` (patrón oficial Supabase; el resto devuelve `supabaseResponse` intacto). Flash-free, a nivel red.
  - **Capa 2 — `app/(daycare)/layout.tsx`**: pasa a `async`, `createClient(await cookies())` + `getClaims()`; sin claims → `redirect("/login")` desde `next/navigation`.
- **`/login` con sesión activa** → `redirect("/")` (chequeo server en `app/(auth)/login/page.tsx` con `getClaims()`).
- Chequeos de sesión siempre con `getClaims()` (verifica el JWT, sin llamada de red) — nunca `getSession()` para autorización (regla del repo).

**Out of scope (for future specs):**

- Activación real de cuenta: `/activate-account` sigue mock e inerte (la tabla `invitations` no existe; va en su propio spec).
- Políticas RLS auth-based de `users`: los placeholders de SPEC 08 quedan; se cierran en el primer spec que lea datos reales de la DB (decisión del usuario — esta spec no consulta `public.users`).
- Recuperación de contraseña ("¿Olvidaste tu contraseña?" sigue inerte).
- OAuth, magic links, "recordarme", preservar el destino post-login (login siempre → `/`).
- Lectura de datos reales del feed/perfiles (mocks intactos); cambios en DB.
- Las demás pantallas pendientes.

## Data model

```ts
// app/actions/auth.ts — única estructura nueva (estado del form de login)
export interface LoginState {
  error: string | null; // "Email o contraseña incorrectos." | null
}
```

No hay datos persistidos nuevos: la sesión vive en las cookies de Supabase Auth que `@supabase/ssr` ya maneja (`proxy.ts` refresca, `server.ts`/`client.ts` leen/escriben). La DB no se toca.

## Estructura de archivos

```
app/
  actions/
    auth.ts                        # NUEVO ('use server'): login(prevState, formData) + logout()
  (auth)/
    login/page.tsx                 # server: getClaims() → redirect("/") si hay sesión
    activate-account/page.tsx      # sin cambios (mock, pública)
  (daycare)/
    layout.tsx                     # async: getClaims() → redirect("/login") sin sesión (capa 2)
  components/
    auth/LoginForm.tsx             # client: <form> + useActionState, error inline
    shared/Sidebar.tsx             # "Cerrar sesión" → logout()
utils/supabase/
  proxy.ts                         # redirect a /login sin claims (capa 1); server.ts/client.ts intactos
```

## Implementation plan

1. **`app/actions/auth.ts`**: `login` (`signInWithPassword`; error → `LoginState`; éxito → `revalidatePath` + `redirect("/")`) y `logout` (`signOut()` + `redirect("/login")`). Manual: `pnpm exec tsc --noEmit`.
2. **`utils/supabase/proxy.ts`**: redirect a `/login` sin claims (excluyendo `/login` y `/activate-account`), devolviendo `supabaseResponse` intacto en el resto. Manual: sin cookies (ventana privada), `/` cae en `/login`.
3. **`app/(daycare)/layout.tsx`**: capa 2 con `getClaims()` + `redirect`. Manual: con sesión las rutas `(daycare)` renderizan igual; `tsc`.
4. **`app/(auth)/login/page.tsx`**: redirect a `/` con sesión activa. Manual: logueado, `/login` termina en `/`.
5. **`LoginForm.tsx` client + `useActionState`**: form real, inputs `name`/`required`, submit, error inline. Manual: login con `staff@google.com` / `staff123@` → feed; password incorrecta → error inline sin navegar.
6. **`Sidebar.tsx`**: "Cerrar sesión" → `logout()`. Manual: click → `/login`; `/` después redirige a `/login`.
7. **Pulido**: fidelidad de `/login` intacta sin error; foco/teclado del form.
8. **Verificación final con reinicio limpio del dev server** (patrón specs anteriores): `pnpm exec eslint app`, `tsc --noEmit`, `pnpm build`; matar PID de `.next/dev/lock`; relanzar `pnpm dev`; matriz de runtime (login ok/fail, logout, rutas privadas sin sesión, `/login` con sesión, pantallas previas intactas), terminal sin errores/warnings.

## Acceptance criteria

- [x] `pnpm exec eslint app` termina sin errores.
- [x] `pnpm exec tsc --noEmit` termina sin errores.
- [x] `pnpm build` completa con éxito.
- [x] Con el dev server relanzado limpio, los flujos de login/logout/protección no loguean errores ni warnings en la terminal.
- [x] Sin sesión: navegar directamente a `/`, `/kids` y `/kids/1` redirige a `/login` sin renderizar contenido protegido.
- [x] Sin sesión: `/login` y `/activate-account` son accesibles e idénticas a SPEC 03.
- [x] Login con `staff@google.com` / `staff123@` autentica y termina en `/` (feed) con sesión activa.
- [x] Login con password incorrecta muestra el error inline en español bajo el botón y no navega.
- [x] Con sesión activa, visitar `/login` redirige a `/`.
- [x] "Cerrar sesión" (sidebar desktop y drawer móvil) termina la sesión, lleva a `/login`, y `/` vuelve a redirigir a `/login`.
- [x] Con el redirect del proxy deshabilitado temporalmente en dev, `/` sin sesión sigue redirigiendo a `/login` (capa 2 del layout funciona sola).
- [x] Sin cambios en DB: `supabase_list_migrations` sin entradas nuevas y políticas de `users` intactas.
- [x] `/login` en desktop se ve idéntico a la referencia (única adición: estado de error inline).
- [x] Las pantallas previas (feed, kids, dialogs, activate-account) funcionan igual.

## Decisions

- **Sí:** protección en dos capas — proxy (redirect flash-free, patrón oficial Supabase validado con Context7) + layout `(daycare)` (verificación autoritativa, patrón Next.js). _(decisión del usuario)_
- **Sí:** `/login` y `/activate-account` públicas, todo lo demás privado. _(decisión del usuario)_
- **Sí:** logout con server action en el botón "Cerrar sesión" de `Sidebar.tsx` (cubre desktop y móvil). _(decisión del usuario)_
- **Sí:** `/login` con sesión → redirect a `/`. _(decisión del usuario)_
- **Sí:** RLS de `users` queda placeholder; se cierra en el primer spec que lea datos reales. _(decisión del usuario — el login no consulta `public.users`)_
- **Sí:** error de credenciales inline con `useActionState` (patrón de errores en línea de SPEC 04/05/06). _(decisión del usuario)_
- **Sí:** server actions para login/logout (patrón oficial Supabase Next.js, validado con Context7).
- **Sí:** `getClaims()` para todos los chequeos de sesión (verifica JWT sin red; regla del repo: nunca `getSession()` para autorización).
- **Sí:** `/activate-account` pública pero intacta (mock). _(por defecto — tabla `invitations` inexistente)_
- **No:** recuperación de contraseña, preservar destino post-login, OAuth/magic links, cambios en DB/RLS.

## Risks

| Riesgo                                                    | Mitigación                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `redirect()` dentro de server action con `useActionState` | Patrón oficial Next 16/Supabase; se valida en runtime (paso 5)                              |
| El proxy corre en cada request y prefetch                 | `getClaims()` verifica el JWT localmente (sin llamada de red); matcher ya excluye estáticos |
| El redirect del proxy descarta `supabaseResponse`         | Sin sesión no hay cookies que propagar; patrón oficial tal cual (Context7)                  |
| El layout `(daycare)` pasa a `async`                      | `LayoutProps<'/'>` global sigue tipando; `tsc` + `build` validan                            |
| Sesión expira o cookie inválida en navegación             | `getClaims()` falla → tratado como sin sesión → `/login`                                    |

## What is **not** in this spec

- Activación real de cuenta (`/activate-account` mock); recuperación de contraseña.
- RLS auth-based de `users` (placeholders de SPEC 08 hasta el primer spec de datos reales).
- OAuth, magic links, "recordarme", preservar destino post-login.
- Lectura de datos reales del feed/perfiles; cambios en la base de datos.
- Las demás pantallas pendientes (cada una va en su propia spec).

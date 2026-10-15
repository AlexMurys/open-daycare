<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Proyecto

App de guardería en Next.js **16.3.8** + React 19.2 + TypeScript strict + Tailwind **v4** (CSS-first: `@import "tailwindcss"` en `app/globals.css`, sin `tailwind.config`).

- App única en `app/` (App Router, `src/` no existe). Todo lo que escribas va ahí.
- **No hay tests, ni test runner, ni CI.** No inventes `pnpm test`. La verificación es lint + typecheck + `next build` + chequeo en runtime.
- `CLAUDE.md` es un `@AGENTS.md`. Edita solo este archivo.
- Rutas: `@/*` → raíz del repo.

## Comandos

Usa **pnpm**. Ojo: existe un `package-lock.json` obsoleto de `create-next-app`; `pnpm-lock.yaml` + `pnpm-workspace.yaml` + `node_modules/.pnpm` son los reales. No corras `npm install` (mezcla installs y rompe el árbol).

```bash
pnpm dev            # next dev (Turbopack por defecto en 16)
pnpm build          # next build: incluye TypeScript, NO incluye lint
pnpm exec tsc --noEmit   # typecheck aislado
pnpm exec next typegen   # regenera PageProps/LayoutProps/RouteContext si los tipos de ruta están stale
```

`pnpm-workspace.yaml` no define workspaces: solo guarda `allowBuilds: unrs-resolver: false` (ajuste de pnpm 10). Es un archivo único, no un monorepo.

### Trampa conocida: `pnpm lint` falla de origen

`pnpm lint` (`eslint` sin args) escanea **todo** el repo y sale con código 1 por errores dentro de `references/pantallas/support.js`, que es un export de Penpot (código vendor, no tuyo). No es un bug que hayas introducido.

```bash
pnpm exec eslint app   # esto sí debe salir limpio — es el gate real
```

Fix si quieres dejar `pnpm lint` usable: añadir `references/**` al array `globalIgnores` de `eslint.config.mjs`.

## Verificación en runtime

- `next dev` reenvía errores/warnings de la consola del browser a la terminal (`logging.browserToTerminal`) — léelos, no hace falta abrir DevTools.
- El PID/puerto/URL del dev server están en `.next/dev/lock`. Un segundo `next dev` en el mismo proyecto imprime la URL y el PID a matar en vez de arrancar otro.
- El dev server expone un MCP en `/_next/mcp` (`get_compilation_issues`, `compile_route`) para comprobar que compila sin `next build`. **No está configurado** en `.opencode/opencode.json` (solo Playwright).
- `next dev` y `next build` usan directorios separados (`.next/dev` vs `.next`), así que pueden correr concurrentes; no borres `.next/dev/lock` a mano.

## quirks de Next 16 (verificados en `node_modules/next/dist/docs/`)

- **`middleware` → `proxy`.** No crees `middleware.ts`.
- **Request APIs solo async**: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`. Se quitó la compatibilidad sync.
- `LayoutProps<'/ruta'>`, `PageProps<'/ruta'>`, `RouteContext<'/ruta'>` son **globales**, sin import (ver `app/layout.tsx`). Los genera `next typegen`.
- `next lint` ya no existe; `next.config.ts` no admite la clave `eslint`.
- Turbopack es el bundler por defecto en dev y build (no pases `--turbopack`).
- Los slots de parallel routes exigen `default.js` explícito o el build falla.
- Cambios de `next/image`: `minimumCacheTTL`, `imageSizes` y `qualities` tienen defaults nuevos; `images.domains` está deprecado.

## Diseño: la referencia vive en `references/`

`references/pantallas/*.dc.html` son **exports de Penpot** (root `<x-dc>`, `helmet data-dc-atomics`) con `support.js` vendor. Son la fuente de verdad del diseño, junto a `references/screenshots/*.png`.

- Pantallas ya exportadas: `login`, `activar-cuenta`, `vincular-padre`, `index`, `feed`, `crear-publicacion`, `detalle-publicacion`, `ninos`, `perfil-nino`, `agregar-nino`, `foto`, `avisos`, `resumen-dia`, `mi-cuenta`, `familia-feed`, `familia-cuenta`.
- Tipografía del diseño: **Nunito** para cuerpo, **Fredoka** para títulos. Ya está migrado en `app/layout.tsx` vía `next/font/google` (sin Geist).
- **No edites ni borres** los `.dc.html` ni `support.js` (vendor). Son solo referencia.
- Estas referencias son de **Julio**, create-next-app es de **Octubre**. Solo `feed` está implementada (spec 01, route group `app/(daycare)/`); las otras 15 pantallas siguen pendientes, cada una con su propia spec.

## Base de datos (Supabase)

Cuando se manipula la base de datos en este proyecto, **SIEMPRE debe hacerse mediante migraciones**:

- **Usa MCP Supabase**: las migraciones se aplican al proyecto remoto con `apply_migration` (nombre descriptivo). No uses `execute_sql` para aplicar DDL estructural (crear/alterar tablas, columnas, RLS, políticas) salvo excepciones muy puntuales documentadas en el spec.
- **Espejo local**: cada migración aplicada también debe quedar reflejada en `supabase/migrations/NNN_slug.sql` (numerado consecutivo). Ese archivo debe contener el DDL + políticas + datos de seed si corresponden, tal como se aplicó en el remoto.
- **Nunca edites directamente** la base de datos para cambios estructurales sin generar una migración nueva.
- **Para cambios de datos** (no estructurales), usa `execute_sql` con cautela y documenta en el spec. Los cambios estructurales SIEMPRE son migraciones.
- **Consulta estado**: `supabase_list_migrations` para verificar el historial, `supabase_execute_sql` para inspeccionar estructura (information_schema, pg_policies, pg_class).
- **RLS y políticas**: siempre habilitar RLS cuando aplique, y documentar las políticas explícitamente. Usar placeholders (`true`/`false`) solo si están justificados en el spec.
- **Seguridad**: al finalizar cambios en DB, revisar `supabase_get_advisors` (security/performance) para detectar problemas. 

## Cliente Supabase en la app (@supabase/ssr)

Para interactuar con la base de datos desde la aplicación se usan los paquetes oficiales **`@supabase/supabase-js`** y **`@supabase/ssr`** (ya instalados con pnpm). No uses fetch directo a la REST API ni clientes custom: siempre el SDK de Supabase.

Helpers en `utils/supabase/`:

- **`utils/supabase/server.ts`** → `createClient(cookieStore)`: cliente para Server Components, Server Actions y Route Handlers. Recibe el `cookieStore` de `await cookies()`.
- **`utils/supabase/client.ts`** → `createClient()`: cliente para Client Components (browser).
- **`utils/supabase/proxy.ts`** → `updateSession(request)`: refresca el token de sesión con `supabase.auth.getClaims()` y propaga las cookies + headers de cache.

`proxy.ts` en la raíz del proyecto (convención de Next.js 16, reemplaza a `middleware.ts`) llama a `updateSession` con matcher que excluye assets estáticos.

Variables de entorno en `.env.local` (ya configuradas): `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Uso típico en un Server Component:

```tsx
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

const cookieStore = await cookies()
const supabase = createClient(cookieStore)
const { data } = await supabase.from('tabla').select()
```

Reglas:

- **Server Components / Actions**: importa de `@/utils/supabase/server`.
- **Client Components**: importa de `@/utils/supabase/client`.
- **Auth en server**: usa `supabase.auth.getClaims()` (verifica el JWT) o `supabase.auth.getUser()` (llamada de red). **Nunca** confíes en `getSession()` para autorización.
- RLS aplica a las queries del SDK igual que en el Data API: las políticas definen qué filas ve cada usuario autenticado.

## Flujo spec-driven

Skills del proyecto en `.agents/skills/` (instaladas desde `klerith/fernando-skills`, fijadas en `skills-lock.json`). Tienen `disable-model-invocation: true`: **no se cargan solas**, el usuario las invoca explícitamente como `/spec` y `/spec-impl`.

- `/spec` escribe `specs/NN-slug.md` con estado `Draft`. **Excepción**: cualquier spec relacionado con la base de datos (tablas, columnas, migraciones, RLS, políticas, seeds, etc.) se escribe en `specs/database/NN-slug.md`.
- `/spec-impl` exige estado **Approved**, crea la branch `spec-NN-slug` y va paso a pauso. `specs/.spec-config.yml` existe con `AutoCreateBranch: true`.
- `/verify-spec` delega en el subagente `spec-verifier`: verifica los acceptance criteria con Playwright + Context7, corrige lo que falle y marca los checks. Si todo queda en verde, pasa el estado del spec a `Implemented`.
- No escribas código sin spec cuando el usuario launch el flujo `/spec`.

## MCPs

- Playwright screenshots, y cualquier cosa relacionada a Playwright tiene que estar en la carpeta .playwright-mcp.

## Agents

### spec-verifier

Subagente (`mode: all`) que toma un spec de `specs/`, verifica **uno por uno** cada ítem de su sección de acceptance criteria, corrige lo que falle — tanto el código como el spec — y marca los checks con evidencia.

Definición: `.opencode/agents/spec-verifier.md`

- **Playwright + visión** para comparar las pantallas contra `references/pantallas/*.dc.html` y `references/screenshots/*.png`. No declara nada visual sin haber mirado la captura.
- **Context7 + `node_modules/next/dist/docs/`** para validar la API de Next.js antes de corregir criterio que toque el framework.
- Verifica por categorías: CLI/build (Bash), visual/interactivo (Playwright), Next.js/buenas prácticas (Context7).
- Al final: pasa el spec a `Implemented` si todo quedó en verde, y devuelve tabla criterio → categoría → estado → evidencia.
- **Nunca commitea, stasea ni hace push.** Deja el `git diff` y la decisión de commit es del usuario.

## Commands

### verify-spec

```
/verify-spec <NN-slug>
```

Verificación completa del spec: resuelve el archivo, clasifica sus acceptance criteria, levanta el dev server si hace falta, verifica uno por uno, corrige spec y código donde falle, marca los checks con `- [x]` y cierra con el reporte de evidencia. Delega en el agente `spec-verifier`.

Definición: `.opencode/commands/verify-spec.md`

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
- Tipografía del diseño: **Nunito** para cuerpo, **Fredoka** para títulos. `app/layout.tsx` todavía carga Geist de `create-next-app` — hay que migrarlo a Nunito/Fredoka.
- **No edites ni borres** los `.dc.html` ni `support.js` (vendor). Son solo referencia.
- Estas referencias son de **Julio**, create-next-app es de **Octubre**: el repo es un andamiaje limpio esperando a que se implemente el diseño.

## Flujo spec-driven

Skills del proyecto en `.agents/skills/` (instaladas desde `klerith/fernando-skills`, fijadas en `skills-lock.json`). Tienen `disable-model-invocation: true`: **no se cargan solas**, el usuario las invoca explícitamente como `/spec` y `/spec-impl`.

- `/spec` escribe `specs/NN-slug.md` con estado `Draft`. `specs/` todavía no existe.
- `/spec-impl` exige estado **Approved**, crea la branch `spec-NN-slug` y va paso a pauso. `specs/.spec-config.yml` (con `AutoCreateBranch`) aún no existe.
- No escribas código sin spec cuando el usuario launch el flujo `/spec`.

## MCPs

- **Playwright** — screenshots, console logs y snapshots van a `.playwright-mcp/` (ya está gitignored; los archivos sueltos en la raíz no).
- **Context7** — para traer documentación actualizada del framework cuando necesites API que no recuerdes.

## Idioma

El usuario escribe en español y las convenciones del repo están en español. Responde en el idioma del prompt; las skills de spec exige explícitamente eso.

## Reglas de código

- Usar código limpio, nombres funciones, variables, etc en inglés.

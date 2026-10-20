# Open Daycare

App de guardería construida con **Next.js 16.3.8** (App Router) + **React 19** + **TypeScript strict** + **Tailwind v4**, con backend en **Supabase** (Postgres + Auth + RLS) y `@supabase/ssr` para manejar sesiones entre server y browser.

## Requisitos

- **Node.js 20+**
- **pnpm** (gestor de paquetes obligatorio): `corepack enable pnpm` o `npm i -g pnpm`
- **Supabase CLI** (opcional, para migraciones locales y `supabase login`): `npm i -g supabase` o usar `npx supabase`
- **opencode** (opcional, para el flujo spec-driven del repo)

> ⚠️ No uses `npm install`: el único lockfile válido es `pnpm-lock.yaml` (el `package-lock.json` de `create-next-app` fue eliminado y está en `.gitignore`).

## 1. Instalación

```bash
pnpm install
```

## 2. Variables de entorno

Copia la plantilla y rellena los valores desde el [dashboard de Supabase](https://supabase.com/dashboard) y [Resend](https://resend.com):

```bash
cp .env.template .env.local
```

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project_ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
RESEND_API_KEY=re_...
SUPABASE_DB_PASSWAORD=...
```

Todos los `.env*` están en `.gitignore` (solo se versiona `.env.template`).

## 3. Levantar el proyecto

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000). La app se recarga sola al editar archivos en `app/`.

Otros comandos:

```bash
pnpm build              # build de producción (incluye TypeScript, NO lint)
pnpm start              # sirve el build ya compilado
pnpm exec tsc --noEmit   # typecheck aislado
pnpm exec eslint app     # lint real del código (ver nota abajo)
pnpm exec next typegen   # regenera tipos de ruta si están stale
```

**Nota sobre `pnpm lint`**: el script `lint` (`eslint` sin args) escanea todo el repo y falla por errores en `references/pantallas/support.js` (código vendor de Penpot, no nuestro). El gate real es `pnpm exec eslint app`.

### Verificación en runtime

- `next dev` reenvía errores y warnings de la consola del browser a la terminal (`logging.browserToTerminal`): léelos ahí, no hace falta DevTools.
- El PID/puerto/URL del dev server están en `.next/dev/lock`. Un segundo `next dev` en el mismo proyecto imprime la URL y el PID a matar en vez de arrancar otro.
- El dev server expone un MCP en `/_next/mcp` (`get_compilation_issues`, `compile_route`) para comprobar que compila sin `next build`; no está configurado en `.opencode/opencode.json`.

## 4. Autenticar el MCP de Supabase (opencode)

Para que opencode pueda consultar y migrar la base de datos hay que validar el MCP. El servidor remoto ya está configurado en `.opencode/opencode.json` apuntando a un proyecto concreto:

```json
"supabase": {
  "type": "remote",
  "url": "https://mcp.supabase.com/mcp?project_ref=<ref>&features=docs,account,database,debugging,development,functions,branching",
  "enabled": true
}
```

Cada miembro del equipo debe autenticarse **una vez en su máquina**:

```bash
opencode mcp auth supabase   # abre el navegador y completa el flujo OAuth
opencode mcp list            # valida el estado de auth de todos los MCPs
```

La autenticación es **OAuth con el navegador** (dynamic client registration): no necesitas personal access token (PAT) para esto. Al autorizar, **elige la organización que contiene el proyecto**. Los tokens quedan guardados en `~/.local/share/opencode/mcp-auth.json` (local a cada usuario; nunca se versionan).

Si no hay token, opencode detecta el 401 y lanza el flujo automáticamente al primer uso, pero conviene correr el comando antes de empezar a trabajar. Para renovar o limpiar credenciales:

```bash
opencode mcp auth supabase        # reautenticar / validar
opencode mcp logout supabase      # borrar credenciales guardadas
opencode mcp debug supabase       # diagnóstico de conexión y flujo OAuth
```

## Base de datos (Supabase)

Todo cambio estructural (tablas, columnas, RLS, políticas, seeds) se hace **mediante migraciones**, nunca editando la base a mano:

- Se aplican al proyecto remoto con el **MCP de Supabase** (`apply_migration`).
- Cada migración aplicada se refleja también en `supabase/migrations/NNN_slug.sql` (numerado consecutivo).
- Para cambios de datos (no estructurales) se usa `execute_sql` con cautela y se documenta en el spec.
- Al terminar, revisa `supabase_get_advisors` (security/performance).

### Autenticación del MCP de Supabase (opencode)

Si todavía no has validado el MCP, hazlo antes de tocar la base de datos (paso 4 de arriba): `opencode mcp auth supabase` y confirma con `opencode mcp list`.

### Autenticación con el CLI de Supabase (equipo y CI)

El **CLI de Supabase** es un sistema de credenciales **independiente** al del MCP: sirve para `supabase db push`, `supabase start`, `supabase migration` y demás comandos de Management API. Cada miembro del equipo se autentica con su propia cuenta:

```bash
npx supabase login
```

Esto abre el navegador y guarda el access token de forma segura en el keyring del sistema (o en `~/.supabase/access-token` si no hay keyring disponible). Verifica con:

```bash
npx supabase projects list
```

**Para tu equipo:**

1. Cada persona entra a https://supabase.com/dashboard/account/tokens y genera **su propio** personal access token (o simplemente usa `npx supabase login`, que hace el flujo en el navegador).
2. El token se guarda localmente en cada máquina — **nunca lo subas al repo** ni lo compartas por chat.
3. Asegúrate de que todos tengan acceso a la misma organización/proyecto en el dashboard de Supabase (Settings → Members).

**En CI / entornos sin navegador:** no se puede hacer el flujo interactivo, así que usa la variable de entorno `SUPABASE_ACCESS_TOKEN` (tiene prioridad sobre el keyring y el archivo):

```bash
SUPABASE_ACCESS_TOKEN=xxx npx supabase migration list
```

En GitHub Actions va como secret (`secrets.SUPABASE_ACCESS_TOKEN`). Idealmente usa un token con alcance (scope) limitado al proyecto.

Resumen de credenciales:

| Uso | Comando / variable | Dónde queda guardado |
| --- | --- | --- |
| MCP de Supabase (opencode) | `opencode mcp auth supabase` | `~/.local/share/opencode/mcp-auth.json` |
| CLI (proyecto local) | `npx supabase login` | keyring del sistema / `~/.supabase/access-token` |
| CLI en CI | `SUPABASE_ACCESS_TOKEN` | secret del runner |

## Flujo spec-driven

Los specs viven en `specs/` (`specs/database/NN-slug.md` para todo lo de BD) y se usan con skills de opencode:

- `/spec <feature>` — escribe el spec en estado `Draft`.
- `/spec-impl <NN-slug>` — exige estado `Approved`, crea la branch `spec-NN-slug` e implementa paso a paso.
- `/verify-spec <NN-slug>` — verifica los acceptance criteria con Playwright + visión y los marca.

## Estructura relevante

```
app/                  # App Router (rutas, páginas, server actions, componentes)
app/(daycare)/        # route group de la app autenticada (feed implementado)
utils/supabase/       # clientes server / client / proxy (@supabase/ssr)
supabase/migrations/  # espejo local de las migraciones aplicadas
references/pantallas/ # exports de Penpot: fuente de verdad del diseño (no editar)
specs/                # especificaciones del flujo spec-driven
proxy.ts              # Next 16: reemplaza a middleware.ts (refresh de sesión)
```

- Tipografía: **Nunito** (cuerpo) y **Fredoka** (títulos), cargadas con `next/font/google` en `app/layout.tsx`.
- Rutas alias: `@/*` → raíz del repo.

## Documentación

- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp)

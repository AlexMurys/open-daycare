# SPEC 07 — Tabla `daycares` y patrón de migraciones en Supabase

> **Status:** Implemented
> **Depends on:** Ninguna — primer spec de base de datos. Referencia: diccionario de datos `../07-DB-Schema/opendaycare-database-schema.md` (externo al repo).
> **Date:** 2026-10-14
> **Objective:** Crear la tabla raíz `daycares` (`id uuid`, `name`, `address` nullable, `created_at` y `updated_at`, RLS habilitado con políticas) en el proyecto Supabase vía migraciones con nombre aplicadas por MCP, con seed de 4 guarderías dentro de la migración y el DDL versionado como archivo local.

## Por qué existe esta spec

Los specs 01–06 construyeron la UI con mocks en memoria; el backend arranca ahora. `daycares` es la entidad raíz del modelo (todo cuelga de ella) y esta migración establece el patrón para las demás tablas: cambios de esquema como **migraciones con nombre** aplicadas al proyecto Supabase vía MCP (`apply_migration`), **espejo local numerado** en `supabase/migrations/` (`NNN_slug.sql`), y datos de demo dentro de la propia migración.

## Scope

**In:**

- Migración `create_daycares` (DDL) aplicada con `apply_migration` (MCP) al proyecto `fgkqezadaybebsmyfpjt`:
  - `public.daycares`: `id uuid primary key default gen_random_uuid()`, `name text not null`, `address text` (nullable), `created_at timestamptz not null default now()`.
  - `alter table public.daycares enable row level security;`
- Migración `daycares_updated_at_policies_and_seed` (MCP) que completa el esquema actual:
  - `updated_at timestamptz not null default now()`.
  - `address` pasa a nullable (`alter column address drop not null`).
  - 4 políticas RLS: `daycares_read` (SELECT `USING (true)`), `daycares_insert` (INSERT `WITH CHECK (false)`), `daycares_update` (UPDATE `USING (false)`), `daycares_delete` (DELETE `USING (false)`).
  - Seed de 4 guarderías dentro de la migración: "Guardería Sala Soles" (principal) + 3 de relleno.
- Archivo local espejo: `supabase/migrations/001_create_daycares_table.sql` con el DDL + políticas + seed.
- Verificación: estructura, RLS+políticas, advisors, filas sembradas.

**Out of scope (for future specs):**

- Integración con la app (cliente supabase-js, pantallas, env vars en código).
- Políticas RLS basadas en `users`/auth (las actuales son placeholders estáticos).
- Las demás 12 tablas del diccionario.
- CLI de Supabase y stack local (sin Docker).
- Limpieza del historial remoto (las 2 migraciones de prueba se quedan; efecto neto nulo).

## Data model

```sql
-- Migración 1: create_daycares (DDL, vía apply_migration)
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
```

```sql
-- Migración 2: daycares_updated_at_policies_and_seed (vía apply_migration)
alter table public.daycares add column if not exists updated_at timestamptz not null default now();
alter table public.daycares alter column address drop not null;

create policy "daycares_read" on public.daycares for select using (true);
create policy "daycares_insert" on public.daycares for insert with check (false);
create policy "daycares_update" on public.daycares for update using (false);
create policy "daycares_delete" on public.daycares for delete using (false);

delete from public.daycares;
insert into public.daycares (name, address) values
  ('Guardería Sala Soles', 'Av. Principal 123, Centro'),
  ('Guardería Arcoíris', 'Calle Los Naranjos 45, Norte'),
  ('Guardería Semillitas', 'Boulevard del Parque 890, Sur'),
  ('Guardería Estrellitas', 'Camino de la Colina 210, Oeste');
```

El mismo contenido vive en el archivo local `supabase/migrations/001_create_daycares_table.sql` (CREATE TABLE + RLS + políticas + seed). Este spec no toca `app/`.

## Implementation plan

1. **Aplicar migración 1** `create_daycares` con `apply_migration`. Manual: `supabase_list_migrations` muestra la entrada.
2. **Aplicar migración 2** `daycares_updated_at_policies_and_seed` con `apply_migration` (`updated_at`, `address` nullable, políticas, seed).
3. **Crear el archivo local** `supabase/migrations/001_create_daycares_table.sql` con el DDL + políticas + seed.
4. **Verificación**: estructura (5 columnas), `pg_class.relrowsecurity`, 4 políticas en `pg_policies`, advisors, `select` devuelve 4 filas, `git status` sin cambios en `app/`.

## Acceptance criteria

- [x] El historial de migraciones incluye `create_daycares` y `daycares_updated_at_policies_and_seed`.
- [x] `public.daycares` existe con exactamente 5 columnas: `id uuid NOT NULL DEFAULT gen_random_uuid()` (PK), `name text NOT NULL`, `address text NULL`, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`.
- [x] RLS habilitado en `daycares` con 4 políticas: `daycares_read` (SELECT `true`), `daycares_insert` (INSERT `false`), `daycares_update` (UPDATE `false`), `daycares_delete` (DELETE `false`).
- [x] El advisor de seguridad no reporta errores para `daycares`.
- [x] `select * from public.daycares` devuelve 4 filas; una es "Guardería Sala Soles".
- [x] Las 4 filas tienen `id`, `created_at` y `updated_at` generados por la DB, no nulos.
- [x] Existe el archivo local `supabase/migrations/001_create_daycares_table.sql` con el DDL + políticas + seed.
- [x] Ningún archivo de `app/` cambia.

## Decisions

- **Sí:** MCP `apply_migration` con nombre descriptivo como patrón de migraciones. _(decisión del usuario: "ya tenemos el MCP, no hará falta instalar nada")_ El historial vive en el proyecto Supabase.
- **Sí:** archivo local espejo numerado `supabase/migrations/NNN_slug.sql`. _(cambio de decisión del usuario: versionar el DDL en git)_
- **No:** CLI de Supabase ni Docker — el archivo local se mantiene a mano; si se quiere que la CLI lo gestione, se migra en otro spec.
- **Sí:** RLS habilitado **con** políticas: lectura pública (`SELECT true`) y escritura bloqueada (`INSERT`/`UPDATE`/`DELETE` en `false`) como placeholders hasta el spec de auth. _(decisión del usuario)_
- **Sí:** `address text` (nullable) y `updated_at timestamptz` — desvío deliberado del diccionario. _(decisión del usuario)_
- **Sí:** seed dentro de la migración (los datos de demo viajan con el DDL, no en una llamada `execute_sql` aparte). _(decisión del usuario)_
- **No:** actualizar el diccionario `07-DB-Schema` — los desvíos quedan registrados solo aquí. _(decisión del usuario)_
- **Sí:** PK `uuid v4` con `gen_random_uuid()` pese a la preferencia general por `identity`/UUIDv7: consistencia con la convención del doc y con `auth.users`; `daycares` es de bajísimo volumen.
- **Sí:** "Guardería Sala Soles" como principal — es el nombre que ya usa la app.
- **No:** limpiar las migraciones de prueba del historial remoto.

## Risks

| Riesgo                                                                                               | Mitigación                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `apply_migration` crea entrada de historial por llamada (no iterativo)                               | DDL trivial validado en el spec; si falla: `execute_sql` + `supabase migration repair`      |
| El archivo local `supabase/migrations/` no lo gestiona la CLI (orden `NNN_` no estándar) | Legible a mano; si se adopta la CLI, renombrar a `supabase/migrations/<timestamp>_slug.sql` |
| El seed dentro de la migración la hace no idempotente (re-ejecutar duplicaría filas)                 | La migración corre una sola vez; para re-seedear usar `execute_sql` con el mismo INSERT     |
| Políticas RLS placeholders demasiado abiertas (lectura pública)                                      | Se reemplazan por políticas basadas en `users`/auth en el spec correspondiente              |

## What is **not** in this spec

- Integración de la app con Supabase. Políticas RLS basadas en auth y resto de tablas del diccionario. CLI de Supabase / stack local.

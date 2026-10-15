# SPEC 08 — Tabla `users` con ENUMs, trigger de `auth.users` y seed de staff

> **Status:** Implementado
> **Depends on:** SPEC 07 (`specs/07-daycares-table.md`) — patrón de migraciones (MCP `apply_migration` + espejo local `supabase/migrations/`) y tabla `daycares` ya sembrada. Referencia: diccionario `../07-DB-Schema/opendaycare-database-schema.md` (externo al repo).
> **Date:** 2026-10-15
> **Objective:** Crear `public.users` (perfil de aplicación vinculado a `auth.users` vía trigger `AFTER INSERT`) con los ENUMs `user_role` y `user_status`, RLS habilitado con políticas placeholder y seed de un usuario staff de prueba, todo en una única migración con espejo local.

## Por qué existe esta spec

`daycares` ya existe (SPEC 07) y `users` es la tabla de la que cuelgan posts, comentarios, reacciones e invitaciones. Es la primera que cruza al schema `auth`: el diccionario prescribe que la fila de perfil se cree con un trigger `AFTER INSERT` sobre `auth.users` leyendo `raw_user_meta_data`, sin duplicar email/password. El seed de un staff real en `auth.users` desbloquea probar login y futuros specs con autores reales.

## Scope

**In:**

- Única migración `create_users_and_staff_seed` aplicada con `apply_migration` (MCP) al proyecto `fgkqezadaybebsmyfpjt`, con todo el DDL y el seed:
  - ENUMs: `public.user_role` (`staff`, `parent`, `admin`) y `public.user_status` (`pending`, `active`).
  - `public.users`: `id uuid PK` FK → `auth.users(id)` `ON DELETE CASCADE`, `daycare_id uuid NOT NULL` FK → `public.daycares(id)`, `role user_role NOT NULL`, `status user_status NOT NULL DEFAULT 'active'`, `full_name text NOT NULL`, `avatar_url text` (nullable), `notify_on_post boolean NOT NULL DEFAULT true`, `daily_summary_enabled boolean NOT NULL DEFAULT true`, `created_at`/`updated_at timestamptz NOT NULL DEFAULT now()`.
  - `alter table public.users enable row level security;`
  - 4 políticas placeholder (patrón SPEC 07): `users_read` (SELECT `true`), `users_insert` (INSERT `false`), `users_update` (UPDATE `false`), `users_delete` (DELETE `false`).
  - Función `public.handle_new_user()` (`plpgsql`, `SECURITY DEFINER`, `set search_path = ''`) que inserta en `public.users` leyendo `daycare_id` (cast a uuid), `role` (coalesce `'parent'`) y `full_name` (coalesce `''`) de `new.raw_user_meta_data`.
  - Trigger `on_auth_user_created` `AFTER INSERT ON auth.users FOR EACH ROW`.
  - Seed dentro de la migración: 1 usuario staff en `auth.users` (`staff@google.com` / `staff123@` con `crypt`+`gen_salt`, `email_confirmed_at` para login directo, `raw_user_meta_data` con `daycare_id` de "Guardería Sala Soles", `role: 'staff'`, `full_name: 'test'`); el trigger crea la fila de `public.users`.
- Segunda migración `users_revoke_execute_and_index_fk` (derivada de la verificación): `revoke execute on function public.handle_new_user() from public, anon, authenticated` e índice `users_daycare_id_idx` sobre la FK `daycare_id`.
- Archivos locales espejo: `supabase/migrations/002_create_users_table.sql` (DDL + seed) y `supabase/migrations/003_users_revoke_execute_and_index_fk.sql`.
- Verificación: historial, estructura, ENUMs, políticas, trigger, filas vinculadas, smoke test de login vía `POST /auth/v1/token`, advisors, `git status`.

**Out of scope (for future specs):**

- Integración con la app: login real en pantallas, cliente supabase-js, env vars (spec de auth/login).
- Políticas RLS basadas en auth (los placeholders se reemplazan en el spec de auth).
- Los otros 4 ENUMs del diccionario (`relationship_type`, `invitation_status`, `post_type`, `child_status`) y las demás 11 tablas.
- Seed de usuarios `parent`/`admin`.
- Trigger de `updated_at` automático (`moddatetime`).
- CLI de Supabase y stack local.

## Data model

```sql
-- Migración única: create_users_and_staff_seed (vía apply_migration)
create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  daycare_id uuid not null references public.daycares(id),
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users_read"   on public.users for select using (true);
create policy "users_insert" on public.users for insert with check (false);
create policy "users_update" on public.users for update using (false);
create policy "users_delete" on public.users for delete using (false);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data->>'daycare_id')::uuid,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed: usuario staff de prueba (el trigger crea la fila de public.users).
-- Requiere aud/role/instance_id, timestamps no nulos y fila en auth.identities.
with new_user as (
  insert into auth.users (id, email, encrypted_password, email_confirmed_at,
                          aud, role, instance_id,
                          raw_app_meta_data, raw_user_meta_data,
                          confirmation_token, recovery_token,
                          email_change_token_new, email_change,
                          reauthentication_token, created_at, updated_at)
  values (
    gen_random_uuid(),
    'staff@google.com',
    crypt('staff123@', gen_salt('bf')),
    now(),
    'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object(
      'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles'),
      'role', 'staff',
      'full_name', 'test'
    ),
    '', '', '', '', '',
    now(), now()
  )
  returning id, email
)
insert into auth.identities (provider_id, user_id, identity_data, provider,
                             last_sign_in_at, created_at, updated_at)
select
  id::text,
  id,
  jsonb_build_object('sub', id::text, 'email', email,
                     'email_verified', true, 'phone_verified', false),
  'email',
  now(), now(), now()
from new_user;
```

El mismo contenido vive en `supabase/migrations/002_create_users_table.sql`. Segunda migración aplicada (`users_revoke_execute_and_index_fk`) por hallazgos de advisors — espejo en `supabase/migrations/003_users_revoke_execute_and_index_fk.sql`:

```sql
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create index users_daycare_id_idx on public.users (daycare_id);
```

Notas:

- El insert en `auth.users` se completó tras la primera aplicación del smoke test: GoTrue exige `aud='authenticated'`, `role='authenticated'`, `instance_id='00000000-0000-0000-0000-000000000000'`, `created_at`/`updated_at` no nulos y tokens en `''`. El fix se aplicó con `execute_sql` sobre la fila sembrada y quedó reflejado tal cual en el espejo local (el DDL/seed del espejo es el estado final que hace pasar el login).
- **`auth.identities`**: la fila de identidad (`provider='email'`, `provider_id = id::text`, `identity_data` con `sub`/`email`/`email_verified`/`phone_verified`) es obligatoria; sin ella el login por password devuelve `invalid_credentials`. La columna `email` de esa tabla es generada; no se inserta.
- `search_path = ''` obliga a calificar todos los objetos (`public.users`, `public.user_role`).
- El `revoke execute` y el índice `users_daycare_id_idx` cierran los advisors nuevos de seguridad (`SECURITY DEFINER` llamable por `anon`/`authenticated`) y performance (FK sin índice) detectados en la verificación.

Este spec no toca `app/`.

## Implementation plan

1. **Aplicar la migración única** `create_users_and_staff_seed` con `apply_migration`. Antes del insert en `auth.users`, inspeccionar `information_schema.columns` de `auth` y completar columnas NOT NULL sin default si la versión lo exige. Manual: `supabase_list_migrations` muestra la entrada; `select id, email from auth.users` devuelve 1 fila y `select * from public.users` devuelve la fila staff creada por el trigger.
2. **Crear el espejo local** `supabase/migrations/002_create_users_table.sql` con el DDL exacto aplicado.
3. **Smoke test de login**: `POST {SUPABASE_URL}/auth/v1/token?grant_type=password` con `staff@google.com` / `staff123@` y la publishable key → devuelve `access_token`.
4. **Verificación final**: 10 columnas en `public.users`, ENUMs con sus valores exactos, RLS + 4 políticas en `pg_policies`, trigger `on_auth_user_created` registrado, filas vinculadas (mismo `id`, `role='staff'`, `status='active'`, `daycare_id` de "Guardería Sala Soles"), advisors (security/performance), `git status` sin cambios en `app/`.

## Acceptance criteria

- [x] El historial de migraciones incluye `create_users_and_staff_seed` como 5ª entrada.
- [x] `public.user_role` existe con exactamente `staff`, `parent`, `admin` y `public.user_status` con `pending`, `active`.
- [x] `public.users` existe con exactamente 10 columnas: `id` (PK, FK→`auth.users` `ON DELETE CASCADE`), `daycare_id` (NOT NULL, FK→`daycares`), `role user_role NOT NULL` (sin default), `status user_status NOT NULL DEFAULT 'active'`, `full_name text NOT NULL`, `avatar_url text NULL`, `notify_on_post boolean NOT NULL DEFAULT true`, `daily_summary_enabled boolean NOT NULL DEFAULT true`, `created_at`/`updated_at timestamptz NOT NULL DEFAULT now()`.
- [x] RLS habilitado en `users` con 4 políticas: `users_read` (SELECT `true`), `users_insert`/`users_update`/`users_delete` (`false`).
- [x] `public.handle_new_user()` existe (plpgsql, SECURITY DEFINER, `search_path ''`) y el trigger `on_auth_user_created` está registrado `AFTER INSERT` en `auth.users`.
- [x] `auth.users` tiene 1 fila (`staff@google.com`, `email_confirmed_at` no nulo) y `public.users` exactamente 1 fila vinculada: mismo `id`, `full_name='test'`, `role='staff'`, `status='active'`, `daycare_id` = id de "Guardería Sala Soles", `notify_on_post` y `daily_summary_enabled` en `true`, timestamps no nulos.
- [x] El smoke test de login con `staff@google.com` / `staff123@` devuelve `access_token`.
- [x] Los advisors de seguridad y performance no reportan errores nuevos por `users`.
- [x] Existe `supabase/migrations/002_create_users_table.sql` con el DDL + seed tal como se aplicó.
- [x] Ningún archivo de `app/` cambia.

## Decisions

- **Sí:** solo los ENUMs de `users` (`user_role`, `user_status`); los otros 4 llegan con sus tablas. _(decisión del usuario)_
- **Sí:** trigger `AFTER INSERT` sobre `auth.users` incluido en este spec. _(decisión del usuario — patrón del diccionario y docs de Supabase)_
- **Sí:** seed vía insert SQL directo en `auth.users` (`crypt`/`gen_salt` + `raw_user_meta_data`), scriptable vía MCP y versionado. _(decisión del usuario)_
- **Sí:** completar el seed con `aud`/`role`/`instance_id`, timestamps y tokens en `''`, más una fila en `auth.identities` (`provider='email'`) — sin ellos GoTrue rechaza el login (`invalid_credentials`/`unexpected_failure`). Aplicado como fix de datos vía `execute_sql` y reflejado en el espejo local. _(hallazgo durante el smoke test)_
- **Sí:** `daycare_id` NOT NULL — todo usuario pertenece a una guardería; `admin` se lee como admin de la guardería, no super-admin de plataforma. _(decisión del usuario)_
- **Sí:** credenciales demo `test` / `staff@google.com` / `staff123@`. _(decisión del usuario; usuario de prueba desechable)_
- **Sí:** RLS placeholder igual que SPEC 07 (lectura pública, escritura bloqueada) hasta el spec de auth. _(decisión del usuario; el trigger bypassa RLS por SECURITY DEFINER)_
- **Sí:** una única migración `create_users_and_staff_seed` con DDL + seed. _(decisión del usuario)_
- **Sí:** `set search_path = ''` en `handle_new_user()` — mejor práctica Supabase para funciones SECURITY DEFINER.
- **Sí:** `revoke execute` sobre `handle_new_user()` para `public, anon, authenticated` e índice `users_daycare_id_idx` sobre `daycare_id` (migración `users_revoke_execute_and_index_fk`), cerrando los advisors nuevos de seguridad y performance. _(hallazgo durante la verificación)_
- **Sí (aceptado):** el índice `users_daycare_id_idx` reporta `unused_index` (INFO) por ser nuevo y no haberse ejercitado aún; es el trade-off frente al lint de FK sin índice (`unindexed_foreign_keys`). Se mantiene porque la cobertura de la FK es la recomendación de Supabase. _(hallazgo durante la verificación)_
- **Sí:** el trigger coalescea `role`→`'parent'` y `full_name`→`''`; `daycare_id` sin coalesce (signup sin metadata falla explícito por NOT NULL).
- **Sí:** FK `daycare_id` sin cláusula ON DELETE (NO ACTION): borrar una guardería con usuarios queda bloqueado.
- **No:** default de `role` en la DB — el trigger ya coalescea a `'parent'`.
- **No:** trigger `moddatetime` para `updated_at` — consistente con SPEC 07 (`updated_at` solo con default).
- **No:** seeds `parent`/`admin` — van llegando con los specs que los necesiten.

## Risks

| Riesgo                                                                                                    | Mitigación                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Insertar en `auth.users` vía SQL toca un schema interno cuyas columnas varían entre versiones de Supabase | Insert mínimo; inspeccionar `information_schema.columns` de `auth` antes y completar NOT NULL sin default; smoke test de login valida el resultado |
| El trigger rompe signups futuros sin `daycare_id` en metadata (`daycare_id` NOT NULL)                     | Aceptado para demo; los flows reales de signup siempre envían `daycare_id` en `raw_user_meta_data` (specs de auth/vinculación)                     |
| `users_read` (SELECT `true`) expone perfiles a anónimos                                                   | Placeholder como en SPEC 07; se cierra en el spec de auth                                                                                          |
| Password de demo en texto plano en migración y spec                                                       | Proyecto de demo; credencial desechable, no reutilizable en producción                                                                             |
| `apply_migration` no es iterativo (una entrada por llamada)                                               | DDL validado en el spec; si falla a mitad: `execute_sql` puntual + `supabase migration repair`                                                     |

## What is **not** in this spec

- Integración de la app con Supabase (login real, cliente supabase-js, env vars) — specs de auth.
- Políticas RLS basadas en auth; los otros 4 ENUMs y las demás 11 tablas del diccionario.
- Seeds `parent`/`admin`; CLI de Supabase / stack local.

# SPEC 10 — Tablas `rooms` y `children` + "Agregar niño" persistente

> **Status:** Implemented
> **Depends on:** SPEC 04 (`specs/04-add-kid-dialog.md` — dialog a conectar), SPEC 08 (`specs/database/08-users-table.md` — patrón de migraciones, `users` + seed staff), SPEC 09 (`specs/09-auth-email-password-and-route-protection.md` — login real y protección de rutas). Referencia: diccionario `../07-DB-Schema/opendaycare-database-schema.md` (externo al repo).
> **Date:** 2026-10-16
> **Objective:** Crear las tablas `rooms` y `children` (ENUM `child_status`, RLS auth-based, seed de 3 salas) y conectar el dialog "Agregar niño" para que Guardar persista vía server action y `/kids` muestre los niños reales de la DB.

## Por qué existe esta spec

SPEC 04 dejó el alta de niño en memoria (se pierde al refrescar) y SPEC 09 aplazó el RLS auth-based "hasta el primer spec que lea datos reales de la DB" — este es ese spec. El diccionario define `rooms` (#3) y `children` (#4) como prerrequisitos del alta. `parent_children` (#5) no existe aún, por lo que los padres de la grilla vienen vacíos y el perfil de niño se queda en mock hasta su propio spec.

## Scope

**In:**

- Migración `create_rooms_children` con `apply_migration` (MCP) al proyecto `fgkqezadaybebsmyfpjt`:
  - `public.rooms`: `id uuid PK default gen_random_uuid()`, `daycare_id uuid NOT NULL` FK→`daycares`, `name text NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()` — **sin `updated_at`** (fiel al diccionario).
  - ENUM `public.child_status` (`active`, `archived`) — llega con `children` (patrón SPEC 08).
  - `public.children`: `id uuid PK`, `room_id uuid NOT NULL` FK→`rooms`, `full_name text NOT NULL`, `birth_date date NOT NULL`, `enrolled_at date NOT NULL DEFAULT current_date` (desvío menor: la DB la llena, el dialog no la pide), `medical_notes text` (nullable), `allergy_tags text[] NOT NULL DEFAULT '{}'` (texto libre tal cual se tipea), `photo_consent boolean NOT NULL DEFAULT true`, `status child_status NOT NULL DEFAULT 'active'`, `created_at`/`updated_at timestamptz NOT NULL DEFAULT now()`.
  - RLS habilitado en ambas + políticas **auth-based**: `rooms_read` (SELECT `to authenticated`), `rooms_insert/update/delete` (`false` placeholder); `children_read` (SELECT `to authenticated`), `children_insert` (INSERT `to authenticated` con check: `staff` de la guardería dueña de la sala), `children_update/delete` (`false` placeholder).
  - Índices `rooms_daycare_id_idx` y `children_room_id_idx` (FKs cubiertas — preemptiva a los advisors, patrón 003).
  - Seed: Soles, Lunas, Estrellas en "Guardería Sala Soles". **Sin seed de children** (decisión del usuario).
- Espejo local `supabase/migrations/004_rooms_children_tables.sql` con el DDL + políticas + índices + seed tal como se aplicó.
- Server action `app/actions/kids.ts` (`'use server'`): `addChild(input)` con `createClient` de `@/utils/supabase/server`; inserta `full_name`, `room_id`, `birth_date` (ISO), `allergy_tags`, `medical_notes`; con éxito `revalidatePath("/kids")` y devuelve la fila mapeada a `Kid`; con error devuelve `{ error: "No se pudo guardar el niño." }`.
- `/kids` lee datos reales: `app/(daycare)/kids/page.tsx` pasa a `async`, consulta `rooms` (id, name) y `children` (join con `rooms` para el nombre de sala) y pasa `initialKids` + `rooms` a `KidsScreen`.
- Mapping compartido row→`Kid` en `app/components/kids/childMapping.ts`: `initial`, `age` y `birthDate` display ("12 mar 2022") derivadas de la fecha ISO, `room` = nombre de la sala, `allergyLabel` = primer tag en mayúsculas, `allergyNotes` = `medical_notes`, `parents: []` (`parent_children` no existe), `avatarColor` = hash determinista del uuid sobre las 6 paletas existentes.
- Dialog conectado: `AddKidDialog` recibe `rooms` por props (`{id, name}[]`, default la primera = Soles) — se elimina `app/_data/rooms.ts`; Guardar mantiene la validación client de SPEC 04 y llama `onSave` → `addChild`; con éxito cierra y la tarjeta se agrega a la grilla; con error muestra el mensaje inline y no cierra.
- `KidsScreen`: `handleAddKid` pasa a async (acción + append del `Kid` devuelto); contador dinámico; divisor "SALA SOLES" queda literal (SPEC 04).
- Grilla con 0 niños: divisor "SALA SOLES · 0 niños" y sin cards; al guardar aparece la tarjeta y sobrevive al refresco.

**Out of scope (for future specs):**

- Seed de children (la grilla se llena con el dialog).
- Perfil `/kids/[id]` con datos reales: se queda mock (`app/_data/kids.ts` se mantiene); las tarjetas linkean a `/kids/{uuid}` que responde 404 hasta el spec de perfil (aceptado ya en SPEC 04).
- `parent_children` (#5) y vincular padres → grilla con `parents: []` (chips "VINCULAR" coherentes con el flujo pendiente).
- Editar/archivar niños (UPDATE/DELETE en `false`); CRUD de salas; catálogo inglés de alergias con traducción; agrupar `/kids` por sala.
- Políticas de `daycares`/`users` (placeholders intactos — la app no lee `public.users`).
- Resto de tablas del diccionario; CLI de Supabase.

## Data model

```sql
-- Migración: create_rooms_children (vía apply_migration)
create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null default current_date,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;
alter table public.children enable row level security;

create policy "rooms_read"   on public.rooms   for select to authenticated using (true);
create policy "rooms_insert" on public.rooms   for insert with check (false);
create policy "rooms_update" on public.rooms   for update using (false);
create policy "rooms_delete" on public.rooms   for delete using (false);

create policy "children_read"   on public.children for select to authenticated using (true);
create policy "children_insert" on public.children for insert to authenticated with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role = 'staff'
      and u.daycare_id = (select r.daycare_id from public.rooms r where r.id = room_id)
  )
);
create policy "children_update" on public.children for update using (false);
create policy "children_delete" on public.children for delete using (false);

create index rooms_daycare_id_idx on public.rooms (daycare_id);
create index children_room_id_idx on public.children (room_id);

insert into public.rooms (daycare_id, name)
select d.id, v.name
from public.daycares d
cross join (values ('Soles'), ('Lunas'), ('Estrellas')) as v(name)
where d.name = 'Guardería Sala Soles';
```

```ts
// app/actions/kids.ts — entrada/salida de la server action
export interface ChildInput {
  fullName: string; // trim del nombre del dialog
  birthDate: string; // ISO "YYYY-MM-DD" (convertida del dd/mm/aaaa)
  roomId: string; // uuid de rooms (del selector SALA)
  allergyTags: string[]; // chips tal cual ("Maní")
  medicalNotes: string; // notas médicas (opcional)
}
export interface AddChildResult {
  error: string | null;
  kid: Kid | null; // fila insertada mapeada (append inmediato)
}
```

```ts
// app/components/kids/childMapping.ts — view model de la grilla
export interface RoomOption {
  id: string;
  name: string;
}
// mapChildRow(row, roomName) → Kid:
//   initial: primera letra del nombre; age/birthDate/enrolledSince: derivadas de fechas ISO;
//   allergyLabel: allergy_tags[0]?.toUpperCase(); allergyNotes: medical_notes;
//   parents: [] (parent_children no existe); avatarColor: hash(uuid) % 6 sobre AVATAR_ORDER
```

El mismo SQL vive en `supabase/migrations/004_rooms_children_tables.sql`. `NewKidInput` (dialog) se mantiene; la conversión dd/mm/aaaa → ISO ocurre antes de llamar la acción.

## Estructura de archivos

```
app/
  actions/
    kids.ts                        # NUEVO ('use server'): addChild(input) → AddChildResult
  _data/
    rooms.ts                       # ELIMINADO (mock muerto; salas desde DB)
    kids.ts                        # intacto (lo sigue usando el perfil mock /kids/[id])
  components/kids/
    childMapping.ts                # NUEVO: RoomOption + mapChildRow + helpers de fechas
    KidsScreen.tsx                 # handleAddKid async → addChild + append; recibe rooms
    AddKidButton.tsx               # reenvía rooms al dialog
    AddKidDialog.tsx               # rooms por props (default primera = Soles); onSave async + error inline
  (daycare)/
    kids/page.tsx                  # async: consulta rooms + children → <KidsScreen initialKids rooms />
supabase/migrations/
  004_rooms_children_tables.sql    # NUEVO espejo: DDL + políticas + índices + seed
```

## Implementation plan

1. **Aplicar migración** `create_rooms_children` con `apply_migration`. Manual: `supabase_list_migrations` (7ª entrada); `select` de rooms devuelve 3 filas en Sala Soles; `children` vacía.
2. **Espejo local** `supabase/migrations/004_rooms_children_tables.sql` con el SQL exacto aplicado.
3. **`childMapping.ts`**: `RoomOption`, `mapChildRow`, helpers de fechas (reutiliza `ES_MONTHS`/`AVATAR_ORDER` que hoy viven en `KidsScreen`). Manual: `pnpm exec tsc --noEmit`.
4. **`app/actions/kids.ts`**: `addChild` con validación básica (nombre no vacío, fecha ISO real, `roomId` existente en `rooms`) + insert + `revalidatePath("/kids")`. Manual: `tsc`.
5. **`page.tsx` async + wiring**: queries server-side; `KidsScreen`/`AddKidButton`/`AddKidDialog` con `rooms` por props; eliminar `app/_data/rooms.ts`. Manual: login staff → `/kids` con divisor "0 niños" y selector SALA con las 3 salas desde la DB.
6. **Persistencia end-to-end**: Guardar con datos válidos → tarjeta nueva + contador; refresco sobrevive; verificación negativa de RLS (`set local role anon` + insert debe fallar, o inspección del check en `pg_policies`).
7. **Verificación final** (patrón specs anteriores): `pnpm exec eslint app`, `tsc --noEmit`, `pnpm build`; dev server relanzado limpio (PID de `.next/dev/lock`); matriz de runtime; `supabase_get_advisors` (security/performance); `git status` (solo los archivos del spec).

## Acceptance criteria

- [x] El historial incluye `create_rooms_children` como 7ª entrada.
- [x] `public.rooms` existe con exactamente 4 columnas (`id` PK, `daycare_id` NOT NULL FK→`daycares`, `name` NOT NULL, `created_at`) — sin `updated_at`; índice `rooms_daycare_id_idx`.
- [x] `public.child_status` existe con exactamente `active`, `archived`.
- [x] `public.children` existe con exactamente 11 columnas: `id` PK, `room_id` NOT NULL FK→`rooms`, `full_name` NOT NULL, `birth_date date` NOT NULL, `enrolled_at date` NOT NULL DEFAULT `current_date`, `medical_notes text` NULL, `allergy_tags text[]` NOT NULL DEFAULT `'{}'`, `photo_consent boolean` NOT NULL DEFAULT `true`, `status child_status` NOT NULL DEFAULT `'active'`, `created_at` NOT NULL DEFAULT `now()`, `updated_at` NOT NULL DEFAULT `now()`; índice `children_room_id_idx`.
- [x] RLS habilitado en ambas tablas con 8 políticas: `rooms_read`/`children_read` (SELECT `to authenticated`), `children_insert` (INSERT `to authenticated` con check staff + guardería dueña de la sala), resto (`false`).
- [x] Seed: exactamente 3 rooms en "Guardería Sala Soles" (Soles, Lunas, Estrellas); `children` sin filas.
- [x] Existe `supabase/migrations/004_rooms_children_tables.sql` con el DDL aplicado.
- [x] Advisors de security/performance no reportan errores nuevos por `rooms`/`children`.
- [x] `app/_data/rooms.ts` eliminado; el selector SALA muestra las 3 salas desde la DB arrancando en Soles.
- [x] `/kids` con sesión staff muestra la grilla vacía: divisor "SALA SOLES" con "0 niños" y sin cards.
- [x] Guardar con todo válido persiste: tarjeta nueva visible con contador 1, y al refrescar el niño sigue (fila en DB con `enrolled_at` = hoy, `photo_consent` = true, `status` = `active`).
- [x] Guardar con nombre vacío o fecha inválida muestra los errores en línea de SPEC 04 y no llama la acción.
- [x] Un error de la acción muestra el mensaje inline en el dialog y no cierra.
- [x] La tarjeta nueva linkea a `/kids/{uuid}` (404 hasta el spec de perfil — aceptado).
- [x] `avatarColor` del niño nuevo es determinista (mismo uuid → mismo color, dentro de las 6 paletas).
- [x] Insert anónimo/parent sobre `children` falla por RLS (verificación negativa).
- [x] Sin sesión, `/kids` sigue redirigiendo a `/login` (SPEC 09 intacto).
- [x] `pnpm exec eslint app`, `pnpm exec tsc --noEmit` y `pnpm build` terminan limpios; runtime sin errores/warnings en la terminal.
- [x] Las pantallas previas (feed, login, dialogs, perfil mock) funcionan igual.

## Decisions

- **Sí:** spec híbrido único (tablas + integración) en `specs/database/` — _(decisión del usuario, contra la recomendación de dividir en dos specs)_.
- **Sí:** RLS auth-based desde ya — cierra lo que SPEC 09 aplazó "al primer spec con datos reales" y evita una migración extra de políticas. _(decisión del usuario)_
- **Sí:** seed de rooms Soles/Lunas/Estrellas y **sin seed de children**. _(decisión del usuario — la grilla nace vacía)_
- **Sí:** `allergy_tags` con texto libre tal cual se tipea; descartado el catálogo inglés + traducción del diccionario (cambiaría el UX de chips de SPEC 04). _(decisión del usuario — desvío registrado)_
- **Sí:** `enrolled_at date NOT NULL DEFAULT current_date` — la DB la llena al insertar. _(decisión del usuario — desvío menor del diccionario)_
- **Sí:** rooms sin `updated_at` (fiel al diccionario). _(decisión del usuario)_
- **Sí:** `avatarColor` derivado del uuid (hash % 6) — `children` no tiene columna de color. _(decisión del usuario)_
- **Sí:** selector SALA desde la DB; se elimina `app/_data/rooms.ts`. _(decisión del usuario)_
- **Sí:** ENUM `child_status` llega con `children` (patrón SPEC 08: cada tabla trae sus enums).
- **Sí:** índices de FK en la misma migración (preemptivos a los advisors).
- **Sí:** append local del `Kid` devuelto + `revalidatePath("/kids")` — feedback inmediato y verdad del server en la próxima carga (`useState` no se resetea con props nuevas).
- **Sí:** `parents: []` en la grilla (chips "VINCULAR" coherentes con el vínculo pendiente).
- **Sí:** perfil `/kids/[id]` queda mock (`kids.ts` se mantiene); 404 para uuids.
- **No:** seed de children, catálogo inglés de alergias, agrupar por sala, editar/archivar niños, tocar placeholders de `daycares`/`users`, capturar `enrolled_at` en el dialog.

## Risks

| Riesgo                                                                                    | Mitigación                                                                                     |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `children_insert` lee `public.users` dentro del check (placeholder `true` hoy lo permite) | Cuando un spec futuro cierre `users_read`, revaluar el check de la política (nota en ese spec) |
| Edades/fechas derivadas server-side vs TZ del cliente pueden diferir ±1 día               | Cómputo date-only (sin horas); aceptable en demo                                               |
| Tras `revalidatePath`, la navegación client-side no remonta `KidsScreen`                  | Append local cubre la sesión; recarga total siempre muestra la verdad del server               |
| Grilla vacía al integrar (sin seed)                                                       | Esperado por decisión del usuario; el divisor muestra "0 niños"                                |
| `apply_migration` no es iterativo                                                         | DDL validado en el spec; fallo a mitad → `execute_sql` puntual + `supabase migration repair`   |
| Divisor "SALA SOLES" literal con niños en otras salas                                     | Aceptado en SPEC 04 hasta el spec de agrupación                                                |

## What is **not** in this spec

- Seed de children; perfil de niño con datos reales; `parent_children` y vincular padres.
- Editar/archivar niños; CRUD de salas; catálogo inglés de alergias; agrupar `/kids` por sala.
- Resto de tablas del diccionario; políticas de `daycares`/`users`.

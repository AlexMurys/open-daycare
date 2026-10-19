# SPEC 11 — Invitaciones de padres por correo (Resend) y activación de cuenta con vínculo

> **Status:** Approved
> **Depends on:** SPEC 05 (`specs/05-link-parent-dialog.md` — dialog a conectar), SPEC 08 (`specs/database/08-users-table.md` — `users` + trigger `handle_new_user` a endurecer), SPEC 09 (`specs/09-auth-email-password-and-route-protection.md` — `/activate-account` pública inerte y patrón de server actions), SPEC 10 (`specs/database/10-rooms-children-and-add-kid.md` — `children`/`rooms` reales y perfil `/kids/[id]` ya leyendo la DB). Referencia: diccionario `../07-DB-Schema/opendaycare-database-schema.md` (externo al repo).
> **Date:** 2026-10-19
> **Objective:** Implementar el vínculo real padre↔niño: el dialog "Vincular padre" persiste una invitación con código único y la envía por correo con Resend, y `/activate-account` registra al padre con ese código (signup restringido a invitación) creando la fila en `parent_children`.

## Por qué existe esta spec

SPEC 05 dejó el dialog con código estático "7K4P9" y alta en memoria, SPEC 09 dejó `/activate-account` inerte, y SPEC 10 dejó `parents: []` porque `parent_children` no existe. El perfil `/kids/[id]` ya lee el niño real de la DB (resuelto fuera de los specs en un one-shot), así que este spec cierra el circuito completo: tablas `invitations` (#6) y `parent_children` (#5) con sus ENUMs, el correo real vía `resend`, y el registro del padre con el código. Además, al abrirse el signup real el trigger `handle_new_user` de SPEC 08 queda expuesto (confía en el `role` del metadata), y este spec lo endurece.

## Scope

**In:**

- Migración `invitations_parent_children_and_rpcs` vía `apply_migration` al proyecto `fgkqezadaybebsmyfpjt`:
  - ENUMs `public.relationship_type` (`father`, `mother`, `guardian`) y `public.invitation_status` (`pending`, `accepted`, `expired`, `cancelled`).
  - `public.invitations` fiel al diccionario #6 (11 columnas): `id`, `child_id` FK→`children`, `invited_by` FK→`users`, `full_name`, `email` (guardado normalizado `lower(trim(...))`), `relationship`, `code text UNIQUE`, `status` DEFAULT `'pending'`, `expires_at`, `accepted_at` (nullable), `created_at`.
  - `public.parent_children` fiel al diccionario #5 (5 columnas): `id`, `parent_id` FK→`users`, `child_id` FK→`children`, `relationship`, `created_at`, con `UNIQUE (parent_id, child_id)`.
  - RLS + políticas: `invitations_read/insert/update` solo para staff de la guardería dueña del niño (vía `children→rooms→daycares`), `invitations_delete` (`false`); `parent_children_read` (SELECT `to authenticated`), insert/update/delete (`false` — inserts solo vía RPC).
  - Índices: `invitations_child_id_idx`, `parent_children_parent_id_idx`, `parent_children_child_id_idx`.
  - **Endurecimiento del trigger**: `handle_new_user` recreada con `create or replace` — `role` forzado a `'parent'` (ignora el metadata; staff solo vía seed/SQL); `daycare_id` y `full_name` siguen del metadata (los pasa la server action desde la invitación).
  - RPC `public.get_invitation_info(p_code text)` (SECURITY DEFINER, `search_path = ''`): devuelve jsonb `{childName, roomName, parentName, email, expiresAt}` solo si el código existe, está `pending` y `expires_at > now()`; `null` en caso contrario. Grant execute a `anon` y `authenticated`.
  - RPC `public.accept_invitation(p_code text)` (SECURITY DEFINER, `search_path = ''`), solo `authenticated`: bloquea la fila (`for update`), exige email de `auth.uid()` = email de la invitación, inserta `parent_children` (idempotente por UNIQUE) y marca `accepted` + `accepted_at`. Revoke de `public`/`anon`.
- Espejo local `supabase/migrations/005_invitations_parent_children.sql` con todo lo aplicado.
- `pnpm add resend` + `RESEND_API_KEY` en `.env.local` (secreto, no se commitea) y placeholder en `.env.template`.
- **Invitar (staff)** — server action `inviteParent(input)` en `app/actions/parents.ts` (`'use server'`): valida nombre/email/relación y que el niño exista; email ya vinculado (invitación `accepted` para child+email) → error "Ese email ya está vinculado a este niño."; pendiente existente → regenera código y reenvía (update de `code`/`expires_at`/`full_name`/`relationship`/`invited_by`); genera código de 5 chars `[A-Z0-9]` sin ambiguos (sin `0`, `O`, `1`, `I`, `L`) con reintentos ante colisión; **envía el correo ANTES de persistir** (fallo de Resend → error "No se pudo enviar el correo de invitación." sin cambios en la DB); éxito → insert/update (sesión staff, RLS) + `revalidatePath("/kids/[id]")`.
- **Correo** — `utils/emails/invitation.ts`: `renderInvitationEmail({parentName, childName, roomName, code, activateUrl})` → `{subject, html}`. Asunto "Tu código para seguir el día de {niño} en OpenDayCare". HTML con la paleta crema/coral, `{niño} · {sala}`, código grande con tracking, botón "Activar mi cuenta" → `{origin}/activate-account?code={code}` (origen desde `await headers()`), "Vence en 7 días" + fecha. System font stack (Fredoka/Nunito no cargan en clientes de correo). From: `OpenDayCare <onboarding@resend.dev>`.
- **Dialog real** — `LinkParentDialog.tsx`: la caja "CÓDIGO DE INVITACIÓN" se **elimina** (el código solo vive en el correo y la DB); validación client de SPEC 05 intacta; Enviar llama `inviteParent`; error del server inline; éxito → estado de éxito "Le enviamos un código a {email}." (ícono check, botón "Listo") que **espera cierre manual** (X/Esc/backdrop intactos); reset al reabrir.
- **PADRES VINCULADOS real** — `/kids/[id]` (rama uuid): consulta `parent_children` (join `users`) + `invitations` pending (`expires_at > now()`) → `mapParentRows` nuevo en `childMapping.ts` (traducciones `mother→Mamá`, `father→Papá`, `guardian→Tutor/a`): vinculados con su parentesco, pendientes como "{parentesco} · invitación enviada" + chip PENDIENTE (`avatarColor: "blue"`, precedente SPEC 05). `ParentsCard` pasa a server-driven (props, sin `useState` de lista).
- **Activación real** — server action `activateAccount(prevState, formData)` en `app/actions/auth.ts` (pública): validaciones inline (código, email, contraseña ≥ 6, consent marcado); RPC `get_invitation_info` → null → "El código no es válido o venció.", email ≠ invitación → "El email no coincide con la invitación."; `signUp` con `options.data = {daycare_id, full_name}` de la invitación ("User already registered" → "Ya existe una cuenta con este email. Iniciá sesión."); `signInWithPassword` (robusto con autoconfirm ON u OFF) → `accept_invitation(code)` → false → error + `signOut`; éxito → `signOut()` + `redirect("/login?activated=1")`.
- **`/activate-account` real**: page server lee `searchParams.code` → RPC `get_invitation_info`: código válido → pasa `{code, email, childName, roomName}` al form client (CÓDIGO y EMAIL precargados, card "Te invitaron a seguir a" + "{niño} · {sala}" reales); código inválido/vencido → mensaje de error, sin card ni precarga; sin `?code=` → sin card, campos vacíos. `app/_data/invite.ts` se **elimina**; `InviteCard` pasa a props.
- **Aviso en `/login`**: `?activated=1` → banner de éxito "¡Tu cuenta quedó activa! Iniciá sesión." sobre el form.

**Out of scope (for future specs):**

- `familia-feed` / `familia-cuenta` (tras activar, el padre loguea y ve el feed actual mock).
- Cancelar/renovar invitaciones desde una UI (los estados `expired`/`cancelled` se validan por `expires_at`; sin cron).
- Reenvío desde la lista de padres (se reinvita desde el dialog); recuperación de contraseña.
- RLS fina por-padre de `parent_children`/`invitations` (read `to authenticated`; demo).
- Editar/desvincular padres; seeds de padres; flujo del perfil mock con ids numéricos (el flujo real requiere niño real).
- Las demás pantallas pendientes.

## Data model

```sql
-- Migración: invitations_parent_children_and_rpcs (vía apply_migration)
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id),
  invited_by uuid not null references public.users(id),
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id),
  child_id uuid not null references public.children(id),
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

alter table public.invitations enable row level security;
alter table public.parent_children enable row level security;

-- staff de la guardería dueña del niño (children → rooms → daycare)
create policy "invitations_read"   on public.invitations for select to authenticated using (
  exists (select 1 from public.users u
    where u.id = auth.uid() and u.role = 'staff'
      and u.daycare_id = (select r.daycare_id from public.children c
                          join public.rooms r on r.id = c.room_id
                          where c.id = invitations.child_id)));
create policy "invitations_insert" on public.invitations for insert to authenticated with check (
  exists (select 1 from public.users u
    where u.id = auth.uid() and u.role = 'staff'
      and u.daycare_id = (select r.daycare_id from public.children c
                          join public.rooms r on r.id = c.room_id
                          where c.id = invitations.child_id)));
create policy "invitations_update" on public.invitations for update to authenticated
  using (
    exists (select 1 from public.users u
      where u.id = auth.uid() and u.role = 'staff'
        and u.daycare_id = (select r.daycare_id from public.children c
                            join public.rooms r on r.id = c.room_id
                            where c.id = invitations.child_id)))
  with check (
    exists (select 1 from public.users u
      where u.id = auth.uid() and u.role = 'staff'
        and u.daycare_id = (select r.daycare_id from public.children c
                            join public.rooms r on r.id = c.room_id
                            where c.id = invitations.child_id)));
create policy "invitations_delete" on public.invitations for delete using (false);

create policy "parent_children_read"   on public.parent_children for select to authenticated using (true);
create policy "parent_children_insert" on public.parent_children for insert with check (false);
create policy "parent_children_update" on public.parent_children for update using (false);
create policy "parent_children_delete" on public.parent_children for delete using (false);

create index invitations_child_id_idx on public.invitations (child_id);
create index parent_children_parent_id_idx on public.parent_children (parent_id);
create index parent_children_child_id_idx on public.parent_children (child_id);

-- Endurecimiento: signup público nunca crea staff
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (new.id,
          (new.raw_user_meta_data->>'daycare_id')::uuid,
          'parent',
          coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

-- RPC 1: consulta pública (la usa /activate-account, con o sin sesión)
create or replace function public.get_invitation_info(p_code text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_inv public.invitations; v_child public.children; v_room public.rooms;
begin
  select * into v_inv from public.invitations
    where code = upper(trim(p_code)) and status = 'pending' and expires_at > now();
  if v_inv.id is null then return null; end if;
  select * into v_child from public.children where id = v_inv.child_id;
  select * into v_room from public.rooms where id = v_child.room_id;
  return jsonb_build_object('childName', v_child.full_name, 'roomName', v_room.name,
                            'parentName', v_inv.full_name, 'email', v_inv.email,
                            'expiresAt', v_inv.expires_at);
end;
$$;
grant execute on function public.get_invitation_info(text) to anon, authenticated;

-- RPC 2: aceptación autenticada (vínculo + accepted)
create or replace function public.accept_invitation(p_code text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_inv record; v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  select * into v_inv from public.invitations
    where code = upper(trim(p_code)) and status = 'pending' and expires_at > now()
    for update;
  if v_inv.id is null then return false; end if;
  if v_email is null or lower(v_email) <> lower(v_inv.email) then return false; end if;
  if not exists (select 1 from public.parent_children pc
                 where pc.parent_id = auth.uid() and pc.child_id = v_inv.child_id) then
    insert into public.parent_children (parent_id, child_id, relationship)
      values (auth.uid(), v_inv.child_id, v_inv.relationship);
  end if;
  update public.invitations
    set status = 'accepted', accepted_at = now() where id = v_inv.id;
  return true;
end;
$$;
revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;
```

```ts
// app/actions/parents.ts — entrada/salida de la server action de staff
export interface InviteParentInput {
  childId: string; // uuid de children (del perfil real)
  fullName: string; // trim del nombre del dialog
  email: string; // normalizado lower(trim()) antes de todo
  relation: ParentRelation; // "Mamá" | "Papá" | "Tutor/a" → mother | father | guardian
}
export interface InviteParentResult {
  error: string | null; // null = éxito (el dialog pasa al estado de éxito)
}
```

```ts
// app/actions/auth.ts — estado del form de activación
export interface ActivateState {
  error: string | null;
}
```

```ts
// utils/emails/invitation.ts
export interface InvitationEmailData {
  parentName: string;
  childName: string;
  roomName: string;
  code: string;
  activateUrl: string; // `${origin}/activate-account?code=${code}`
}
export function renderInvitationEmail(data: InvitationEmailData): {
  subject: string;
  html: string;
};
```

```ts
// app/components/kids/childMapping.ts — view model de padres
export interface LinkedParentRow {
  parent_id: string;
  parent_name: string;
  relationship: "mother" | "father" | "guardian";
}
export interface PendingParentRow {
  full_name: string;
  relationship: "mother" | "father" | "guardian";
}
// mapParentRows(linked, pending) → ParentLink[]:
//   linked:  {name: parent_name, initial, relation: traducida, status: 'active',   avatarColor: hash(uuid) % 6}
//   pending: {name: full_name,    initial, relation: traducida, status: 'pending', avatarColor: 'blue'}
```

El mismo SQL vive en `supabase/migrations/005_invitations_parent_children.sql`. `expires_at = now() + interval '7 days'` al generar; validación siempre lazy contra `expires_at` (nada marca `expired` por su cuenta).

## Estructura de archivos

```
app/
  actions/
    auth.ts                          # + activateAccount(prevState, formData) + ActivateState
    parents.ts                       # NUEVO ('use server'): inviteParent(input)
  (auth)/
    login/page.tsx                   # banner de éxito con ?activated=1
    activate-account/page.tsx        # real: searchParams.code → RPC get_invitation_info → props
  components/
    auth/
      ActivateAccountForm.tsx        # NUEVO (client): useActionState, validaciones, errores inline
      InviteCard.tsx                 # props {childName, roomName} en vez de _data/invite.ts
    kids/
      LinkParentDialog.tsx           # sin caja de código; inviteParent; éxito espera cierre
      ParentsCard.tsx                # server-driven (props; sin useState de lista)
      childMapping.ts                # + mapParentRows + traducciones de relationship
  (daycare)/kids/[id]/page.tsx       # + parent_children join users + invitations pending → parents
  _data/invite.ts                    # ELIMINADO
utils/
  emails/invitation.ts               # NUEVO: renderInvitationEmail (subject + html)
supabase/migrations/
  005_invitations_parent_children.sql  # NUEVO espejo: DDL + políticas + índices + RPCs + trigger
.env.local / .env.template           # + RESEND_API_KEY (secreto / placeholder)
package.json                         # + resend (vía pnpm)
```

## Implementation plan

1. **`pnpm add resend`** + `RESEND_API_KEY` en `.env.local` + placeholder en `.env.template`. Manual: `pnpm exec tsc --noEmit`.
2. **Migración** `invitations_parent_children_and_rpcs` con `apply_migration` (enums, tablas, RLS, índices, trigger endurecido, RPCs + grants/revokes). Manual: nueva entrada en `supabase_list_migrations`; `execute_sql` verifica columnas, `pg_policies`, índices y que `get_invitation_info('XXXXX')` → `null` con la tabla vacía.
3. **Espejo local** `supabase/migrations/005_invitations_parent_children.sql` con el SQL exacto aplicado.
4. **`utils/emails/invitation.ts`**: `renderInvitationEmail`. Manual: `tsc`.
5. **`app/actions/parents.ts`**: `inviteParent` completo (validaciones → ya-vinculado → código → Resend → upsert → `revalidatePath`). Manual: `tsc`.
6. **`LinkParentDialog.tsx`**: quitar caja de código, submit real con `useActionState`, error del server inline, estado de éxito que espera cierre, reset al reabrir. Manual: `tsc`.
7. **`childMapping.ts` + `/kids/[id]/page.tsx` + `ParentsCard.tsx`**: padres reales server-driven (vinculados + pendientes). Manual: perfil uuid muestra PADRES VINCULADOS vacío.
8. **Envío end-to-end (staff)**: invitar con el email dueño de la cuenta Resend → llega el correo (código + link + niño/sala), perfil muestra pendiente, refresco sobrevive; reinvitar → código nuevo y el anterior inválido. Manual: bandeja de entrada + `/kids/[id]`.
9. **`app/actions/auth.ts`**: `activateAccount` (RPC → signUp → signInWithPassword → accept_invitation → signOut → redirect). Manual: `tsc`.
10. **`/activate-account` real**: page server (`searchParams` + RPC) + `ActivateAccountForm.tsx` + `InviteCard` por props + eliminar `app/_data/invite.ts`. Manual: link del correo → código/email precargados + card con niño real; sin `?code=` → sin card; código inválido → error.
11. **Aviso `/login?activated=1`** (banner de éxito). Manual: activar → `/login` con aviso → login del padre entra al feed actual.
12. **Verificación negativa + final**: RLS (insert anónimo/parent en `invitations` y `parent_children` falla; `accept_invitation` desde anon falla), `supabase_get_advisors` (security/performance), `pnpm exec eslint app`, `tsc --noEmit`, `pnpm build`, dev server relanzado limpio (PID de `.next/dev/lock`) + matriz de runtime completa (invitar/éxito/errores; activar/éxito/errores: código inválido o vencido, email distinto, contraseña < 6, consent desmarcado, email ya registrado; login del padre; pantallas previas intactas).

## Acceptance criteria

- [ ] El historial incluye `invitations_parent_children_and_rpcs` como entrada nueva.
- [ ] `relationship_type` = `father`/`mother`/`guardian` y `invitation_status` = `pending`/`accepted`/`expired`/`cancelled`.
- [ ] `invitations` con exactamente 11 columnas del diccionario #6 (`code` UNIQUE) y `parent_children` con 5 del #5 + `UNIQUE (parent_id, child_id)`.
- [ ] RLS habilitado en ambas: `invitations` read/insert/update solo staff de la guardería dueña del niño, delete `false`; `parent_children` read `to authenticated`, resto `false`.
- [ ] Índices `invitations_child_id_idx`, `parent_children_parent_id_idx`, `parent_children_child_id_idx` existen.
- [ ] `handle_new_user` fuerza `role = 'parent'`: un signup con `role: 'staff'` en metadata crea un `parent`.
- [ ] `get_invitation_info` ejecutable por `anon`: código válido/pendiente/no vencido → jsonb con `childName`/`roomName`/`parentName`/`email`; inexistente o vencido → `null`.
- [ ] `accept_invitation` revocada de `public`/`anon`; con email que no coincide → `false`; con match → inserta `parent_children` y marca `accepted` + `accepted_at`.
- [ ] Existe `supabase/migrations/005_invitations_parent_children.sql`; `resend` en `package.json` (instalado con pnpm); `RESEND_API_KEY` en `.env.local` y placeholder en `.env.template`.
- [ ] El dialog no muestra la caja "CÓDIGO DE INVITACIÓN"; Enviar válido → estado de éxito "Le enviamos un código a {email}." sin mostrar el código, que espera cierre manual; al cerrar, el padre aparece como PENDIENTE y sobrevive al refresco.
- [ ] Invitar un email ya vinculado (`accepted`) → error inline "Ese email ya está vinculado a este niño."
- [ ] Reinvitar un email con pendiente → llega correo con código nuevo y el anterior queda inválido; queda una sola fila pendiente por (niño, email).
- [ ] El correo llega al email dueño de la cuenta Resend (from `onboarding@resend.dev`): asunto con el niño, cuerpo con nombre del padre, "{niño} · {sala}", código con tracking, botón a `{origin}/activate-account?code={code}` y "Vence en 7 días".
- [ ] Falta de `RESEND_API_KEY` o fallo de Resend → error inline en el dialog y ninguna fila nueva ni modificada en `invitations`.
- [ ] `/activate-account?code=` válido → card "Te invitaron a seguir a" + "{niño} · {sala}" reales + CÓDIGO y EMAIL precargados; sin `?code=` → sin card y campos vacíos; código inválido/vencido → mensaje de error y sin precarga.
- [ ] Activar con todo válido → cuenta creada (`auth.users` + `users` con `role='parent'`, `full_name`/`daycare_id` de la invitación), fila en `parent_children` con el `relationship` de la invitación, invitación `accepted` con `accepted_at`, redirect a `/login?activated=1` sin sesión.
- [ ] `/login?activated=1` muestra el banner de éxito y el login con email+password del padre entra (al feed actual).
- [ ] Errores inline en `/activate-account`: código inválido/vencido, email que no coincide, contraseña < 6, consent desmarcado, email ya registrado.
- [ ] Verificación negativa de RLS: insert anónimo/parent en `invitations` y `parent_children` falla; `accept_invitation` desde `anon` falla.
- [ ] Perfil real: vinculados con su parentesco (Mamá/Papá/Tutor/a) y pendientes "{parentesco} · invitación enviada" + chip PENDIENTE.
- [ ] `app/_data/invite.ts` eliminado; advisors de security/performance sin errores nuevos (la RPC anon de `get_invitation_info` queda documentada como aceptada).
- [ ] `pnpm exec eslint app`, `pnpm exec tsc --noEmit` y `pnpm build` limpios; runtime sin errores/warnings en la terminal.
- [ ] Las pantallas previas (feed, `/kids` grilla + dialog agregar, login, perfil con ids numéricos mock) funcionan igual.

## Decisions

- **Sí:** el perfil `/kids/[id]` ya real (one-shot previo fuera de specs) — este spec solo agrega la parte de padres. _(corrección del usuario en Phase 2)_
- **Sí:** tras activar → `/login?activated=1` con aviso, sin auto-login (`familia-feed` no existe). _(decisión del usuario)_
- **Sí:** link del correo con `?code=` que precarga código y email (RPC) — fiel al mockup de campos precargados. _(decisión del usuario)_
- **Sí:** signup restringido a invitación — la única vía de crear cuenta es el código; la metadata la arma la server action desde la invitación. _(decisión del usuario)_
- **Sí:** Resend free + `onboarding@resend.dev` (solo entrega al email dueño de la cuenta — probar E2E con ese email). _(decisión del usuario)_
- **Sí:** sin código en pantalla — la caja del dialog se elimina; el código solo vive en el correo y la DB. _(decisión del usuario)_
- **Sí:** estado de éxito del dialog que espera cierre manual. _(decisión del usuario)_
- **Sí:** pendiente existente → regenerar y reenviar; ya vinculado → error inline. _(decisión del usuario)_
- **Sí:** autoconfirm ON asumido + flujo robusto (`signInWithPassword` explícito tras `signUp` — funciona con autoconfirm ON u OFF). _(decisión del usuario)_
- **Sí:** trigger endurecido: `role` forzado `'parent'`, staff solo vía seed/SQL. _(decisión del usuario)_
- **Sí:** RPCs SECURITY DEFINER en vez de service-role key — `get_invitation_info` para la página pública y `accept_invitation` autenticada; RLS de `parent_children` queda cerrada (inserts solo vía RPC).
- **Sí:** correo ANTES de persistir — un fallo de Resend no deja filas ni pisa códigos previos.
- **Sí:** vencimiento 7 días validado lazy contra `expires_at` (sin cron que marque `expired`).
- **Sí:** código de 5 chars sin ambiguos; `upper(trim(code))` y `lower(trim(email))` en todo el circuito.
- **Sí:** origen del link desde `await headers()` — funciona en dev y prod sin env extra.
- **Sí:** HTML del correo con la paleta y system fonts.
- **No:** auto-login tras activar; UI de cancelar/renovar invitaciones; cron de expiración; service-role key; RLS fina por-padre; `familia-feed`.

## Risks

| Riesgo                                                                             | Mitigación                                                                                                             |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Resend free solo entrega al email dueño de la cuenta                               | Probar el flujo E2E invitando exactamente ese email; documentado en el spec                                            |
| `get_invitation_info` SECURITY DEFINER ejecutable por `anon` (advisors la señalan) | Necesaria para la página pública sin exponer la tabla; devuelve solo datos del portador del código; revoke de `public` |
| Signup directo a la API de Auth con `daycare_id` arbitrario                        | Crea un `parent` huérfano inofensivo (`children_read` ya es `using(true)`); el rol siempre queda `parent`              |
| `create or replace` de la función del trigger y ACL                                | Replace conserva los grants/revokes de la migración 003; verificar con advisors                                        |
| Rate limit de Resend (free)                                                        | Error inline "No se pudo enviar el correo de invitación." sin persistir nada                                           |
| Doble invitación simultánea del mismo email (race)                                 | `code` UNIQUE + `for update` en la RPC; aceptado en demo                                                               |
| `redirect()` dentro de server action con `useActionState`                          | Patrón SPEC 09 ya validado en runtime                                                                                  |

## What is **not** in this spec

- `familia-feed` / `familia-cuenta` (el padre loguea y ve el feed actual).
- Cancelar/renovar invitaciones (UI) y cron de expiración.
- Reenvío desde la lista de padres; recuperación de contraseña.
- Editar/desvincular padres; seeds de padres; feed filtrado por hijo (`posts`).
- RLS fina por-padre; las demás pantallas pendientes.

-- Migración remota aplicada: invitations_parent_children_and_rpcs (SPEC 11)

-- ENUMs
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

-- Tabla invitations (diccionario #6, 11 columnas)
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

-- Tabla parent_children (diccionario #5, 5 columnas + UNIQUE)
create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id),
  child_id uuid not null references public.children(id),
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

-- RLS
alter table public.invitations enable row level security;
alter table public.parent_children enable row level security;

-- Políticas invitations: solo staff de la guardería dueña del niño (children → rooms → daycare)
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

-- Políticas parent_children: read a authenticated; escritura solo vía RPC
create policy "parent_children_read"   on public.parent_children for select to authenticated using (true);
create policy "parent_children_insert" on public.parent_children for insert with check (false);
create policy "parent_children_update" on public.parent_children for update using (false);
create policy "parent_children_delete" on public.parent_children for delete using (false);

-- Índices
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

-- Migración remota aplicada: create_users_and_staff_seed (SPEC 08)

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TYPE public.user_role AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE public.user_status AS ENUM ('pending', 'active');

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daycare_id uuid NOT NULL REFERENCES public.daycares(id),
  role public.user_role NOT NULL,
  status public.user_status NOT NULL DEFAULT 'active',
  full_name text NOT NULL,
  avatar_url text,
  notify_on_post boolean NOT NULL DEFAULT true,
  daily_summary_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas placeholder (se reemplazan en el spec de auth)
CREATE POLICY "users_read"   ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (false);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (false);
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (false);

-- Trigger: el perfil en public.users se crea desde auth.users
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed: usuario staff de prueba (el trigger crea la fila de public.users).
-- El insert en auth.users requiere las columnas aud/role/instance_id y los
-- timestamps no nulos, y una fila en auth.identities (provider email), o el
-- login por password falla. Ver notas del SPEC 08.
WITH new_user AS (
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    aud, role, instance_id,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    reauthentication_token, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'staff@google.com',
    crypt('staff123@', gen_salt('bf')),
    now(),
    'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object(
      'daycare_id', (SELECT id FROM public.daycares WHERE name = 'Guardería Sala Soles'),
      'role', 'staff',
      'full_name', 'test'
    ),
    '', '', '', '', '',
    now(), now()
  )
  RETURNING id, email
)
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider,
                             last_sign_in_at, created_at, updated_at)
SELECT
  id::text,
  id,
  jsonb_build_object('sub', id::text, 'email', email,
                     'email_verified', true, 'phone_verified', false),
  'email',
  now(), now(), now()
FROM new_user;

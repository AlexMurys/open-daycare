-- Migración remota aplicada: create_rooms_children (SPEC 10)

CREATE TYPE public.child_status AS ENUM ('active', 'archived');

CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES public.daycares(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id),
  full_name text NOT NULL,
  birth_date date NOT NULL,
  enrolled_at date NOT NULL DEFAULT current_date,
  medical_notes text,
  allergy_tags text[] NOT NULL DEFAULT '{}',
  photo_consent boolean NOT NULL DEFAULT true,
  status public.child_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_read"   ON public.rooms   FOR SELECT TO authenticated USING (true);
CREATE POLICY "rooms_insert" ON public.rooms   FOR INSERT WITH CHECK (false);
CREATE POLICY "rooms_update" ON public.rooms   FOR UPDATE USING (false);
CREATE POLICY "rooms_delete" ON public.rooms   FOR DELETE USING (false);

CREATE POLICY "children_read"   ON public.children FOR SELECT TO authenticated USING (true);
CREATE POLICY "children_insert" ON public.children FOR INSERT TO authenticated WITH CHECK (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role = 'staff'
      and u.daycare_id = (select r.daycare_id from public.rooms r where r.id = room_id)
  )
);
CREATE POLICY "children_update" ON public.children FOR UPDATE USING (false);
CREATE POLICY "children_delete" ON public.children FOR DELETE USING (false);

CREATE INDEX rooms_daycare_id_idx ON public.rooms (daycare_id);
CREATE INDEX children_room_id_idx ON public.children (room_id);

-- Seed: 3 salas en "Guardería Sala Soles"
INSERT INTO public.rooms (daycare_id, name)
SELECT d.id, v.name
FROM public.daycares d
CROSS JOIN (VALUES ('Soles'), ('Lunas'), ('Estrellas')) AS v(name)
WHERE d.name = 'Guardería Sala Soles';

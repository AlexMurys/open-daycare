-- Migración remota aplicada: users_revoke_execute_and_index_fk (SPEC 08)

-- Endurecer la función de trigger: no debe ser llamable vía RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

-- Índice que cubre la FK daycare_id
CREATE INDEX users_daycare_id_idx ON public.users (daycare_id);

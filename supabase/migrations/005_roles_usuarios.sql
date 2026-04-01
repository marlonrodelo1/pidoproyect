-- ============================================
-- 005: Sistema de roles en tabla usuarios
-- Un correo = un solo rol en toda la plataforma
-- ============================================

-- 1. Campo rol en usuarios
ALTER TABLE public.usuarios
ADD COLUMN rol TEXT NOT NULL DEFAULT 'cliente'
CHECK (rol IN ('cliente', 'socio', 'restaurante', 'superadmin'));

CREATE INDEX idx_usuarios_rol ON public.usuarios(rol);

-- 2. Campo user_id en establecimientos (enlace con auth.users)
ALTER TABLE public.establecimientos
ADD COLUMN user_id UUID REFERENCES auth.users(id);

CREATE INDEX idx_establecimientos_user_id ON public.establecimientos(user_id);

-- 3. Trigger de unicidad: un email = un solo rol
CREATE OR REPLACE FUNCTION public.enforce_email_unique_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE email = NEW.email
      AND rol != NEW.rol
      AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Este correo electrónico ya está registrado en la plataforma con otro rol.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_email_unique_role ON public.usuarios;
CREATE TRIGGER trg_enforce_email_unique_role
  BEFORE INSERT OR UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_email_unique_role();

-- 4. Actualizar handle_new_user para ser role-aware
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_rol TEXT;
BEGIN
  user_rol := COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente');

  IF user_rol NOT IN ('cliente', 'socio', 'restaurante', 'superadmin') THEN
    user_rol := 'cliente';
  END IF;

  INSERT INTO public.usuarios (id, nombre, email, avatar_url, rol)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'nombre',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    user_rol
  );
  RETURN NEW;
END;
$$;

-- 5. Actualizar check_email_role para usar columna rol
CREATE OR REPLACE FUNCTION public.check_email_role(check_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE email = check_email) THEN
    RETURN (
      SELECT json_build_object('exists', true, 'role', rol)
      FROM public.usuarios WHERE email = check_email LIMIT 1
    );
  END IF;

  -- Fallback legacy: socios sin entrada en usuarios
  IF EXISTS (SELECT 1 FROM public.socios WHERE email = check_email) THEN
    RETURN json_build_object('exists', true, 'role', 'socio');
  END IF;

  -- Fallback legacy: establecimientos sin entrada en usuarios
  IF EXISTS (SELECT 1 FROM public.establecimientos WHERE email = check_email) THEN
    RETURN json_build_object('exists', true, 'role', 'restaurante');
  END IF;

  RETURN json_build_object('exists', false, 'role', null);
END;
$$;

-- 6. Actualizar RLS en usuarios (por rol)
DROP POLICY IF EXISTS usuarios_select_all ON public.usuarios;
DROP POLICY IF EXISTS usuarios_update_all ON public.usuarios;
DROP POLICY IF EXISTS usuarios_insert_own ON public.usuarios;

-- Cada usuario ve solo su propio registro; superadmin ve todos
CREATE POLICY usuarios_cliente_select ON public.usuarios
  FOR SELECT USING (
    auth.uid()::text = id::text
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'superadmin')
  );

CREATE POLICY usuarios_cliente_insert ON public.usuarios
  FOR INSERT WITH CHECK (true);

CREATE POLICY usuarios_cliente_update ON public.usuarios
  FOR UPDATE USING (
    auth.uid()::text = id::text
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'superadmin')
  );

CREATE POLICY usuarios_superadmin_delete ON public.usuarios
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'superadmin')
  );

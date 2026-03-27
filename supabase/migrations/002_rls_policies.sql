-- =====================================================
-- PIDO - Migration 002: Row Level Security Policies
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE establecimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_tamanos ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras_opciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE socio_establecimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_semanales ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances_restaurante ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances_socio ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_cuenta ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USUARIOS
-- =====================================================
-- Cualquiera autenticado puede ver su propio perfil
CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT USING (auth.uid()::text = id::text);

-- Puede actualizar su propio perfil
CREATE POLICY "usuarios_update_own" ON usuarios
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Puede insertar su propio perfil al registrarse
CREATE POLICY "usuarios_insert_own" ON usuarios
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Service role puede todo (para edge functions y admin)
CREATE POLICY "usuarios_service" ON usuarios
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- ESTABLECIMIENTOS
-- =====================================================
-- Todos pueden ver establecimientos activos (app publica)
CREATE POLICY "establecimientos_select_public" ON establecimientos
  FOR SELECT USING (activo = true);

-- El restaurante puede ver/editar su propio establecimiento (via auth.uid en tabla separada o email)
CREATE POLICY "establecimientos_select_own" ON establecimientos
  FOR SELECT USING (email = auth.jwt()->>'email');

CREATE POLICY "establecimientos_update_own" ON establecimientos
  FOR UPDATE USING (email = auth.jwt()->>'email');

-- Service role puede todo
CREATE POLICY "establecimientos_service" ON establecimientos
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- CATEGORIAS (lectura publica, edicion del restaurante)
-- =====================================================
CREATE POLICY "categorias_select_public" ON categorias
  FOR SELECT USING (true);

CREATE POLICY "categorias_manage_own" ON categorias
  FOR ALL USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "categorias_service" ON categorias
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- PRODUCTOS (lectura publica, edicion del restaurante)
-- =====================================================
CREATE POLICY "productos_select_public" ON productos
  FOR SELECT USING (true);

CREATE POLICY "productos_manage_own" ON productos
  FOR ALL USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "productos_service" ON productos
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- PRODUCTO_TAMANOS (lectura publica, edicion del restaurante)
-- =====================================================
CREATE POLICY "producto_tamanos_select_public" ON producto_tamanos
  FOR SELECT USING (true);

CREATE POLICY "producto_tamanos_manage" ON producto_tamanos
  FOR ALL USING (
    producto_id IN (
      SELECT p.id FROM productos p
      JOIN establecimientos e ON p.establecimiento_id = e.id
      WHERE e.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "producto_tamanos_service" ON producto_tamanos
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- GRUPOS_EXTRAS (lectura publica, edicion del restaurante)
-- =====================================================
CREATE POLICY "grupos_extras_select_public" ON grupos_extras
  FOR SELECT USING (true);

CREATE POLICY "grupos_extras_manage" ON grupos_extras
  FOR ALL USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "grupos_extras_service" ON grupos_extras
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- EXTRAS_OPCIONES (lectura publica)
-- =====================================================
CREATE POLICY "extras_opciones_select_public" ON extras_opciones
  FOR SELECT USING (true);

CREATE POLICY "extras_opciones_manage" ON extras_opciones
  FOR ALL USING (
    grupo_id IN (
      SELECT ge.id FROM grupos_extras ge
      JOIN establecimientos e ON ge.establecimiento_id = e.id
      WHERE e.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "extras_opciones_service" ON extras_opciones
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- PRODUCTO_EXTRAS (lectura publica)
-- =====================================================
CREATE POLICY "producto_extras_select_public" ON producto_extras
  FOR SELECT USING (true);

CREATE POLICY "producto_extras_manage" ON producto_extras
  FOR ALL USING (
    producto_id IN (
      SELECT p.id FROM productos p
      JOIN establecimientos e ON p.establecimiento_id = e.id
      WHERE e.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "producto_extras_service" ON producto_extras
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SOCIOS
-- =====================================================
-- Lectura publica (la tienda del socio es publica)
CREATE POLICY "socios_select_public" ON socios
  FOR SELECT USING (true);

-- El socio puede editar su propio perfil
CREATE POLICY "socios_update_own" ON socios
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "socios_insert_own" ON socios
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "socios_service" ON socios
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SOCIO_ESTABLECIMIENTO
-- =====================================================
-- El socio puede ver sus relaciones
CREATE POLICY "socio_est_select_socio" ON socio_establecimiento
  FOR SELECT USING (
    socio_id IN (SELECT id FROM socios WHERE user_id = auth.uid())
  );

-- El restaurante puede ver solicitudes a su establecimiento
CREATE POLICY "socio_est_select_rest" ON socio_establecimiento
  FOR SELECT USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

-- El socio puede solicitar (INSERT)
CREATE POLICY "socio_est_insert_socio" ON socio_establecimiento
  FOR INSERT WITH CHECK (
    socio_id IN (SELECT id FROM socios WHERE user_id = auth.uid())
  );

-- El restaurante puede aceptar/rechazar (UPDATE)
CREATE POLICY "socio_est_update_rest" ON socio_establecimiento
  FOR UPDATE USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "socio_est_service" ON socio_establecimiento
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- PEDIDOS
-- =====================================================
-- El cliente ve sus pedidos
CREATE POLICY "pedidos_select_cliente" ON pedidos
  FOR SELECT USING (usuario_id::text = auth.uid()::text);

-- El restaurante ve pedidos de su establecimiento
CREATE POLICY "pedidos_select_rest" ON pedidos
  FOR SELECT USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

-- El socio ve pedidos asignados a el
CREATE POLICY "pedidos_select_socio" ON pedidos
  FOR SELECT USING (
    socio_id IN (SELECT id FROM socios WHERE user_id = auth.uid())
  );

-- Cualquier autenticado puede crear pedido
CREATE POLICY "pedidos_insert_auth" ON pedidos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- El restaurante puede actualizar estado de sus pedidos
CREATE POLICY "pedidos_update_rest" ON pedidos
  FOR UPDATE USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

-- El socio puede actualizar estado de sus pedidos
CREATE POLICY "pedidos_update_socio" ON pedidos
  FOR UPDATE USING (
    socio_id IN (SELECT id FROM socios WHERE user_id = auth.uid())
  );

CREATE POLICY "pedidos_service" ON pedidos
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- PEDIDO_ITEMS
-- =====================================================
-- Mismo acceso que pedidos
CREATE POLICY "pedido_items_select_cliente" ON pedido_items
  FOR SELECT USING (
    pedido_id IN (SELECT id FROM pedidos WHERE usuario_id::text = auth.uid()::text)
  );

CREATE POLICY "pedido_items_select_rest" ON pedido_items
  FOR SELECT USING (
    pedido_id IN (
      SELECT id FROM pedidos WHERE establecimiento_id IN (
        SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
      )
    )
  );

CREATE POLICY "pedido_items_select_socio" ON pedido_items
  FOR SELECT USING (
    pedido_id IN (
      SELECT id FROM pedidos WHERE socio_id IN (
        SELECT id FROM socios WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "pedido_items_insert_auth" ON pedido_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "pedido_items_service" ON pedido_items
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- COMISIONES
-- =====================================================
CREATE POLICY "comisiones_select_socio" ON comisiones
  FOR SELECT USING (
    socio_id IN (SELECT id FROM socios WHERE user_id = auth.uid())
  );

CREATE POLICY "comisiones_select_rest" ON comisiones
  FOR SELECT USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "comisiones_service" ON comisiones
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- RESENAS
-- =====================================================
CREATE POLICY "resenas_select_public" ON resenas
  FOR SELECT USING (true);

CREATE POLICY "resenas_insert_auth" ON resenas
  FOR INSERT WITH CHECK (usuario_id::text = auth.uid()::text);

CREATE POLICY "resenas_service" ON resenas
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- MENSAJES
-- =====================================================
-- El socio ve sus mensajes
CREATE POLICY "mensajes_select_socio" ON mensajes
  FOR SELECT USING (
    socio_id IN (SELECT id FROM socios WHERE user_id = auth.uid())
  );

-- El restaurante ve mensajes de su establecimiento
CREATE POLICY "mensajes_select_rest" ON mensajes
  FOR SELECT USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

-- Socio puede enviar mensajes
CREATE POLICY "mensajes_insert_socio" ON mensajes
  FOR INSERT WITH CHECK (
    socio_id IN (SELECT id FROM socios WHERE user_id = auth.uid())
  );

-- Restaurante puede enviar mensajes
CREATE POLICY "mensajes_insert_rest" ON mensajes
  FOR INSERT WITH CHECK (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

-- Marcar como leido
CREATE POLICY "mensajes_update_socio" ON mensajes
  FOR UPDATE USING (
    socio_id IN (SELECT id FROM socios WHERE user_id = auth.uid())
  );

CREATE POLICY "mensajes_update_rest" ON mensajes
  FOR UPDATE USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "mensajes_service" ON mensajes
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- NOTIFICACIONES
-- =====================================================
CREATE POLICY "notificaciones_select_own" ON notificaciones
  FOR SELECT USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "notificaciones_update_own" ON notificaciones
  FOR UPDATE USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "notificaciones_service" ON notificaciones
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- FACTURAS_SEMANALES
-- =====================================================
CREATE POLICY "facturas_select_socio" ON facturas_semanales
  FOR SELECT USING (
    socio_id IN (SELECT id FROM socios WHERE user_id = auth.uid())
  );

CREATE POLICY "facturas_select_rest" ON facturas_semanales
  FOR SELECT USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "facturas_service" ON facturas_semanales
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- BALANCES_RESTAURANTE
-- =====================================================
CREATE POLICY "balances_rest_select_own" ON balances_restaurante
  FOR SELECT USING (
    establecimiento_id IN (
      SELECT id FROM establecimientos WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "balances_rest_service" ON balances_restaurante
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- BALANCES_SOCIO
-- =====================================================
CREATE POLICY "balances_socio_select_own" ON balances_socio
  FOR SELECT USING (
    socio_id IN (SELECT id FROM socios WHERE user_id = auth.uid())
  );

CREATE POLICY "balances_socio_service" ON balances_socio
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- MOVIMIENTOS_CUENTA (solo service role / admin)
-- =====================================================
CREATE POLICY "movimientos_service" ON movimientos_cuenta
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

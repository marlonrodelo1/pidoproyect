-- =====================================================
-- PIDO - Migration 001: Tablas base completas
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  apellido TEXT,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  direccion TEXT,
  latitud FLOAT,
  longitud FLOAT,
  avatar_url TEXT,
  favoritos UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESTABLECIMIENTOS
CREATE TABLE IF NOT EXISTS establecimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'restaurante',
  categoria_padre TEXT DEFAULT 'comida',
  descripcion TEXT,
  logo_url TEXT,
  banner_url TEXT,
  direccion TEXT,
  latitud FLOAT NOT NULL,
  longitud FLOAT NOT NULL,
  radio_cobertura_km FLOAT DEFAULT 10,
  activo BOOLEAN DEFAULT true,
  horario JSONB,
  email TEXT,
  telefono TEXT,
  rating FLOAT DEFAULT 0,
  total_resenas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true
);

-- PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio FLOAT NOT NULL,
  imagen_url TEXT,
  disponible BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTO TAMANOS
CREATE TABLE IF NOT EXISTS producto_tamanos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio FLOAT NOT NULL,
  orden INTEGER DEFAULT 0
);

-- GRUPOS EXTRAS
CREATE TABLE IF NOT EXISTS grupos_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'multiple',
  max_selecciones INTEGER DEFAULT 3
);

-- EXTRAS OPCIONES
CREATE TABLE IF NOT EXISTS extras_opciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id UUID REFERENCES grupos_extras(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio FLOAT NOT NULL,
  orden INTEGER DEFAULT 0
);

-- PRODUCTO EXTRAS (relacion producto <-> grupo)
CREATE TABLE IF NOT EXISTS producto_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  grupo_id UUID REFERENCES grupos_extras(id) ON DELETE CASCADE
);

-- SOCIOS
CREATE TABLE IF NOT EXISTS socios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  nombre_comercial TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  telefono TEXT,
  logo_url TEXT,
  banner_url TEXT,
  modo_entrega TEXT DEFAULT 'ambos',
  radio_km FLOAT DEFAULT 10,
  latitud_actual FLOAT,
  longitud_actual FLOAT,
  activo BOOLEAN DEFAULT true,
  en_servicio BOOLEAN DEFAULT false,
  rating FLOAT DEFAULT 0,
  total_resenas INTEGER DEFAULT 0,
  redes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOCIO <-> ESTABLECIMIENTO
CREATE TABLE IF NOT EXISTS socio_establecimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  socio_id UUID REFERENCES socios(id) ON DELETE CASCADE,
  establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  estado TEXT DEFAULT 'pendiente',
  destacado BOOLEAN DEFAULT false,
  orden_destacado INTEGER DEFAULT 0,
  solicitado_at TIMESTAMPTZ DEFAULT NOW(),
  aceptado_at TIMESTAMPTZ
);

-- PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  establecimiento_id UUID REFERENCES establecimientos(id),
  socio_id UUID REFERENCES socios(id),
  canal TEXT NOT NULL,
  estado TEXT DEFAULT 'nuevo',
  metodo_pago TEXT NOT NULL,
  subtotal FLOAT NOT NULL,
  coste_envio FLOAT DEFAULT 0,
  propina FLOAT DEFAULT 0,
  total FLOAT NOT NULL,
  direccion_entrega TEXT,
  lat_entrega FLOAT,
  lng_entrega FLOAT,
  notas TEXT,
  minutos_preparacion INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  aceptado_at TIMESTAMPTZ,
  recogido_at TIMESTAMPTZ,
  entregado_at TIMESTAMPTZ
);

-- PEDIDO ITEMS
CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  nombre_producto TEXT NOT NULL,
  tamano TEXT,
  extras TEXT[],
  precio_unitario FLOAT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  notas TEXT
);

-- COMISIONES
CREATE TABLE IF NOT EXISTS comisiones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id),
  socio_id UUID REFERENCES socios(id),
  establecimiento_id UUID REFERENCES establecimientos(id),
  total_pedido FLOAT NOT NULL,
  comision_plataforma FLOAT NOT NULL,
  comision_socio FLOAT NOT NULL,
  envio_socio FLOAT DEFAULT 0,
  propina_socio FLOAT DEFAULT 0,
  tipo TEXT NOT NULL,
  estado_pago TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESENAS
CREATE TABLE IF NOT EXISTS resenas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id),
  establecimiento_id UUID REFERENCES establecimientos(id),
  socio_id UUID REFERENCES socios(id),
  pedido_id UUID REFERENCES pedidos(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  texto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MENSAJES
CREATE TABLE IF NOT EXISTS mensajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  socio_id UUID REFERENCES socios(id),
  establecimiento_id UUID REFERENCES establecimientos(id),
  de TEXT NOT NULL,
  texto TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT,
  leida BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FACTURAS SEMANALES (actualizada con desglose tarjeta/efectivo)
CREATE TABLE IF NOT EXISTS facturas_semanales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  socio_id UUID REFERENCES socios(id),
  establecimiento_id UUID REFERENCES establecimientos(id),
  semana_inicio DATE NOT NULL,
  semana_fin DATE NOT NULL,
  total_pedidos INTEGER DEFAULT 0,
  pedidos_entregados INTEGER DEFAULT 0,
  pedidos_cancelados INTEGER DEFAULT 0,
  pedidos_fallidos INTEGER DEFAULT 0,
  pedidos_tarjeta INTEGER DEFAULT 0,
  pedidos_efectivo INTEGER DEFAULT 0,
  total_ventas FLOAT DEFAULT 0,
  ventas_tarjeta FLOAT DEFAULT 0,
  ventas_efectivo FLOAT DEFAULT 0,
  total_comisiones FLOAT DEFAULT 0,
  total_envios FLOAT DEFAULT 0,
  total_propinas FLOAT DEFAULT 0,
  total_ganado FLOAT DEFAULT 0,
  estado TEXT DEFAULT 'pendiente',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BALANCES RESTAURANTE (NUEVO)
CREATE TABLE IF NOT EXISTS balances_restaurante (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id UUID REFERENCES establecimientos(id),
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  pedidos_tarjeta INTEGER DEFAULT 0,
  ventas_tarjeta FLOAT DEFAULT 0,
  a_favor_restaurante FLOAT DEFAULT 0,
  pedidos_efectivo INTEGER DEFAULT 0,
  ventas_efectivo FLOAT DEFAULT 0,
  debe_restaurante FLOAT DEFAULT 0,
  balance_neto FLOAT DEFAULT 0,
  comision_plataforma FLOAT DEFAULT 0,
  estado TEXT DEFAULT 'pendiente',
  pagado_at TIMESTAMPTZ,
  referencia_pago TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BALANCES SOCIO (NUEVO)
CREATE TABLE IF NOT EXISTS balances_socio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  socio_id UUID REFERENCES socios(id),
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  comisiones_tarjeta FLOAT DEFAULT 0,
  envios_tarjeta FLOAT DEFAULT 0,
  propinas_tarjeta FLOAT DEFAULT 0,
  total_pagar_socio FLOAT DEFAULT 0,
  total_efectivo_recaudado FLOAT DEFAULT 0,
  estado TEXT DEFAULT 'pendiente',
  pagado_at TIMESTAMPTZ,
  referencia_pago TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MOVIMIENTOS CUENTA (NUEVO)
CREATE TABLE IF NOT EXISTS movimientos_cuenta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  pedido_id UUID REFERENCES pedidos(id),
  establecimiento_id UUID REFERENCES establecimientos(id),
  socio_id UUID REFERENCES socios(id),
  monto FLOAT NOT NULL,
  descripcion TEXT,
  referencia TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REALTIME: habilitar en pedidos, mensajes, socios, socio_establecimiento
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;
ALTER PUBLICATION supabase_realtime ADD TABLE socios;
ALTER PUBLICATION supabase_realtime ADD TABLE socio_establecimiento;

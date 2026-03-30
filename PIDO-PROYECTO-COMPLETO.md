# PIDO / PIDOGO — Especificación Completa del Proyecto

## 1. VISIÓN GENERAL

PIDO es un ecosistema de delivery con 4 aplicaciones conectadas:

1. **PIDO (App del cliente)** — App tipo Glovo/UberEats donde el usuario final busca restaurantes, hace pedidos, paga y sigue su entrega en tiempo real.
2. **PIDOGO (Tienda pública del socio)** — Página web pública que cada socio/rider arma como su propia tienda. Tiene URL tipo `pido.com/nombre-comercial`. El socio la comparte por WhatsApp, Instagram, QR, etc.
3. **PIDOGO Panel (Panel del socio)** — App móvil del socio/rider para gestionar pedidos en vivo, métricas, negocios, informes, perfil y soporte.
4. **Panel del Restaurante** — App para el restaurante donde gestionan pedidos en tiempo real, carta, socios repartidores y configuración.

---

## 2. MODELO DE NEGOCIO Y COMISIONES

### Pedido con REPARTO (entrega a domicilio):
- El restaurante paga un **20% del pedido**
  - **10%** para la plataforma (PIDO)
  - **10%** para el socio/repartidor
- El socio cobra además el **100% del coste de envío** + **propinas**

### Pedido de RECOGIDA (cliente va al restaurante):
- El restaurante paga un **15% del pedido**
  - **10%** para la plataforma (PIDO)
  - **5%** para el socio que generó la venta a través de su tienda

### Dos canales de entrada de pedidos:
1. **Canal PIDO (app principal):** El pedido se asigna automáticamente al repartidor más cercano que esté activo.
2. **Canal PIDOGO (tienda del socio):** El pedido va directo y exclusivamente al socio cuya tienda generó la venta. La comisión es solo para él.

### Métodos de pago:
- **Tarjeta** — pago online a través de la app
- **Efectivo** — el cliente paga al repartidor en la entrega
- Siempre debe estar visible y claro qué método de pago tiene cada pedido.

### Sistema de tarifas de envío:

**Canal PIDOGO (tienda del socio):**
- El socio configura su propia tarifa desde su panel de administración:
  - **Tarifa base mínima:** 3,00 € (no puede ser inferior)
  - **Radio que cubre la tarifa base:** configurable (ej. 3 km)
  - **Precio por km adicional:** configurable (ej. 0,50 €/km)
- El cliente ve el coste de envío calculado antes de pedir
- El socio cobra el 100% del envío

**Canal PIDO (app principal):**
- La plataforma PIDO calcula una tarifa estándar basada en la distancia restaurante → cliente:
  - **Tarifa base:** 2,50 € (cubre hasta 2 km)
  - **Por km adicional:** 0,50 €/km
  - **Máximo:** configurable desde Super Admin
- El rider asignado cobra el 100% de esa tarifa
- La tarifa la fija la plataforma, no el rider

**Visibilidad de tarifas:**
- El restaurante ve la tarifa del socio antes de aceptarlo como repartidor
- En la solicitud del socio al restaurante se muestra: "Tarifa base: 3,00 € · +0,50 €/km adicional"
- El cliente siempre ve el coste de envío total antes de confirmar el pedido

---

## 3. TECH STACK

- **Frontend:** React (Vite) + Capacitor (para apps móviles iOS/Android)
- **Backend:** Supabase (PostgreSQL + PostGIS + Realtime + Edge Functions + Storage + Auth)
- **Geolocalización:** PostGIS (consultas de radio) + Google Maps API (navegación y mapas)
- **Pagos:** Stripe (tarjeta)
- **Notificaciones push:** Firebase Cloud Messaging + Capacitor Push plugin
- **Sonido alarma pedidos:** Web Audio API / Capacitor Local Notifications
- **Estilos:** CSS-in-JS (inline styles), fuente DM Sans
- **Color principal PIDO:** #FF6B2C (naranja del logo)
- **Color panel socio:** #FF5733 (naranja-rojo)
- **Color panel restaurante:** #B91C1C (rojo oscuro)

---

## 4. BASE DE DATOS (Supabase/PostgreSQL)

### Extensiones necesarias:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
```

### Tablas:

#### usuarios
```sql
CREATE TABLE usuarios (
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
```

#### establecimientos (antes "restaurantes", preparado para multi-negocio)
```sql
CREATE TABLE establecimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'restaurante', -- restaurante, minimarket, fruteria, farmacia...
  categoria_padre TEXT DEFAULT 'comida', -- "comida", "farmacia", "marketplace"
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
```

#### categorias
```sql
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true
);
```

#### productos
```sql
CREATE TABLE productos (
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
```

#### producto_tamanos
```sql
CREATE TABLE producto_tamanos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL, -- "Mediana", "Grande", "Familiar"
  precio FLOAT NOT NULL,
  orden INTEGER DEFAULT 0
);
```

#### grupos_extras
```sql
CREATE TABLE grupos_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL, -- "Quesos extra", "Toppings", "Salsas"
  tipo TEXT DEFAULT 'multiple', -- "single" o "multiple"
  max_selecciones INTEGER DEFAULT 3
);
```

#### extras_opciones
```sql
CREATE TABLE extras_opciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id UUID REFERENCES grupos_extras(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio FLOAT NOT NULL,
  orden INTEGER DEFAULT 0
);
```

#### producto_extras (relación producto <-> grupo de extras)
```sql
CREATE TABLE producto_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  grupo_id UUID REFERENCES grupos_extras(id) ON DELETE CASCADE
);
```

#### socios (antes "repartidores")
```sql
CREATE TABLE socios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  nombre_comercial TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  telefono TEXT,
  logo_url TEXT,
  banner_url TEXT,
  modo_entrega TEXT DEFAULT 'ambos', -- "reparto", "recogida", "ambos"
  radio_km FLOAT DEFAULT 10,
  -- Tarifas de envío del socio
  tarifa_base FLOAT DEFAULT 3.00, -- mínimo 3€
  radio_tarifa_base_km FLOAT DEFAULT 3, -- km que cubre la tarifa base
  precio_km_adicional FLOAT DEFAULT 0.50, -- € por cada km adicional
  latitud_actual FLOAT,
  longitud_actual FLOAT,
  activo BOOLEAN DEFAULT true,
  en_servicio BOOLEAN DEFAULT false,
  rating FLOAT DEFAULT 0,
  total_resenas INTEGER DEFAULT 0,
  redes JSONB DEFAULT '{}', -- {instagram, tiktok, whatsapp}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### socio_establecimiento (relación socio <-> establecimiento)
```sql
CREATE TABLE socio_establecimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  socio_id UUID REFERENCES socios(id) ON DELETE CASCADE,
  establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  estado TEXT DEFAULT 'pendiente', -- "pendiente", "aceptado", "rechazado"
  destacado BOOLEAN DEFAULT false,
  orden_destacado INTEGER DEFAULT 0,
  solicitado_at TIMESTAMPTZ DEFAULT NOW(),
  aceptado_at TIMESTAMPTZ
);
```

#### pedidos
```sql
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL, -- "PD-1247"
  usuario_id UUID REFERENCES usuarios(id),
  establecimiento_id UUID REFERENCES establecimientos(id),
  socio_id UUID REFERENCES socios(id),
  canal TEXT NOT NULL, -- "pido" o "pidogo"
  estado TEXT DEFAULT 'nuevo', -- "nuevo", "aceptado", "preparando", "listo", "recogido", "en_camino", "entregado", "cancelado", "fallido"
  metodo_pago TEXT NOT NULL, -- "tarjeta" o "efectivo"
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
```

#### pedido_items
```sql
CREATE TABLE pedido_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  nombre_producto TEXT NOT NULL,
  tamano TEXT,
  extras TEXT[], -- array de nombres de extras seleccionados
  precio_unitario FLOAT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  notas TEXT
);
```

#### comisiones
```sql
CREATE TABLE comisiones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id),
  socio_id UUID REFERENCES socios(id),
  establecimiento_id UUID REFERENCES establecimientos(id),
  total_pedido FLOAT NOT NULL,
  comision_plataforma FLOAT NOT NULL, -- 10%
  comision_socio FLOAT NOT NULL, -- 10% (reparto) o 5% (recogida)
  envio_socio FLOAT DEFAULT 0,
  propina_socio FLOAT DEFAULT 0,
  tipo TEXT NOT NULL, -- "reparto" o "recogida"
  estado_pago TEXT DEFAULT 'pendiente', -- "pendiente", "pagado"
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### resenas
```sql
CREATE TABLE resenas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id),
  establecimiento_id UUID REFERENCES establecimientos(id),
  socio_id UUID REFERENCES socios(id), -- puede ser null si es reseña solo del restaurante
  pedido_id UUID REFERENCES pedidos(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  texto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### mensajes (chat socio <-> restaurante y soporte)
```sql
CREATE TABLE mensajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL, -- "socio_restaurante" o "soporte"
  socio_id UUID REFERENCES socios(id),
  establecimiento_id UUID REFERENCES establecimientos(id),
  de TEXT NOT NULL, -- "socio", "restaurante", "soporte"
  texto TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### notificaciones
```sql
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT, -- "pedido", "promocion", "sistema"
  leida BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### facturas_semanales
```sql
CREATE TABLE facturas_semanales (
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
  estado TEXT DEFAULT 'pendiente', -- "pendiente", "pagado"
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### balances_restaurante
```sql
CREATE TABLE balances_restaurante (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id UUID REFERENCES establecimientos(id),
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  -- Pedidos tarjeta (dinero en cuenta PIDO)
  pedidos_tarjeta INTEGER DEFAULT 0,
  ventas_tarjeta FLOAT DEFAULT 0,
  a_favor_restaurante FLOAT DEFAULT 0, -- ventas_tarjeta * 0.80
  -- Pedidos efectivo (dinero cobrado por socio)
  pedidos_efectivo INTEGER DEFAULT 0,
  ventas_efectivo FLOAT DEFAULT 0,
  debe_restaurante FLOAT DEFAULT 0, -- ventas_efectivo * 0.20 (comisión no cobrada)
  -- Balance
  balance_neto FLOAT DEFAULT 0, -- a_favor - debe (positivo = PIDO paga, negativo = rest debe)
  comision_plataforma FLOAT DEFAULT 0,
  estado TEXT DEFAULT 'pendiente', -- "pendiente", "pagado", "cobrado"
  pagado_at TIMESTAMPTZ,
  referencia_pago TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### balances_socio
```sql
CREATE TABLE balances_socio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  socio_id UUID REFERENCES socios(id),
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  -- Lo que PIDO debe al socio (de pedidos tarjeta)
  comisiones_tarjeta FLOAT DEFAULT 0,
  envios_tarjeta FLOAT DEFAULT 0,
  propinas_tarjeta FLOAT DEFAULT 0,
  total_pagar_socio FLOAT DEFAULT 0, -- suma de los 3
  -- Lo que el socio cobró en efectivo
  total_efectivo_recaudado FLOAT DEFAULT 0,
  -- Estado
  estado TEXT DEFAULT 'pendiente',
  pagado_at TIMESTAMPTZ,
  referencia_pago TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### movimientos_cuenta (registro de todas las transacciones)
```sql
CREATE TABLE movimientos_cuenta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL, -- "entrada_tarjeta", "pago_restaurante", "pago_socio", "cobro_comision"
  pedido_id UUID REFERENCES pedidos(id),
  establecimiento_id UUID REFERENCES establecimientos(id),
  socio_id UUID REFERENCES socios(id),
  monto FLOAT NOT NULL,
  descripcion TEXT,
  referencia TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. SUPABASE REALTIME

Habilitar Realtime en estas tablas para que los cambios se reciban instantáneamente:

- `pedidos` — para que restaurantes y socios reciban pedidos nuevos en tiempo real
- `mensajes` — para el chat en tiempo real entre socio y restaurante
- `socios` (campo `latitud_actual`, `longitud_actual`) — para tracking del rider
- `socio_establecimiento` (campo `estado`) — para notificar aceptación/rechazo

### Subscripciones clave:
```javascript
// Restaurante escucha pedidos nuevos
supabase.channel('pedidos-restaurante')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'pedidos',
    filter: `establecimiento_id=eq.${restauranteId}` 
  }, payload => {
    // Reproducir sonido de alarma
    // Mostrar pedido nuevo con countdown de 3 min
  })
  .subscribe();

// Socio escucha pedidos asignados
supabase.channel('pedidos-socio')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'pedidos',
    filter: `socio_id=eq.${socioId}`
  }, payload => {
    // Actualizar estado del pedido en la app del socio
  })
  .subscribe();

// Cliente sigue su pedido
supabase.channel('tracking-pedido')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'pedidos',
    filter: `id=eq.${pedidoId}`
  }, payload => {
    // Actualizar etapa del tracking
  })
  .subscribe();

// Cliente sigue posición del rider
supabase.channel('rider-position')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'socios',
    filter: `id=eq.${socioId}`
  }, payload => {
    // Mover el rider en el mapa
  })
  .subscribe();
```

---

## 6. EDGE FUNCTIONS (Supabase)

### calcular_comisiones
Cuando un pedido se marca como "entregado":
```
Si el pedido es de REPARTO:
  comision_plataforma = total * 0.10
  comision_socio = total * 0.10
  envio_socio = coste_envio (100%)
  propina_socio = propina (100%)

Si el pedido es de RECOGIDA:
  comision_plataforma = total * 0.10
  comision_socio = total * 0.05
  envio_socio = 0
  propina_socio = 0
```

### asignar_repartidor
Cuando un pedido entra por el canal "pido" (app principal):
1. Buscar socios con `en_servicio = true`
2. Que tengan relación `aceptado` con el establecimiento
3. Ordenar por distancia (PostGIS) al establecimiento
4. Asignar al más cercano

### calcular_envio
Calcula el coste de envío según el canal:
```
Si canal es "pidogo":
  distancia = distancia(establecimiento, cliente)
  Si distancia <= socio.radio_tarifa_base_km:
    envio = socio.tarifa_base
  Sino:
    km_extra = distancia - socio.radio_tarifa_base_km
    envio = socio.tarifa_base + (km_extra * socio.precio_km_adicional)

Si canal es "pido":
  distancia = distancia(establecimiento, cliente)
  Si distancia <= config.radio_base_km (default 2):
    envio = config.tarifa_base (default 2.50)
  Sino:
    km_extra = distancia - config.radio_base_km
    envio = config.tarifa_base + (km_extra * config.precio_km_adicional)
  Si envio > config.tarifa_maxima: envio = config.tarifa_maxima
```

### generar_informe_semanal
Cron job que cada lunes genera la factura semanal para cada par socio-establecimiento con el resumen de pedidos, comisiones, envíos y propinas.

---

## 7. FLUJO DE GEOLOCALIZACIÓN

### Para el cliente:
- Al abrir la app, pedir geolocalización
- Mostrar solo establecimientos cuyo `radio_cobertura_km` incluya al cliente
- Consulta PostGIS: `ST_DWithin(establecimiento.geom, cliente.geom, radio_km * 1000)`

### Para el socio:
- Actualizar `latitud_actual` y `longitud_actual` cada 10 segundos cuando está en servicio
- El cliente ve la posición del rider en el mapa de tracking

### Para asignación automática:
- Cuando un pedido entra por PIDO, buscar el socio activo más cercano al establecimiento usando PostGIS

---

## 8. PANTALLAS (archivos de referencia adjuntos)

Los prototipos funcionales de todas las pantallas están en estos archivos JSX que van adjuntos. Úsalos como referencia visual y funcional para construir las apps reales:

### NUEVO: Captación de riders desde la app del cliente
En la app PIDO (cliente), debe haber un botón/banner visible que invite al usuario a convertirse en socio/rider. Al tocarlo, se abre una landing page dentro de la app que muestra:
- Título motivacional: "Gana dinero repartiendo con pidoo"
- Beneficios claros: 10% de comisión por cada pedido + 100% del envío + propinas
- Ejemplo de ganancias: "Un rider activo puede ganar entre 800€ y 1.500€ al mes"
- Cómo funciona: seleccionas restaurantes, armas tu tienda, compartes tu link, ganas por cada pedido
- Requisitos: ser autónomo en España, tener moto o bicicleta, smartphone
- Ventajas: no cocinas, no necesitas negocio propio, acceso a todos los restaurantes de la plataforma, tú gestionas tu horario
- Botón de "Registrarme como socio" que lleva al registro de PIDOGO
- Testimonios/números de ejemplo

### NUEVO: Super Admin Panel (panel-superadmin.jsx)
Panel de control general del ecosistema PIDO. Solo para el equipo de la empresa. Incluye:

**Dashboard general:**
- Métricas globales: total pedidos, ventas, comisiones plataforma, usuarios activos
- Gráficas de crecimiento: pedidos por día/semana/mes
- Desglose por vertical: comida vs farmacia vs marketplace
- Desglose por método de pago: tarjeta vs efectivo

**Gestión de establecimientos:**
- Listado de todos los establecimientos con buscador y filtros
- Ver detalle de cada uno: datos, carta, pedidos, socios vinculados
- Activar/desactivar establecimientos
- Editar datos de cualquier establecimiento

**Gestión de socios/riders:**
- Listado de todos los socios con estados y métricas
- Ver detalle: pedidos, comisiones, restaurantes, rating
- Activar/desactivar socios
- Ver facturas y pagos

**Gestión de usuarios/clientes:**
- Listado de usuarios registrados
- Ver historial de pedidos de cada usuario
- Gestionar incidencias

**Gestión de pedidos:**
- Todos los pedidos del sistema con filtros (fecha, estado, canal, método de pago)
- Detalle completo de cada pedido
- Poder cancelar o modificar pedidos
- Ver pedidos en tiempo real

**Soporte:**
- Bandeja de mensajes de soporte de los socios
- Responder mensajes directamente
- Historial de conversaciones

**Finanzas:**
- Total comisiones generadas por la plataforma
- Desglose por establecimiento y por socio
- Pagos pendientes y realizados
- Exportar informes financieros

**Configuración:**
- Porcentajes de comisiones (modificables)
- Radio de cobertura por defecto
- Tarifas de envío del canal PIDO: tarifa base (default 2,50€), radio base (default 2km), precio/km adicional (default 0,50€), tarifa máxima
- Gestión de categorías padre (comida, farmacia, marketplace)
- Gestión de notificaciones masivas
- Gestión de promociones

### pidogo-tienda-repartidor.jsx
Tienda pública del socio. Incluye:
- Banner con redes sociales del socio (Instagram, TikTok, WhatsApp)
- Logo centrado sobre el banner
- Badge de modo entrega (Solo recogida / Delivery / Ambos)
- Rating y reseñas del socio (expandibles)
- Slider de restaurantes destacados
- Categorías como filtros
- Grid de restaurantes con badge de recogida/delivery
- Detalle del restaurante con carta, dirección para recogida, reseñas
- Carrito con lógica de recogida (envío gratis) o delivery
- Banner "Estos pedidos son para recoger. ¿Quieres delivery? Ir a PIDO" cuando es solo recogida
- Modal de compartir (WhatsApp, Instagram, copiar enlace, código QR)
- URL pública: pido.com/{slug}

### pidogo-panel-socio.jsx
Panel de administración del socio. Incluye:
- Header con logo + botón "En vivo" (con punto pulsante) + botón "Soporte"
- **En vivo:** pedidos entrantes en tiempo real con detalle completo (productos, notas, total, ganancia, método de pago tarjeta/efectivo, canal PIDO o tu tienda), flujo aceptar → ir a recoger (Google Maps) → recogido → en camino (Google Maps) → entregado, barra de progreso
- **Inicio (Dashboard):** total ganado con desglose (comisiones + envíos + propinas), selector hoy/semana/mes, tarjetas métricas, últimos pedidos con badges de pago
- **Pedidos:** historial completo con filtros (todos, entregados, cancelados, fallidos), desglose por pedido
- **Negocios:** listado de establecimientos con logo/emoji, estados (aceptado, pendiente, rechazado), botones solicitar/destacar/desvincular, botón Chat por restaurante
- **Informes:** informe semanal con resumen (entregados, cancelados, fallidos), total ganado, desglose por restaurante, botón "Descargar PDF", historial de informes
- **Perfil:** toggle en servicio/fuera de servicio, info (nombre, nombre comercial, email, teléfono, URL tienda), modo entrega (reparto/recogida/ambos), slider radio de cobertura (1-20 km), **configuración de tarifa de envío** (tarifa base mín. 3€, radio que cubre, precio/km adicional), subida de logo (400×400, max 2MB), subida de banner (1200×400, max 5MB), redes sociales editables
- **Soporte:** chat directo con equipo PIDO

### panel-restaurante.jsx
Panel del restaurante. Incluye:
- Header con logo del restaurante + estado abierto/cerrado + botón "Métricas"
- **Pedidos en vivo:** alarma visual + sonora cuando llega pedido, countdown de 3 minutos para aceptar, detalle del pedido (items, notas, total, método de pago, canal de entrada), selección de tiempo de preparación (15/20/30/45 min), pedidos en preparación con barra de progreso, botón "Listo para recoger" → "Recogido"
- **Historial:** todos los pedidos completados organizados por fecha, filtros por estado, badges de pago y canal
- **Carta:** productos con imagen, toggle disponible/no disponible, editor expandible con subida de imagen (800×600, max 3MB), gestión de tamaños y precios, asignación de grupos de extras, botón "Gestionar grupos de extras" con pantalla completa de gestión
- **Socios:** solicitudes pendientes destacadas (mostrando la tarifa de envío del socio: base + €/km), socios activos con vista detalle (3 tabs: Info, Facturas con estado pagado/pendiente, Chat directo con el socio), socios rechazados con opción reactivar
- **Métricas:** ventas del día con desglose tarjeta/efectivo, pedidos, ticket medio, tiempo medio preparación, cancelados, resumen semanal
- **Ajustes:** toggle abierto/cerrado, información del restaurante, gestión de categorías

### pido-app-cliente.jsx
App del cliente PIDO. Incluye:
- **Onboarding (después del splash nativo):** Una sola página animada: el selector de vertical. Los permisos nativos de ubicación y notificaciones se piden automáticamente por el sistema operativo al cargar la página (Capacitor Geolocation + PushNotifications). La ubicación queda guardada para el pedido. La página muestra el logo "pidoo" con animación de entrada, emojis flotantes de fondo, y tres tarjetas grandes animadas: Comida (restaurantes, cafeterías), Farmacia (medicamentos, higiene), Marketplace (minimarkets, tiendas). Cada tarjeta entra con animación diferente (desde la izquierda, desde abajo, desde la derecha) y tiene hover con scale + sombra + bounce del emoji. Al tocar una, la app arranca filtrada por esa vertical. En el header queda un badge con la categoría seleccionada para cambiar en cualquier momento.
- **Login/Registro:** pantalla de inicio de sesión y registro
- **Header:** logo "pidoo" + badge "En curso" cuando hay pedido activo + campana de notificaciones con contador
- **Inicio:** dirección de entrega, buscador de restaurantes/platos, categorías con iconos, slider de restaurantes destacados, listado con badges de delivery/recogida, corazón de favoritos, tiempo, distancia, rating
- **Detalle restaurante:** carta con modal de producto (tamaños, extras con checkboxes, cantidad, precio calculado en tiempo real), badge de modo entrega, dirección para recogida
- **Carrito:** desglose de items con tamaño y extras, selector de propina (0/1/2/3€), método de pago (tarjeta/efectivo), desglose completo
- **Tracking en tiempo real:** mapa animado con rider moviéndose del restaurante al cliente, info del repartidor asignado (nombre, rating, botón llamar), progreso paso a paso (recibido → preparando → listo → en camino → entregado), tiempo estimado dinámico, valoración al finalizar
- **Favoritos:** lista de restaurantes favoritos con corazón
- **Mapa:** vista de mapa con restaurantes posicionados, riders activos con nombre y punto verde, radio de cobertura, ubicación del usuario
- **Notificaciones:** listado con estados leída/no leída
- **Mis pedidos:** historial con opción repetir pedido
- **Perfil:** datos, direcciones, métodos de pago, promociones, configuración, ayuda

---

## 9. ORDEN DE CONSTRUCCIÓN RECOMENDADO

### Fase 1: Base de datos y Auth ✅ COMPLETADA
1. ✅ Todas las tablas creadas (usuarios, establecimientos, categorias, productos, producto_tamanos, grupos_extras, extras_opciones, producto_extras, socios, socio_establecimiento, pedidos, pedido_items, comisiones, resenas, mensajes, notificaciones, facturas_semanales, balances_restaurante, balances_socio, movimientos_cuenta, categorias_generales, establecimiento_categorias, push_subscriptions)
2. ✅ RLS policies configuradas
3. ✅ Realtime habilitado en pedidos, mensajes, socios
4. ✅ Auth configurado (email + password)
5. ✅ Storage configurado (buckets: logos, banners, productos)
6. ✅ PostGIS habilitado
7. ✅ Campos tarifa_base, radio_tarifa_base_km, precio_km_adicional en socios (migración 003)

### Fase 2: Backend ✅ COMPLETADA
1. ✅ Edge Function: calcular_comisiones (calcula 10%/5% según tipo)
2. ✅ Edge Function: asignar_repartidor (PostGIS distancia, busca más cercano)
3. ✅ Edge Function: generar_informe_semanal (cron)
4. ✅ Edge Function: generar_codigo_pedido
5. ✅ Edge Function: calcular_envio (Haversine, canal PIDO vs PIDOGO, tarifas dinámicas)
6. ✅ Edge Function: crear_pago_stripe (Stripe payment intents)
7. ✅ Edge Function: enviar_push (notificaciones push)
8. ✅ Edge Function: rider_timeout (timeout 2min, auto-reasignación)

### Fase 3: App del cliente (PIDO) ✅ COMPLETADA
1. ✅ Login/Registro (email+password, validación, reset)
2. ✅ Onboarding (selector vertical: Comida, Farmacia, Marketplace)
3. ✅ Home con geolocalización (PostGIS, filtros, categorías, favoritos)
4. ✅ Detalle restaurante + carta con extras/tamaños
5. ✅ Carrito + checkout (Stripe tarjeta + efectivo, tarjetas guardadas)
6. ✅ Envío dinámico via Edge Function calcular_envio (distancia real en km)
7. ✅ Tracking en tiempo real (Realtime subscriptions, 5 etapas, rating)
8. ✅ Favoritos, notificaciones, historial (MisPedidos), perfil
9. ✅ Mapa con Google Maps real (tema oscuro, markers, InfoWindows, riders realtime)
10. ✅ Tienda pública del socio integrada en pidoo.es/{slug} (TiendaSocio.jsx)
11. ✅ Landing "Ser socio" (captación riders)
12. ✅ Push notifications (web + nativo Capacitor)

### Fase 4: Tienda pública del socio (PIDOGO) ✅ COMPLETADA
- La tienda pública se sirve desde pido-app/src/pages/TiendaSocio.jsx en pidoo.es/{slug}
1. ✅ Página pública con slug dinámico
2. ✅ Banner + logo + rating + redes sociales + compartir (QR, WhatsApp, copiar link)
3. ✅ Listado de restaurantes del socio (destacados + todos)
4. ✅ Categorías como filtros
5. ✅ Detalle restaurante con carta completa
6. ✅ Carrito + pedido (Stripe + efectivo)
7. ✅ Modo recogida/delivery con tarifa dinámica (Haversine + config del socio)
8. ✅ Geolocalización del cliente para calcular envío real
9. ✅ Banner "Ir a PIDO" cuando solo recogida
10. ✅ Reseñas del socio expandibles

### Fase 5: Panel del socio ✅ COMPLETADA
1. ✅ Pedidos en vivo (Realtime, alarma, countdown 2min, aceptar/rechazar)
2. ✅ Dashboard (comisiones, envíos, propinas, filtro hoy/semana/mes)
3. ✅ Gestión de negocios (solicitar, desvincular, destacar)
4. ✅ Informes semanales
5. ✅ Perfil (en servicio, modo entrega, radio, tarifa envío configurable, logo, banner, redes)
6. ✅ Soporte (chat con equipo PIDO)
7. ✅ Flujo completo: ir a recoger → Google Maps → recogido → en camino → entregado
8. ✅ Contacto cliente (llamar + WhatsApp)
9. ✅ Pedido fallido

### Fase 6: Panel del restaurante ✅ COMPLETADA
1. ✅ Pedidos en tiempo real con alarma + countdown 3min
2. ✅ Carta con extras/tamaños/imágenes + toggle disponibilidad
3. ✅ Gestión de socios (solicitudes pendientes con tarifa visible, chat, facturas)
4. ✅ Historial completo con filtros
5. ✅ Métricas (ventas, ticket medio, tiempo preparación, desglose tarjeta/efectivo)
6. ✅ Ajustes (abierto/cerrado, info restaurante, categorías)

### Fase 7: Super Admin Panel ✅ COMPLETADA
1. ✅ Dashboard general con métricas globales
2. ✅ Gestión de establecimientos
3. ✅ Gestión de socios/riders
4. ✅ Gestión de usuarios
5. ✅ Gestión de pedidos en tiempo real
6. ✅ Soporte (bandeja de mensajes)
7. ✅ Finanzas (comisiones, pagos, exportar)
8. ✅ Configuración general (tarifas envío PIDO, comisiones, categorías)
9. ✅ Mapa admin
10. ✅ Notificaciones masivas

### Fase 8: Mobile (parcial)
1. ✅ Configurar Capacitor (iOS + Android)
2. ✅ Push notifications (Firebase + Capacitor)
3. ✅ Sonido alarma pedidos (Web Audio API)
4. ✅ Geolocalización nativa (Capacitor Geolocation)
5. ⏳ Build iOS/Android (pendiente)

---

## 10. NOTAS IMPORTANTES

- **La carta es una sola** — cada restaurante tiene una carta, no cambia según el canal. Lo que cambia es la asignación del repartidor.
- **URL de la tienda del socio** se genera automáticamente con el nombre comercial: `pidoo.es/{slug}` — se sirve desde pido-app/src/pages/TiendaSocio.jsx (no es una app separada)
- **Sin login en la tienda pública** del socio por ahora — el cliente puede pedir sin registrarse desde la tienda del socio.
- **Login obligatorio** en la app PIDO principal.
- **La plataforma empieza con restaurantes y hostelería** pero la estructura está preparada para minimarkets, fruterías, farmacias (campo `tipo` en establecimientos).
- **Canarias** es el mercado inicial — por eso el logo tiene la bandera canaria de fondo.
- **Comunicación bidireccional** entre socio y restaurante via chat integrado.
- **Cada pedido** debe indicar claramente: método de pago (tarjeta/efectivo), canal de entrada (PIDO/PIDOGO), repartidor asignado.
- **Captación de riders** — en la app del cliente hay un botón/banner que invita al usuario a registrarse como socio, con landing page explicativa del modelo de negocio, ganancias y requisitos.
- **Super Admin** — panel de control general (web, no app móvil) para el equipo de PIDO con control absoluto: usuarios, establecimientos, socios, pedidos, soporte, finanzas, configuración. Es la 5ª pantalla del ecosistema.
- **Estructura monorepo** con 6 packages: shared, pido-app, pidogo-panel, restaurante, pidogo-web, super-admin.
- **Deploy** — Git push a main → Dokploy detecta y despliega automáticamente. Clean cache activado en pido-app y pidogo-tienda.
- **Dominios Dokploy**: pidoo.es (pido-app), rider.pidoo.es (pidogo-panel). La tienda del socio va dentro de pido-app (pidoo.es/{slug}).
- **Google Maps API Key** configurada en pido-app/.env (VITE_GOOGLE_MAPS_API_KEY).

---

## 11. FLUJO FINANCIERO Y BALANCES

### Cuenta general:
Todos los pagos con tarjeta van a la cuenta general de PIDO (Stripe). Desde ahí se hacen los pagos a restaurantes y socios.

### Flujo por pedido con TARJETA:
```
Cliente paga 55€ (producto 50€ + envío 3€ + propina 2€) → cuenta PIDO

PIDO retiene: 5€ (10% de 50€ = comisión plataforma)
PIDO paga al restaurante: 40€ (50€ - 20% comisión)
PIDO paga al socio: 5€ (10% comisión) + 3€ (envío) + 2€ (propina) = 10€
```

### Flujo por pedido en EFECTIVO:
```
Cliente paga 55€ en mano al socio

El socio se queda: 5€ (10%) + 3€ (envío) + 2€ (propina) = 10€
El socio paga al restaurante: 45€
El restaurante debe a PIDO: 10€ (20% comisión sobre 50€)
→ Esos 10€ se descuentan del próximo pago que PIDO le haga al restaurante por pedidos con tarjeta
```

### Balance por restaurante:
```
A FAVOR del restaurante (PIDO le debe):
  + Pedidos tarjeta × 80% (total - 20% comisión)

EN CONTRA del restaurante (debe a PIDO):
  + Pedidos efectivo × 20% (comisión que PIDO no cobró)

BALANCE NETO = A FAVOR - EN CONTRA
  Si positivo → PIDO paga al restaurante
  Si negativo → el restaurante debe a PIDO
```

### Balance por socio:
```
PIDO debe al socio:
  + 10% comisión de pedidos TARJETA
  + Envío de pedidos TARJETA
  + Propinas de pedidos TARJETA

El socio ya cobró directamente:
  + Todo el efectivo de pedidos EFECTIVO
  + De ahí paga al restaurante su parte
```

### En el Super Admin — Sección Finanzas:
- **Balance por restaurante:** tabla con: pedidos tarjeta, pedidos efectivo, comisiones generadas, lo que PIDO debe al restaurante, lo que el restaurante debe a PIDO, balance neto, estado (por pagar / por cobrar)
- **Balance por socio:** comisiones pendientes de pago (tarjeta), efectivo recaudado, entregas realizadas
- **Conciliación:** marcar pagos realizados y cobros efectuados con fecha y referencia
- **Informes descargables:** trimestrales, mensuales, semanales. Desglose de ingresos, gastos, comisiones, balances. Exportar PDF y CSV.
- **Vista de cuenta general:** saldo actual, entradas (pagos tarjeta), salidas (pagos a restaurantes + pagos a socios), comisiones retenidas

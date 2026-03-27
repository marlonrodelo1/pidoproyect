import { useState, useEffect } from "react";

const RESTAURANTE = {
  nombre: "Pizzería Don Mario",
  logo: "🍕",
  direccion: "C/ San Fernando 12, Santa Cruz",
  telefono: "+34 922 123 456",
  email: "donmario@email.com",
  rating: 4.8,
  totalResenas: 234,
  activo: true,
  horario: "12:00 - 23:00",
};

const STATS = {
  pedidosHoy: 28,
  pedidosSemana: 156,
  ventasHoy: 784.50,
  ventasSemana: 4320.00,
  pedidosTarjeta: 18,
  pedidosEfectivo: 10,
  ventasTarjeta: 512.30,
  ventasEfectivo: 272.20,
  ticketMedio: 28.02,
  tiempoMedioPrep: 22,
  pedidosCancelados: 2,
};

const CATEGORIAS = [
  { id: 1, nombre: "Pizzas", orden: 1, activa: true },
  { id: 2, nombre: "Entrantes", orden: 2, activa: true },
  { id: 3, nombre: "Bebidas", orden: 3, activa: true },
  { id: 4, nombre: "Postres", orden: 4, activa: false },
];

const PRODUCTOS = [
  { id: 101, catId: 1, nombre: "Margherita", precio: 9.50, desc: "Tomate, mozzarella, albahaca", disponible: true, imagen: null,
    tamanos: [{ nombre: "Mediana", precio: 9.50 }, { nombre: "Grande", precio: 13.50 }, { nombre: "Familiar", precio: 17.00 }],
    extras: ["extras-quesos", "extras-toppings"] },
  { id: 102, catId: 1, nombre: "Pepperoni", precio: 11.00, desc: "Pepperoni, mozzarella, orégano", disponible: true, imagen: null,
    tamanos: [{ nombre: "Mediana", precio: 11.00 }, { nombre: "Grande", precio: 15.00 }],
    extras: ["extras-quesos", "extras-toppings"] },
  { id: 103, catId: 1, nombre: "Cuatro Quesos", precio: 12.50, desc: "Mozzarella, gorgonzola, parmesano, emmental", disponible: true, imagen: null,
    tamanos: [{ nombre: "Mediana", precio: 12.50 }, { nombre: "Grande", precio: 16.50 }],
    extras: ["extras-quesos"] },
  { id: 104, catId: 1, nombre: "Hawaiana", precio: 11.50, desc: "Jamón, piña, mozzarella", disponible: false, imagen: null,
    tamanos: [], extras: [] },
  { id: 201, catId: 2, nombre: "Bruschetta", precio: 6.50, desc: "Pan tostado, tomate, albahaca, ajo", disponible: true, imagen: null,
    tamanos: [], extras: ["extras-salsas"] },
  { id: 202, catId: 2, nombre: "Ensalada César", precio: 8.00, desc: "Lechuga, pollo, parmesano, croutons", disponible: true, imagen: null,
    tamanos: [{ nombre: "Normal", precio: 8.00 }, { nombre: "Grande", precio: 11.00 }],
    extras: ["extras-salsas"] },
  { id: 301, catId: 3, nombre: "Coca-Cola", precio: 2.50, desc: "33cl", disponible: true, imagen: null, tamanos: [], extras: [] },
  { id: 302, catId: 3, nombre: "Agua mineral", precio: 1.50, desc: "50cl", disponible: true, imagen: null, tamanos: [], extras: [] },
  { id: 303, catId: 3, nombre: "Cerveza artesana", precio: 3.50, desc: "33cl, IPA local", disponible: true, imagen: null, tamanos: [], extras: [] },
];

const GRUPOS_EXTRAS = [
  { id: "extras-quesos", nombre: "Quesos extra", tipo: "multiple", max: 3, opciones: [
    { nombre: "Extra mozzarella", precio: 1.50 },
    { nombre: "Gorgonzola", precio: 2.00 },
    { nombre: "Parmesano", precio: 1.50 },
    { nombre: "Cheddar", precio: 1.50 },
  ]},
  { id: "extras-toppings", nombre: "Toppings", tipo: "multiple", max: 5, opciones: [
    { nombre: "Pepperoni", precio: 1.50 },
    { nombre: "Champiñones", precio: 1.00 },
    { nombre: "Aceitunas", precio: 1.00 },
    { nombre: "Jamón serrano", precio: 2.50 },
    { nombre: "Rúcula", precio: 1.00 },
  ]},
  { id: "extras-salsas", nombre: "Salsas", tipo: "single", max: 1, opciones: [
    { nombre: "Salsa César", precio: 0.50 },
    { nombre: "Vinagreta", precio: 0.50 },
    { nombre: "Ranch", precio: 0.50 },
  ]},
];

const PEDIDOS_ENTRANTES = [
  {
    id: "PD-1250", cliente: "Elena Fernández", direccion: "C/ La Noria 22, 4ºB",
    tel: "+34 677 888 999", hora: "14:45", pago: "tarjeta", canal: "pidogo", socio: "Juanito Express",
    items: [
      { nombre: "Margherita", cantidad: 1, precio: 9.50 },
      { nombre: "Pepperoni", cantidad: 2, precio: 11.00 },
      { nombre: "Coca-Cola", cantidad: 2, precio: 2.50 },
    ],
    total: 36.50, notas: "Extra de queso en la Pepperoni",
    estado: "nuevo",
  },
  {
    id: "PD-1251", cliente: "Mario Torres", direccion: "Av. Anaga 30, 1ºA",
    tel: "+34 688 111 222", hora: "14:48", pago: "efectivo", canal: "pido", socio: null,
    items: [
      { nombre: "Cuatro Quesos", cantidad: 1, precio: 12.50 },
      { nombre: "Bruschetta", cantidad: 1, precio: 6.50 },
      { nombre: "Cerveza artesana", cantidad: 2, precio: 3.50 },
    ],
    total: 26.00, notas: "",
    estado: "nuevo",
  },
];

const PEDIDOS_ACTIVOS_INIT = [
  {
    id: "PD-1248", cliente: "María García", hora: "14:20", pago: "tarjeta", canal: "pidogo", socio: "Juanito Express",
    items: [{ nombre: "Mix Salmón", cantidad: 1, precio: 14.90 }],
    total: 14.90, estado: "preparando", minutosPrep: 15, aceptadoHace: 12,
  },
  {
    id: "PD-1249", cliente: "Carlos Pérez", hora: "14:32", pago: "efectivo", canal: "pido", socio: "Rider cercano",
    items: [{ nombre: "Pepperoni", cantidad: 1, precio: 11.00 }, { nombre: "Agua mineral", cantidad: 1, precio: 1.50 }],
    total: 12.50, estado: "preparando", minutosPrep: 20, aceptadoHace: 5,
  },
];

const SOCIOS = [
  { id: 1, nombre: "Juanito Express", estado: "aceptado", pedidos: 45, rating: 4.7,
    facturas: [
      { semana: "17-23 Mar", pedidos: 18, total: 478.00, comision: 47.80, estado: "pendiente" },
      { semana: "10-16 Mar", pedidos: 15, total: 412.00, comision: 41.20, estado: "pagado" },
      { semana: "3-9 Mar", pedidos: 12, total: 320.00, comision: 32.00, estado: "pagado" },
    ],
    mensajes: [
      { de: "socio", texto: "Hola, mañana estaré disponible desde las 11h", hora: "09:30" },
      { de: "restaurante", texto: "Perfecto, tenemos bastantes pedidos los sábados", hora: "09:45" },
    ],
  },
  { id: 2, nombre: "María Delivery", estado: "pendiente", pedidos: 0, rating: 4.5, facturas: [], mensajes: [] },
  { id: 3, nombre: "Rápido SC", estado: "aceptado", pedidos: 28, rating: 4.3,
    facturas: [
      { semana: "17-23 Mar", pedidos: 10, total: 280.00, comision: 28.00, estado: "pendiente" },
    ],
    mensajes: [],
  },
  { id: 4, nombre: "Express Tenerife", estado: "pendiente", pedidos: 0, rating: 4.8, facturas: [], mensajes: [] },
  { id: 5, nombre: "Delivery Pro", estado: "rechazado", pedidos: 0, rating: 3.9, facturas: [], mensajes: [] },
];

const HISTORIAL_PEDIDOS = [
  { id: "PD-1247", cliente: "María García", hora: "14:32", fecha: "Hoy", pago: "tarjeta", canal: "pidogo", socio: "Juanito Express", total: 28.90, estado: "entregado" },
  { id: "PD-1246", cliente: "Carlos Pérez", hora: "13:58", fecha: "Hoy", pago: "efectivo", canal: "pido", socio: "Rápido SC", total: 19.40, estado: "entregado" },
  { id: "PD-1245", cliente: "Ana Ruiz", hora: "13:15", fecha: "Hoy", pago: "tarjeta", canal: "pidogo", socio: "Juanito Express", total: 23.00, estado: "entregado" },
  { id: "PD-1244", cliente: "Javier López", hora: "12:40", fecha: "Hoy", pago: "efectivo", canal: "pido", socio: "Rápido SC", total: 15.50, estado: "cancelado" },
  { id: "PD-1240", cliente: "Laura Martín", hora: "20:10", fecha: "Ayer", pago: "tarjeta", canal: "pidogo", socio: "Juanito Express", total: 32.00, estado: "entregado" },
  { id: "PD-1238", cliente: "Pedro Sánchez", hora: "19:30", fecha: "Ayer", pago: "tarjeta", canal: "pido", socio: "Rápido SC", total: 18.00, estado: "entregado" },
  { id: "PD-1235", cliente: "Elena Torres", hora: "14:20", fecha: "Ayer", pago: "efectivo", canal: "pidogo", socio: "Juanito Express", total: 26.50, estado: "entregado" },
];

// --- ICONOS ---
function IconPedidos() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 14l2 2 4-4"/></svg>;
}
function IconCarta() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>;
}
function IconSocios() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
}
function IconDashboard() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconConfig() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
}

// --- COMPONENTES ---
function PagoBadge({ pago }) {
  const t = pago === "tarjeta";
  return (
    <span style={{
      background: t ? "#DBEAFE" : "#DCFCE7", color: t ? "#1E40AF" : "#166534",
      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
      display: "inline-flex", alignItems: "center", gap: 3,
    }}>{t ? "💳" : "💵"} {t ? "Tarjeta" : "Efectivo"}</span>
  );
}

function CanalBadge({ canal, socio }) {
  return (
    <span style={{
      background: canal === "pidogo" ? "#F3E8FF" : "#FFF7ED",
      color: canal === "pidogo" ? "#6B21A8" : "#C2410C",
      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
    }}>{canal === "pidogo" ? `🛵 ${socio}` : "📱 App PIDO"}</span>
  );
}

function EstadoBadge({ estado }) {
  const c = {
    nuevo: { bg: "#DBEAFE", color: "#1E40AF", label: "Nuevo" },
    aceptado: { bg: "#DCFCE7", color: "#166534", label: "Aceptado" },
    preparando: { bg: "#FEF3C7", color: "#92400E", label: "Preparando" },
    listo: { bg: "#DCFCE7", color: "#166534", label: "Listo" },
    recogido: { bg: "#F3E8FF", color: "#6B21A8", label: "Recogido" },
    entregado: { bg: "#DCFCE7", color: "#166534", label: "Entregado" },
    cancelado: { bg: "#FEE2E2", color: "#991B1B", label: "Cancelado" },
    pendiente: { bg: "#FEF3C7", color: "#92400E", label: "Pendiente" },
    rechazado: { bg: "#FEE2E2", color: "#991B1B", label: "Rechazado" },
  }[estado] || { bg: "#F3F2EF", color: "#8C8A85", label: estado };
  return <span style={{ background: c.bg, color: c.color, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{c.label}</span>;
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: accent ? "var(--c-primary)" : "var(--c-surface)", borderRadius: 14,
      padding: "14px 16px", border: accent ? "none" : "1px solid var(--c-border)",
      flex: "1 1 140px", minWidth: 140,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: accent ? "rgba(255,255,255,0.7)" : "var(--c-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: accent ? "#fff" : "var(--c-text)", letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: accent ? "rgba(255,255,255,0.5)" : "var(--c-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// --- SECCIONES ---

function PedidosEnVivo({ pedidosEntrantes, setPedidosEntrantes, pedidosActivos, setPedidosActivos }) {
  const [timers, setTimers] = useState(() => {
    const t = {};
    PEDIDOS_ENTRANTES.forEach(p => { t[p.id] = 180; });
    return t;
  });

  // Countdown timer
  useEffect(() => {
    if (pedidosEntrantes.length === 0) return;
    const interval = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id] > 0) next[id] -= 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pedidosEntrantes.length]);

  const formatTimer = (secs) => {
    const s = secs || 180;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const aceptarPedido = (pedido, minutos) => {
    setPedidosEntrantes(prev => prev.filter(p => p.id !== pedido.id));
    setPedidosActivos(prev => [...prev, { ...pedido, estado: "preparando", minutosPrep: minutos, aceptadoHace: 0 }]);
    setTimers(prev => { const n = { ...prev }; delete n[pedido.id]; return n; });
  };

  const rechazarPedido = (id) => {
    setPedidosEntrantes(prev => prev.filter(p => p.id !== id));
    setTimers(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const marcarListo = (id) => {
    setPedidosActivos(prev => prev.map(p => p.id === id ? { ...p, estado: "listo" } : p));
  };

  const marcarRecogido = (id) => {
    setPedidosActivos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 16px" }}>Pedidos en vivo</h2>

      {/* Nuevos pedidos */}
      {pedidosEntrantes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {/* Alerta sonora visual */}
          <div style={{
            background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 8, border: "1px solid #FEE2E2",
            animation: "pulse 1s ease-in-out infinite",
          }}>
            <span style={{ fontSize: 18 }}>🔔</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>
                {pedidosEntrantes.length} pedido{pedidosEntrantes.length > 1 ? "s" : ""} esperando respuesta
              </div>
              <div style={{ fontSize: 10, color: "#B91C1C" }}>
                Sonando hasta que aceptes o rechaces
              </div>
            </div>
          </div>

          {pedidosEntrantes.map((p) => (
            <div key={p.id} style={{
              background: "linear-gradient(135deg, var(--c-primary), #D94420)", borderRadius: 16,
              padding: "18px", marginBottom: 12,
            }}>
              {/* Countdown timer */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{p.id}</span>
                  <PagoBadge pago={p.pago} />
                </div>
                <div style={{
                  background: (timers[p.id] || 180) < 60 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.25)",
                  borderRadius: 8, padding: "4px 10px",
                  color: (timers[p.id] || 180) < 60 ? "#B91C1C" : "#fff",
                  fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                  animation: (timers[p.id] || 180) < 60 ? "pulse 0.5s ease-in-out infinite" : "none",
                }}>
                  {formatTimer(timers[p.id])}
                </div>
              </div>

              <CanalBadge canal={p.canal} socio={p.socio} />

              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px", margin: "10px 0" }}>
                {p.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: 12, marginBottom: i < p.items.length - 1 ? 4 : 0 }}>
                    <span>{item.cantidad}x {item.nombre}</span>
                    <span style={{ fontWeight: 700 }}>{(item.precio * item.cantidad).toFixed(2)} €</span>
                  </div>
                ))}
              </div>

              {p.notas && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 10, fontStyle: "italic" }}>
                  Nota: {p.notas}
                </div>
              )}

              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 14 }}>
                Total: {p.total.toFixed(2)} €
                {p.pago === "efectivo" && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 8, opacity: 0.7 }}>Cobrar en efectivo</span>}
              </div>

              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Tiempo de preparación:</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[15, 20, 30, 45].map((min) => (
                  <button key={min} onClick={() => aceptarPedido(p, min)} style={{
                    flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                    background: "#fff", color: "var(--c-primary)", fontSize: 13, fontWeight: 800,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>{min} min</button>
                ))}
              </div>

              <button onClick={() => rechazarPedido(p.id)} style={{
                width: "100%", marginTop: 8, padding: "10px 0", borderRadius: 10,
                border: "2px solid rgba(255,255,255,0.3)", background: "transparent",
                color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>Rechazar pedido</button>
            </div>
          ))}
        </div>
      )}

      {/* Pedidos activos */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 10 }}>
        En preparación ({pedidosActivos.length})
      </div>

      {pedidosActivos.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--c-muted)", fontSize: 13 }}>
          No hay pedidos en preparación
        </div>
      )}

      {pedidosActivos.map((p) => (
        <div key={p.id} style={{
          background: "var(--c-surface)", borderRadius: 14, padding: "16px",
          border: p.estado === "listo" ? "2px solid #16A34A" : "1px solid var(--c-border)",
          marginBottom: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)" }}>{p.id}</span>
              <EstadoBadge estado={p.estado} />
              <PagoBadge pago={p.pago} />
            </div>
            <span style={{ fontSize: 12, color: "var(--c-muted)" }}>{p.hora}</span>
          </div>

          <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 6 }}>
            {p.items.map(i => `${i.cantidad}x ${i.nombre}`).join(", ")}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 12 }}>
            <span style={{ color: "var(--c-muted)" }}>Cliente: <strong style={{ color: "var(--c-text)" }}>{p.cliente}</strong></span>
            <span style={{ fontWeight: 700, color: "var(--c-text)" }}>{p.total.toFixed(2)} €</span>
          </div>

          {p.estado === "preparando" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--c-border)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  background: (p.aceptadoHace / p.minutosPrep) > 0.8 ? "#EF4444" : "var(--c-primary)",
                  width: `${Math.min((p.aceptadoHace / p.minutosPrep) * 100, 100)}%`,
                  transition: "width 0.3s",
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-muted)" }}>
                {p.minutosPrep - p.aceptadoHace} min
              </span>
            </div>
          )}

          {p.estado === "preparando" && (
            <button onClick={() => marcarListo(p.id)} style={{
              width: "100%", padding: "11px 0", borderRadius: 10, border: "none",
              background: "#16A34A", color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>Pedido listo para recoger</button>
          )}

          {p.estado === "listo" && (
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{
                flex: 1, padding: "10px 0", borderRadius: 10, background: "#DCFCE7",
                textAlign: "center", fontSize: 12, fontWeight: 700, color: "#166534",
              }}>Esperando al repartidor</div>
              <button onClick={() => marcarRecogido(p.id)} style={{
                padding: "10px 16px", borderRadius: 10, border: "none",
                background: "var(--c-primary)", color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>Recogido</button>
            </div>
          )}
        </div>
      ))}

      {pedidosEntrantes.length === 0 && pedidosActivos.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--c-muted)", fontSize: 13 }}>
          Esperando nuevos pedidos...
        </div>
      )}
    </div>
  );
}

function Carta() {
  const [productos, setProductos] = useState(PRODUCTOS);
  const [catFiltro, setCatFiltro] = useState(null);
  const [editando, setEditando] = useState(null);
  const [gestionExtras, setGestionExtras] = useState(false);

  const toggleDisponible = (id) => {
    setProductos(prev => prev.map(p => p.id === id ? { ...p, disponible: !p.disponible } : p));
  };

  const filtrados = catFiltro ? productos.filter(p => p.catId === catFiltro) : productos;

  if (gestionExtras) {
    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <button onClick={() => setGestionExtras(false)} style={{
          background: "none", border: "none", color: "var(--c-primary)", fontSize: 14,
          fontWeight: 600, cursor: "pointer", marginBottom: 16, padding: 0, fontFamily: "inherit",
        }}>← Volver a carta</button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: 0 }}>Grupos de extras</h2>
          <button style={{
            padding: "8px 14px", borderRadius: 10, border: "none",
            background: "var(--c-primary)", color: "#fff", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>+ Nuevo grupo</button>
        </div>

        {GRUPOS_EXTRAS.map(g => (
          <div key={g.id} style={{
            background: "var(--c-surface)", borderRadius: 14, padding: "16px",
            border: "1px solid var(--c-border)", marginBottom: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)" }}>{g.nombre}</div>
                <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 2 }}>
                  {g.tipo === "multiple" ? `Múltiple · máx. ${g.max}` : "Selección única"}
                </div>
              </div>
              <button style={{
                padding: "6px 10px", borderRadius: 8, border: "1px solid var(--c-border)",
                background: "var(--c-surface)", fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", color: "var(--c-muted)",
              }}>Editar</button>
            </div>
            {g.opciones.map((op, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", padding: "8px 0",
                borderTop: "1px solid var(--c-border)", fontSize: 13,
              }}>
                <span style={{ color: "var(--c-text)" }}>{op.nombre}</span>
                <span style={{ fontWeight: 700, color: "var(--c-primary)" }}>+{op.precio.toFixed(2)} €</span>
              </div>
            ))}
            <button style={{
              width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 8,
              border: "1px dashed var(--c-border)", background: "transparent",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              color: "var(--c-muted)",
            }}>+ Añadir opción</button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: 0 }}>Mi carta</h2>
        <button style={{
          padding: "8px 16px", borderRadius: 10, border: "none",
          background: "var(--c-primary)", color: "#fff", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>+ Añadir producto</button>
      </div>

      {/* Botón gestión extras */}
      <button onClick={() => setGestionExtras(true)} style={{
        width: "100%", padding: "10px 0", borderRadius: 10,
        border: "1px solid var(--c-border)", background: "var(--c-surface)",
        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        color: "var(--c-primary)", marginBottom: 16, display: "flex",
        alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        Gestionar grupos de extras ({GRUPOS_EXTRAS.length})
      </button>

      {/* Categorías */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
        <button onClick={() => setCatFiltro(null)} style={{
          padding: "7px 14px", borderRadius: 50, border: "none",
          background: !catFiltro ? "var(--c-primary)" : "var(--c-surface2)",
          color: !catFiltro ? "#fff" : "var(--c-text)",
          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>Todos</button>
        {CATEGORIAS.map(c => (
          <button key={c.id} onClick={() => setCatFiltro(c.id)} style={{
            padding: "7px 14px", borderRadius: 50, border: "none",
            background: catFiltro === c.id ? "var(--c-primary)" : "var(--c-surface2)",
            color: catFiltro === c.id ? "#fff" : "var(--c-text)",
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            opacity: c.activa ? 1 : 0.5,
          }}>{c.nombre}</button>
        ))}
      </div>

      {/* Productos */}
      {filtrados.map(p => {
        const gruposAsignados = GRUPOS_EXTRAS.filter(g => p.extras.includes(g.id));
        return (
          <div key={p.id} style={{
            background: "var(--c-surface)", borderRadius: 12, padding: "14px 16px",
            border: "1px solid var(--c-border)", marginBottom: 10,
            opacity: p.disponible ? 1 : 0.5, transition: "opacity 0.2s",
          }}>
            <div style={{ display: "flex", gap: 12 }}>
              {/* Imagen del producto */}
              <div style={{
                width: 70, height: 70, borderRadius: 10, background: "var(--c-surface2)",
                border: "1px dashed var(--c-border)", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
                overflow: "hidden",
              }}>
                {p.imagen ? (
                  <img src={p.imagen} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <>
                    <span style={{ fontSize: 20 }}>📷</span>
                    <span style={{ fontSize: 8, color: "var(--c-muted)", fontWeight: 600, marginTop: 2 }}>Subir foto</span>
                  </>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)", marginBottom: 2 }}>{p.nombre}</div>
                    <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 4 }}>{p.desc}</div>
                  </div>
                  <button onClick={() => toggleDisponible(p.id)} style={{
                    width: 44, height: 24, borderRadius: 12, border: "none",
                    background: p.disponible ? "#16A34A" : "#D1D5DB",
                    cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}>
                    <span style={{
                      position: "absolute", top: 2, left: p.disponible ? 22 : 2,
                      width: 20, height: 20, borderRadius: 10, background: "#fff",
                      transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }} />
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: "var(--c-primary)" }}>
                    {p.tamanos.length > 0 ? `Desde ${p.precio.toFixed(2)} €` : `${p.precio.toFixed(2)} €`}
                  </span>
                  {p.tamanos.length > 0 && (
                    <span style={{ fontSize: 10, color: "var(--c-muted)", background: "var(--c-surface2)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                      {p.tamanos.length} tamaños
                    </span>
                  )}
                  {gruposAsignados.length > 0 && (
                    <span style={{ fontSize: 10, color: "#6B21A8", background: "#F3E8FF", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                      {gruposAsignados.length} extra{gruposAsignados.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Botón editar */}
            <button onClick={() => setEditando(editando === p.id ? null : p.id)} style={{
              width: "100%", marginTop: 10, padding: "8px 0", borderRadius: 8,
              border: "1px solid var(--c-border)", background: "var(--c-surface)",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              color: "var(--c-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              {editando === p.id ? "Cerrar edición" : "Editar producto"}
              <span style={{ fontSize: 10, transform: editando === p.id ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
            </button>

            {/* Panel de edición expandido */}
            {editando === p.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--c-border)", animation: "fadeIn 0.2s ease" }}>

                {/* Imagen */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>Imagen del producto</div>
                  <div style={{
                    width: "100%", height: 120, borderRadius: 12, background: "var(--c-surface2)",
                    border: "2px dashed var(--c-border)", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}>
                    <span style={{ fontSize: 28, marginBottom: 4 }}>📷</span>
                    <span style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 600 }}>Toca para subir imagen</span>
                    <span style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 4 }}>800 × 600 px · JPG o PNG · Máx. 3 MB</span>
                  </div>
                </div>

                {/* Tamaños */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>Tamaños y precios</div>
                  {p.tamanos.length > 0 ? (
                    p.tamanos.map((t, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 12px", background: "var(--c-surface2)", borderRadius: 8, marginBottom: 6,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>{t.nombre}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "var(--c-primary)" }}>{t.precio.toFixed(2)} €</span>
                          <button style={{
                            padding: "4px 8px", borderRadius: 6, border: "1px solid var(--c-border)",
                            background: "var(--c-surface)", fontSize: 10, cursor: "pointer", fontFamily: "inherit", color: "var(--c-muted)",
                          }}>Editar</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--c-muted)", padding: "8px 0" }}>Sin tamaños configurados (precio único)</div>
                  )}
                  <button style={{
                    width: "100%", padding: "8px 0", borderRadius: 8,
                    border: "1px dashed var(--c-border)", background: "transparent",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    color: "var(--c-muted)", marginTop: 4,
                  }}>+ Añadir tamaño</button>
                </div>

                {/* Extras asignados */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>Grupos de extras</div>
                  {gruposAsignados.length > 0 ? (
                    gruposAsignados.map(g => (
                      <div key={g.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 12px", background: "#F3E8FF", borderRadius: 8, marginBottom: 6,
                      }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#6B21A8" }}>{g.nombre}</span>
                          <span style={{ fontSize: 10, color: "#7C3AED", marginLeft: 6 }}>{g.opciones.length} opciones</span>
                        </div>
                        <button style={{
                          padding: "4px 8px", borderRadius: 6, border: "1px solid #E9D5FF",
                          background: "var(--c-surface)", fontSize: 10, cursor: "pointer", fontFamily: "inherit", color: "#991B1B",
                        }}>Quitar</button>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--c-muted)", padding: "8px 0" }}>Sin extras asignados</div>
                  )}
                  <button style={{
                    width: "100%", padding: "8px 0", borderRadius: 8,
                    border: "1px dashed #E9D5FF", background: "transparent",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    color: "#6B21A8", marginTop: 4,
                  }}>+ Asignar grupo de extras</button>
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                    background: "var(--c-primary)", color: "#fff", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>Guardar cambios</button>
                  <button style={{
                    padding: "10px 14px", borderRadius: 8, border: "1px solid #FEE2E2",
                    background: "#FEF2F2", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", color: "#991B1B",
                  }}>Eliminar</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GestionSocios() {
  const [socios, setSocios] = useState(SOCIOS);
  const [detalleSocio, setDetalleSocio] = useState(null);
  const [vistaDetalle, setVistaDetalle] = useState("info");
  const [chatInput, setChatInput] = useState("");
  const [chatMensajes, setChatMensajes] = useState({});

  const cambiarEstado = (id, nuevoEstado) => {
    setSocios(prev => prev.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s));
  };

  const enviarMensaje = (socioId) => {
    if (!chatInput.trim()) return;
    const hora = new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    setChatMensajes(prev => ({
      ...prev,
      [socioId]: [...(prev[socioId] || detalleSocio.mensajes || []), { de: "restaurante", texto: chatInput, hora }],
    }));
    setChatInput("");
  };

  // Vista detalle de un socio
  if (detalleSocio) {
    const msgs = chatMensajes[detalleSocio.id] || detalleSocio.mensajes || [];
    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <button onClick={() => { setDetalleSocio(null); setVistaDetalle("info"); }} style={{
          background: "none", border: "none", color: "var(--c-primary)", fontSize: 14,
          fontWeight: 600, cursor: "pointer", marginBottom: 16, padding: 0, fontFamily: "inherit",
        }}>← Volver a socios</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛵</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--c-text)" }}>{detalleSocio.nombre}</div>
            <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{detalleSocio.pedidos} pedidos · ★ {detalleSocio.rating}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "var(--c-surface2)", borderRadius: 10, padding: 3, marginBottom: 20 }}>
          {[
            { id: "info", label: "Info" },
            { id: "facturas", label: "Facturas" },
            { id: "chat", label: "Chat" },
          ].map(t => (
            <button key={t.id} onClick={() => setVistaDetalle(t.id)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
              background: vistaDetalle === t.id ? "var(--c-primary)" : "transparent",
              color: vistaDetalle === t.id ? "#fff" : "var(--c-muted)",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>{t.label}</button>
          ))}
        </div>

        {vistaDetalle === "info" && (
          <div>
            <div style={{ background: "var(--c-surface)", borderRadius: 14, padding: "16px", border: "1px solid var(--c-border)" }}>
              {[
                { label: "Total pedidos", value: detalleSocio.pedidos },
                { label: "Rating", value: `★ ${detalleSocio.rating}` },
                { label: "Estado", value: detalleSocio.estado },
                { label: "Facturas pendientes", value: detalleSocio.facturas.filter(f => f.estado === "pendiente").length },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--c-border)" : "none" }}>
                  <span style={{ fontSize: 13, color: "var(--c-muted)" }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>{item.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => cambiarEstado(detalleSocio.id, "rechazado")} style={{
              width: "100%", marginTop: 16, padding: "12px 0", borderRadius: 10,
              border: "1px solid #FEE2E2", background: "#FEF2F2", fontSize: 13,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: "#991B1B",
            }}>Desvincular socio</button>
          </div>
        )}

        {vistaDetalle === "facturas" && (
          <div>
            {detalleSocio.facturas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--c-muted)", fontSize: 13 }}>
                No hay facturas todavía
              </div>
            ) : (
              detalleSocio.facturas.map((f, i) => (
                <div key={i} style={{
                  background: "var(--c-surface)", borderRadius: 12, padding: "14px 16px",
                  border: "1px solid var(--c-border)", marginBottom: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)" }}>Semana {f.semana}</span>
                    <span style={{
                      background: f.estado === "pagado" ? "#DCFCE7" : "#FEF3C7",
                      color: f.estado === "pagado" ? "#166534" : "#92400E",
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                    }}>{f.estado === "pagado" ? "Pagado" : "Pendiente"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--c-muted)" }}>
                    <span>{f.pedidos} pedidos</span>
                    <span>Ventas: {f.total.toFixed(2)} €</span>
                    <span style={{ color: "var(--c-primary)", fontWeight: 700 }}>Comisión: {f.comision.toFixed(2)} €</span>
                  </div>
                  {f.estado === "pendiente" && (
                    <button style={{
                      width: "100%", marginTop: 10, padding: "8px 0", borderRadius: 8,
                      border: "none", background: "#16A34A", color: "#fff",
                      fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}>Marcar como pagado</button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {vistaDetalle === "chat" && (
          <div>
            <div style={{
              background: "var(--c-surface)", borderRadius: 14, padding: "16px",
              border: "1px solid var(--c-border)", minHeight: 200, maxHeight: 300,
              overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12,
            }}>
              {msgs.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--c-muted)", fontSize: 13 }}>
                  Inicia una conversación con {detalleSocio.nombre}
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} style={{ alignSelf: m.de === "restaurante" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                  <div style={{
                    background: m.de === "restaurante" ? "var(--c-primary)" : "var(--c-surface2)",
                    color: m.de === "restaurante" ? "#fff" : "var(--c-text)",
                    borderRadius: 12, borderBottomRightRadius: m.de === "restaurante" ? 4 : 12,
                    borderBottomLeftRadius: m.de === "restaurante" ? 12 : 4,
                    padding: "8px 12px", fontSize: 13,
                  }}>{m.texto}</div>
                  <div style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 3, textAlign: m.de === "restaurante" ? "right" : "left" }}>{m.hora}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && enviarMensaje(detalleSocio.id)}
                placeholder="Escribe un mensaje..."
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--c-border)",
                  fontSize: 13, fontFamily: "inherit", background: "var(--c-surface)", color: "var(--c-text)", outline: "none",
                }} />
              <button onClick={() => enviarMensaje(detalleSocio.id)} style={{
                width: 40, height: 40, borderRadius: 10, border: "none", background: "var(--c-primary)",
                color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 8px" }}>Socios repartidores</h2>
      <p style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 20 }}>Gestiona qué socios pueden repartir tus pedidos.</p>

      {socios.filter(s => s.estado === "pendiente").length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: "#F59E0B" }} />
            Solicitudes pendientes
          </div>
          {socios.filter(s => s.estado === "pendiente").map(s => (
            <div key={s.id} style={{ background: "#FFFBEB", borderRadius: 14, padding: "16px", border: "1px solid #FED7AA", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛵</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)" }}>{s.nombre}</div>
                  <div style={{ fontSize: 11, color: "var(--c-muted)" }}>Rating: ★ {s.rating}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => cambiarEstado(s.id, "aceptado")} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#16A34A",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>Aceptar</button>
                <button onClick={() => cambiarEstado(s.id, "rechazado")} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid var(--c-border)",
                  background: "var(--c-surface)", color: "#991B1B", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 10 }}>Socios activos</div>
      {socios.filter(s => s.estado === "aceptado").map(s => (
        <div key={s.id} onClick={() => setDetalleSocio(s)} style={{
          background: "var(--c-surface)", borderRadius: 12, padding: "14px 16px",
          border: "1px solid var(--c-border)", marginBottom: 8, cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛵</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)" }}>{s.nombre}</div>
              <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{s.pedidos} pedidos · ★ {s.rating}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {s.facturas.filter(f => f.estado === "pendiente").length > 0 && (
              <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 6 }}>
                {s.facturas.filter(f => f.estado === "pendiente").length} fact.
              </span>
            )}
            <span style={{ color: "var(--c-muted)", fontSize: 16 }}>›</span>
          </div>
        </div>
      ))}

      {socios.filter(s => s.estado === "rechazado").length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-muted)", margin: "20px 0 10px" }}>Rechazados</div>
          {socios.filter(s => s.estado === "rechazado").map(s => (
            <div key={s.id} style={{
              background: "var(--c-surface)", borderRadius: 12, padding: "14px 16px",
              border: "1px solid var(--c-border)", marginBottom: 8, opacity: 0.6,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--c-surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛵</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)" }}>{s.nombre}</div>
                  <div style={{ fontSize: 11, color: "var(--c-muted)" }}>★ {s.rating}</div>
                </div>
              </div>
              <button onClick={() => cambiarEstado(s.id, "aceptado")} style={{
                padding: "6px 12px", borderRadius: 8, border: "1px solid var(--c-border)",
                background: "var(--c-surface)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--c-text)",
              }}>Reactivar</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function Historial() {
  const [filtro, setFiltro] = useState("todos");
  const pedidos = filtro === "todos" ? HISTORIAL_PEDIDOS : HISTORIAL_PEDIDOS.filter(p => p.estado === filtro);
  let fechaActual = "";

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 16px" }}>Historial de pedidos</h2>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
        {["todos", "entregado", "cancelado"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "7px 14px", borderRadius: 50, border: "none",
            background: filtro === f ? "var(--c-primary)" : "var(--c-surface2)",
            color: filtro === f ? "#fff" : "var(--c-text)",
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
          }}>{f}</button>
        ))}
      </div>

      {pedidos.map((p, i) => {
        const mostrarFecha = p.fecha !== fechaActual;
        fechaActual = p.fecha;
        return (
          <div key={p.id}>
            {mostrarFecha && (
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-muted)", margin: "16px 0 8px", textTransform: "uppercase" }}>
                {p.fecha}
              </div>
            )}
            <div style={{
              background: "var(--c-surface)", borderRadius: 12, padding: "14px 16px",
              border: "1px solid var(--c-border)", marginBottom: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)" }}>{p.id}</span>
                  <EstadoBadge estado={p.estado} />
                  <PagoBadge pago={p.pago} />
                </div>
                <span style={{ fontSize: 12, color: "var(--c-muted)" }}>{p.hora}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--c-muted)" }}>
                <span>{p.cliente}</span>
                <span style={{ fontWeight: 700, color: "var(--c-text)" }}>{p.total.toFixed(2)} €</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 4 }}>
                <CanalBadge canal={p.canal} socio={p.socio} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Dashboard() {
  const s = STATS;
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 16px" }}>Dashboard</h2>

      {/* Ventas hoy */}
      <div style={{
        background: "linear-gradient(135deg, var(--c-primary), #D94420)", borderRadius: 16,
        padding: "18px 20px", marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Ventas hoy</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>{s.ventasHoy.toFixed(2)} €</div>
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
          <span>💳 Tarjeta: {s.ventasTarjeta.toFixed(2)} €</span>
          <span>💵 Efectivo: {s.ventasEfectivo.toFixed(2)} €</span>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <StatCard label="Pedidos hoy" value={s.pedidosHoy} sub={`💳 ${s.pedidosTarjeta} · 💵 ${s.pedidosEfectivo}`} />
        <StatCard label="Ticket medio" value={`${s.ticketMedio.toFixed(2)} €`} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <StatCard label="Tiempo medio prep." value={`${s.tiempoMedioPrep} min`} />
        <StatCard label="Cancelados" value={s.pedidosCancelados} />
      </div>

      <div style={{
        background: "var(--c-surface)", borderRadius: 14, padding: "16px",
        border: "1px solid var(--c-border)", marginTop: 16,
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)", marginBottom: 8 }}>Esta semana</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--c-muted)", marginBottom: 4 }}>
          <span>Pedidos</span><strong style={{ color: "var(--c-text)" }}>{s.pedidosSemana}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--c-muted)" }}>
          <span>Ventas</span><strong style={{ color: "var(--c-text)" }}>{s.ventasSemana.toFixed(2)} €</strong>
        </div>
      </div>
    </div>
  );
}

function Configuracion() {
  const [activo, setActivo] = useState(RESTAURANTE.activo);

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 20px" }}>Configuración</h2>

      <div style={{
        background: activo ? "#DCFCE7" : "#FEE2E2", borderRadius: 14,
        padding: "16px 18px", marginBottom: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: activo ? "#166534" : "#991B1B" }}>
            {activo ? "Restaurante abierto" : "Restaurante cerrado"}
          </div>
          <div style={{ fontSize: 12, color: activo ? "#15803D" : "#B91C1C", marginTop: 2 }}>
            {activo ? "Estás recibiendo pedidos" : "No recibirás pedidos"}
          </div>
        </div>
        <button onClick={() => setActivo(!activo)} style={{
          width: 52, height: 28, borderRadius: 14, border: "none",
          background: activo ? "#16A34A" : "#D1D5DB",
          cursor: "pointer", position: "relative", transition: "background 0.2s",
        }}>
          <span style={{
            position: "absolute", top: 3, left: activo ? 27 : 3,
            width: 22, height: 22, borderRadius: 11, background: "#fff",
            transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }} />
        </button>
      </div>

      <div style={{
        background: "var(--c-surface)", borderRadius: 14, padding: "18px",
        border: "1px solid var(--c-border)", marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", marginBottom: 16 }}>Información</h3>
        {[
          { label: "Nombre", value: RESTAURANTE.nombre },
          { label: "Dirección", value: RESTAURANTE.direccion },
          { label: "Teléfono", value: RESTAURANTE.telefono },
          { label: "Email", value: RESTAURANTE.email },
          { label: "Horario", value: RESTAURANTE.horario },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: i < 4 ? "1px solid var(--c-border)" : "none",
          }}>
            <span style={{ fontSize: 13, color: "var(--c-muted)" }}>{item.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", maxWidth: "55%", textAlign: "right" }}>{item.value}</span>
          </div>
        ))}
        <button style={{
          width: "100%", marginTop: 14, padding: "10px 0", borderRadius: 10,
          border: "1px solid var(--c-border)", background: "var(--c-surface)",
          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--c-primary)",
        }}>Editar información</button>
      </div>

      <div style={{
        background: "var(--c-surface)", borderRadius: 14, padding: "18px",
        border: "1px solid var(--c-border)",
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", marginBottom: 14 }}>Gestión de categorías</h3>
        {CATEGORIAS.map((c, i) => (
          <div key={c.id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: i < CATEGORIAS.length - 1 ? "1px solid var(--c-border)" : "none",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", opacity: c.activa ? 1 : 0.5 }}>{c.nombre}</span>
            <button style={{
              width: 44, height: 24, borderRadius: 12, border: "none",
              background: c.activa ? "#16A34A" : "#D1D5DB",
              cursor: "pointer", position: "relative",
            }}>
              <span style={{
                position: "absolute", top: 2, left: c.activa ? 22 : 2,
                width: 20, height: 20, borderRadius: 10, background: "#fff",
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>
        ))}
        <button style={{
          width: "100%", marginTop: 14, padding: "10px 0", borderRadius: 10,
          border: "1px solid var(--c-border)", background: "var(--c-surface)",
          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--c-primary)",
        }}>+ Añadir categoría</button>
      </div>
    </div>
  );
}

// --- APP PRINCIPAL ---

export default function PanelRestaurante() {
  const [seccion, setSeccion] = useState("pedidos");
  const [pedidosEntrantes, setPedidosEntrantes] = useState(PEDIDOS_ENTRANTES);
  const [pedidosActivos, setPedidosActivos] = useState(PEDIDOS_ACTIVOS_INIT);

  const totalNuevos = pedidosEntrantes.length;

  const nav = [
    { id: "pedidos", label: "Pedidos", icon: <IconPedidos />, badge: totalNuevos },
    { id: "historial", label: "Historial", icon: <IconDashboard /> },
    { id: "carta", label: "Carta", icon: <IconCarta /> },
    { id: "socios", label: "Socios", icon: <IconSocios />, badge: SOCIOS.filter(s => s.estado === "pendiente").length },
    { id: "config", label: "Ajustes", icon: <IconConfig /> },
  ];

  return (
    <div style={{
      "--c-primary": "#B91C1C", "--c-primary-light": "#FEF2F2",
      "--c-bg": "#FAFAF8", "--c-surface": "#FFFFFF", "--c-surface2": "#F3F2EF",
      "--c-border": "#E8E6E1", "--c-text": "#1A1A18", "--c-muted": "#8C8A85",
      fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, sans-serif",
      maxWidth: 420, margin: "0 auto", minHeight: "100vh",
      background: "var(--c-bg)", color: "var(--c-text)", position: "relative",
      paddingBottom: 80,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, background: "#FEE2E2",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>🍕</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)" }}>{RESTAURANTE.nombre}</div>
            <div style={{ fontSize: 11, color: "#16A34A", fontWeight: 600 }}>Abierto · {RESTAURANTE.horario}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setSeccion("dashboard")} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
            borderRadius: 10, border: "none",
            background: seccion === "dashboard" ? "var(--c-primary)" : "var(--c-surface2)",
            fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            color: seccion === "dashboard" ? "#fff" : "var(--c-muted)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
            </svg>
            Métricas
          </button>
          <div style={{
            width: 10, height: 10, borderRadius: 5,
            background: RESTAURANTE.activo ? "#16A34A" : "#D1D5DB",
            boxShadow: RESTAURANTE.activo ? "0 0 6px rgba(22,163,74,0.5)" : "none",
          }} />
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: "20px", animation: "fadeIn 0.3s ease" }}>
        {seccion === "pedidos" && (
          <PedidosEnVivo
            pedidosEntrantes={pedidosEntrantes}
            setPedidosEntrantes={setPedidosEntrantes}
            pedidosActivos={pedidosActivos}
            setPedidosActivos={setPedidosActivos}
          />
        )}
        {seccion === "carta" && <Carta />}
        {seccion === "socios" && <GestionSocios />}
        {seccion === "historial" && <Historial />}
        {seccion === "dashboard" && <Dashboard />}
        {seccion === "config" && <Configuracion />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 420, background: "var(--c-surface)",
        borderTop: "1px solid var(--c-border)", display: "flex",
        justifyContent: "space-around", padding: "8px 0 12px", zIndex: 50,
      }}>
        {nav.map((n) => (
          <button key={n.id} onClick={() => setSeccion(n.id)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
            color: seccion === n.id ? "var(--c-primary)" : "var(--c-muted)",
            fontSize: 10, fontWeight: 600, padding: "4px 8px",
            transition: "color 0.2s", position: "relative",
          }}>
            {n.icon}
            {n.label}
            {n.badge > 0 && (
              <span style={{
                position: "absolute", top: -2, right: 0,
                width: 16, height: 16, borderRadius: 8,
                background: "var(--c-primary)", color: "#fff",
                fontSize: 9, fontWeight: 800, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>{n.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

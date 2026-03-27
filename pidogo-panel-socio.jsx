import { useState } from "react";

// --- DATOS MOCK ---
const SOCIO = {
  nombre: "Juan Pérez García",
  nombreComercial: "Juanito Express",
  slug: "juanito-express",
  email: "juanito@email.com",
  telefono: "+34 612 345 678",
  modoEntrega: "ambos",
  radioKm: 10,
  activo: true,
  enServicio: true,
  rating: 4.7,
  totalResenas: 128,
  redes: {
    instagram: "juanito.express",
    tiktok: "juanitoexpress",
    whatsapp: "+34612345678",
  },
};

const STATS = {
  pedidosHoy: 12,
  pedidosSemana: 67,
  pedidosMes: 248,
  ventasHoy: 342.50,
  ventasSemana: 1890.00,
  ventasMes: 7420.00,
  comisionesHoy: 34.25,
  comisionesSemana: 189.00,
  comisionesMes: 742.00,
  enviosHoy: 24.00,
  enviosSemana: 134.00,
  enviosMes: 496.00,
  propinasHoy: 8.50,
  propinasSemana: 45.00,
  propinasMes: 178.00,
  clientesUnicos: 89,
  pedidosCancelados: 3,
  pedidosFallidos: 1,
  tasaEntrega: 98.4,
};

const RESTAURANTES_DISPONIBLES = [
  { id: 1, nombre: "Pizzería Don Mario", estado: "aceptado", pedidos: 45, comisiones: 123.50, emoji: "🍕", color: "#FEE2E2" },
  { id: 2, nombre: "Burger Factory", estado: "aceptado", pedidos: 38, comisiones: 98.20, emoji: "🍔", color: "#FEF3C7" },
  { id: 3, nombre: "Sushi Zen", estado: "aceptado", pedidos: 52, comisiones: 210.00, emoji: "🍣", color: "#DBEAFE" },
  { id: 4, nombre: "Dulce Tentación", estado: "pendiente", pedidos: 0, comisiones: 0, emoji: "🍰", color: "#FCE7F3" },
  { id: 5, nombre: "La Ricarepa", estado: "aceptado", pedidos: 28, comisiones: 78.30, emoji: "🫓", color: "#FEF9C3" },
  { id: 6, nombre: "Taco Loco", estado: "rechazado", pedidos: 0, comisiones: 0, emoji: "🌮", color: "#DCFCE7" },
  { id: 7, nombre: "Wok & Roll", estado: null, pedidos: 0, comisiones: 0, emoji: "🥡", color: "#F3E8FF" },
  { id: 8, nombre: "Café Central", estado: null, pedidos: 0, comisiones: 0, emoji: "☕", color: "#FDE68A" },
];

const PEDIDOS_RECIENTES = [
  { id: "PD-1247", restaurante: "Sushi Zen", cliente: "María García", direccionCliente: "C/ La Noria 15, 3ºA", telCliente: "+34 611 222 333", total: 28.90, comision: 2.89, envio: 3.00, propina: 2.00, estado: "entregado", hora: "14:32", fecha: "Hoy", pago: "tarjeta" },
  { id: "PD-1246", restaurante: "Burger Factory", cliente: "Carlos Pérez", direccionCliente: "Av. Anaga 12, 1ºB", telCliente: "+34 622 333 444", total: 19.40, comision: 1.94, envio: 1.99, propina: 0, estado: "entregado", hora: "13:58", fecha: "Hoy", pago: "efectivo" },
  { id: "PD-1245", restaurante: "Pizzería Don Mario", cliente: "Ana Ruiz", direccionCliente: "C/ Méndez Núñez 8", telCliente: "+34 633 444 555", total: 23.00, comision: 2.30, envio: 2.50, propina: 1.50, estado: "entregado", hora: "13:15", fecha: "Hoy", pago: "tarjeta" },
  { id: "PD-1244", restaurante: "La Ricarepa", cliente: "Javier López", direccionCliente: "C/ Bethencourt 30", telCliente: "+34 644 555 666", total: 15.50, comision: 1.55, envio: 2.00, propina: 0, estado: "cancelado", hora: "12:40", fecha: "Hoy", pago: "efectivo" },
  { id: "PD-1243", restaurante: "Sushi Zen", cliente: "Laura Martín", direccionCliente: "Plaza Weyler 5, 2ºC", telCliente: "+34 655 666 777", total: 32.00, comision: 3.20, envio: 3.00, propina: 3.00, estado: "entregado", hora: "12:10", fecha: "Hoy", pago: "tarjeta" },
  { id: "PD-1242", restaurante: "Dulce Tentación", cliente: "Pedro Sánchez", direccionCliente: "C/ San José 18", telCliente: "+34 666 777 888", total: 11.50, comision: 1.15, envio: 1.50, propina: 0.50, estado: "fallido", hora: "11:30", fecha: "Hoy", pago: "tarjeta" },
];

const INFORME_SEMANAL = {
  semana: "17 - 23 Mar 2026",
  resumen: {
    totalPedidos: 67,
    entregados: 63,
    cancelados: 3,
    fallidos: 1,
    totalVentas: 1890.00,
    totalComisiones: 189.00,
    totalEnvios: 134.00,
    totalPropinas: 45.00,
    totalGanado: 368.00,
  },
  porRestaurante: [
    { nombre: "Sushi Zen", pedidos: 22, ventas: 654.00, comision: 65.40, envios: 66.00, propinas: 18.00 },
    { nombre: "Pizzería Don Mario", pedidos: 18, ventas: 478.00, comision: 47.80, envios: 45.00, propinas: 12.00 },
    { nombre: "Burger Factory", pedidos: 15, ventas: 412.00, comision: 41.20, envios: 29.85, propinas: 8.00 },
    { nombre: "La Ricarepa", pedidos: 12, ventas: 346.00, comision: 34.60, envios: 24.00, propinas: 7.00 },
  ],
};

// --- ICONOS SVG ---
function IconEnVivo() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>;
}
function IconDashboard() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconPedidos() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 14l2 2 4-4"/></svg>;
}
function IconRestaurantes() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>;
}
function IconFacturas() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}
function IconPerfil() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

// --- COMPONENTES ---

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: accent ? "var(--c-accent)" : "var(--c-surface)",
      borderRadius: 14, padding: "16px 18px",
      border: accent ? "none" : "1px solid var(--c-border)",
      flex: "1 1 140px", minWidth: 140,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: accent ? "rgba(255,255,255,0.7)" : "var(--c-muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent ? "#fff" : "var(--c-text)", letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: accent ? "rgba(255,255,255,0.5)" : "var(--c-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const config = {
    aceptado: { bg: "#DCFCE7", color: "#166534", label: "Aceptado" },
    pendiente: { bg: "#FEF3C7", color: "#92400E", label: "Pendiente" },
    rechazado: { bg: "#FEE2E2", color: "#991B1B", label: "Rechazado" },
    entregado: { bg: "#DCFCE7", color: "#166534", label: "Entregado" },
    cancelado: { bg: "#FEE2E2", color: "#991B1B", label: "Cancelado" },
    fallido: { bg: "#FEF3C7", color: "#92400E", label: "Fallido" },
  };
  const c = config[estado] || { bg: "#F3F2EF", color: "#8C8A85", label: estado };
  return (
    <span style={{
      background: c.bg, color: c.color, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 6,
    }}>{c.label}</span>
  );
}

function PagoBadge({ pago }) {
  const isTarjeta = pago === "tarjeta";
  return (
    <span style={{
      background: isTarjeta ? "#DBEAFE" : "#DCFCE7",
      color: isTarjeta ? "#1E40AF" : "#166534",
      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
      display: "inline-flex", alignItems: "center", gap: 3,
    }}>
      {isTarjeta ? "💳" : "💵"} {isTarjeta ? "Tarjeta" : "Efectivo"}
    </span>
  );
}

// --- SECCIONES ---

function Dashboard() {
  const [periodo, setPeriodo] = useState("semana");
  const s = STATS;
  const ventas = periodo === "hoy" ? s.ventasHoy : periodo === "semana" ? s.ventasSemana : s.ventasMes;
  const pedidos = periodo === "hoy" ? s.pedidosHoy : periodo === "semana" ? s.pedidosSemana : s.pedidosMes;
  const comisiones = periodo === "hoy" ? s.comisionesHoy : periodo === "semana" ? s.comisionesSemana : s.comisionesMes;
  const envios = periodo === "hoy" ? s.enviosHoy : periodo === "semana" ? s.enviosSemana : s.enviosMes;
  const propinas = periodo === "hoy" ? s.propinasHoy : periodo === "semana" ? s.propinasSemana : s.propinasMes;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: 0 }}>Dashboard</h2>
        <div style={{ display: "flex", gap: 4, background: "var(--c-surface2)", borderRadius: 10, padding: 3 }}>
          {["hoy", "semana", "mes"].map((p) => (
            <button key={p} onClick={() => setPeriodo(p)} style={{
              padding: "6px 14px", borderRadius: 8, border: "none",
              background: periodo === p ? "var(--c-accent)" : "transparent",
              color: periodo === p ? "#fff" : "var(--c-muted)",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              textTransform: "capitalize",
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Total ganado destacado */}
      <div style={{
        background: "linear-gradient(135deg, #FF5733 0%, #FF8F73 100%)",
        borderRadius: 16, padding: "20px 22px", marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Total ganado</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>
          {(comisiones + envios + propinas).toFixed(2)} €
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
          <span>Comisiones: {comisiones.toFixed(2)} €</span>
          <span>Envíos: {envios.toFixed(2)} €</span>
          <span>Propinas: {propinas.toFixed(2)} €</span>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard label="Pedidos" value={pedidos} sub={`${s.pedidosCancelados} cancelados`} />
        <StatCard label="Ventas totales" value={`${ventas.toFixed(0)} €`} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard label="Clientes únicos" value={s.clientesUnicos} />
        <StatCard label="Tasa de entrega" value={`${s.tasaEntrega}%`} sub="Objetivo: 95%" />
      </div>

      {/* Últimos pedidos */}
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", margin: "24px 0 14px" }}>Últimos pedidos</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PEDIDOS_RECIENTES.slice(0, 4).map((p) => (
          <div key={p.id} style={{
            background: "var(--c-surface)", borderRadius: 12, padding: "14px 16px",
            border: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)" }}>{p.id}</span>
                <EstadoBadge estado={p.estado} />
                <PagoBadge pago={p.pago} />
              </div>
              <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{p.restaurante} · {p.cliente}</div>
              <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 2 }}>{p.fecha} · {p.hora}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--c-text)" }}>{p.total.toFixed(2)} €</div>
              <div style={{ fontSize: 11, color: "#16A34A", fontWeight: 600 }}>+{(p.comision + p.envio + p.propina).toFixed(2)} €</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pedidos() {
  const [filtro, setFiltro] = useState("todos");
  const pedidos = filtro === "todos" ? PEDIDOS_RECIENTES : PEDIDOS_RECIENTES.filter((p) => p.estado === filtro);

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 20px" }}>Pedidos</h2>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
        {["todos", "entregado", "cancelado", "fallido"].map((f) => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "7px 16px", borderRadius: 50, border: "none",
            background: filtro === f ? "var(--c-accent)" : "var(--c-surface2)",
            color: filtro === f ? "#fff" : "var(--c-text)",
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            textTransform: "capitalize", whiteSpace: "nowrap",
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pedidos.map((p) => (
          <div key={p.id} style={{
            background: "var(--c-surface)", borderRadius: 12, padding: "16px 18px",
            border: "1px solid var(--c-border)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)" }}>{p.id}</span>
                <EstadoBadge estado={p.estado} />
                <PagoBadge pago={p.pago} />
              </div>
              <span style={{ fontSize: 12, color: "var(--c-muted)" }}>{p.hora}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 600, marginBottom: 4 }}>{p.restaurante}</div>
            <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 10 }}>Cliente: {p.cliente}</div>
            <div style={{
              display: "flex", justifyContent: "space-between", paddingTop: 10,
              borderTop: "1px solid var(--c-border)", fontSize: 12, color: "var(--c-muted)",
            }}>
              <span>Total: <strong style={{ color: "var(--c-text)" }}>{p.total.toFixed(2)} €</strong></span>
              <span>Comisión: <strong style={{ color: "#16A34A" }}>{p.comision.toFixed(2)} €</strong></span>
              <span>Envío: <strong style={{ color: "#16A34A" }}>{p.envio.toFixed(2)} €</strong></span>
              {p.propina > 0 && <span>Propina: <strong style={{ color: "#F59E0B" }}>{p.propina.toFixed(2)} €</strong></span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Restaurantes() {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 8px" }}>Establecimientos</h2>
      <p style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 20 }}>Selecciona los establecimientos a los que quieres repartir. Ellos deben aceptar tu solicitud.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {RESTAURANTES_DISPONIBLES.map((r) => (
          <div key={r.id} style={{
            background: "var(--c-surface)", borderRadius: 14, padding: "16px 18px",
            border: "1px solid var(--c-border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: r.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>{r.emoji}</div>
              <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--c-text)" }}>{r.nombre}</span>
                {r.estado && <EstadoBadge estado={r.estado} />}
              </div>
            </div>

            {r.estado === "aceptado" && (
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--c-muted)", marginBottom: 12 }}>
                <span>{r.pedidos} pedidos</span>
                <span>{r.comisiones.toFixed(2)} € en comisiones</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              {!r.estado && (
                <button style={{
                  padding: "8px 18px", borderRadius: 10, border: "none",
                  background: "var(--c-accent)", color: "#fff",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>Solicitar</button>
              )}
              {r.estado === "aceptado" && (
                <>
                  <button style={{
                    padding: "8px 18px", borderRadius: 10,
                    border: "1px solid var(--c-accent)", background: "var(--c-accent-light)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--c-accent)",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    Chat
                  </button>
                  <button style={{
                    padding: "8px 18px", borderRadius: 10,
                    border: "1px solid var(--c-border)", background: "var(--c-surface)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--c-text)",
                  }}>Destacar</button>
                  <button style={{
                    padding: "8px 18px", borderRadius: 10,
                    border: "1px solid #FEE2E2", background: "#FEF2F2",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#991B1B",
                  }}>Desvincular</button>
                </>
              )}
              {r.estado === "pendiente" && (
                <span style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>Esperando aprobación del restaurante...</span>
              )}
              {r.estado === "rechazado" && (
                <button style={{
                  padding: "8px 18px", borderRadius: 10, border: "none",
                  background: "var(--c-surface2)", color: "var(--c-muted)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>Solicitar de nuevo</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Facturas() {
  const [verDetalle, setVerDetalle] = useState(false);
  const inf = INFORME_SEMANAL;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 8px" }}>Informes y facturación</h2>
      <p style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 20 }}>
        Descarga la relación semanal de pedidos para enviar a tus restaurantes.
      </p>

      {/* Informe semanal actual */}
      <div style={{
        background: "var(--c-surface)", borderRadius: 16, padding: "20px",
        border: "1px solid var(--c-border)", marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--c-text)" }}>Semana {inf.semana}</div>
            <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 2 }}>Informe generado automáticamente</div>
          </div>
          <button style={{
            padding: "10px 20px", borderRadius: 12, border: "none",
            background: "var(--c-accent)", color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>Descargar PDF</button>
        </div>

        {/* Resumen */}
        <div style={{
          background: "var(--c-surface2)", borderRadius: 12, padding: "16px",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600 }}>Pedidos totales</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)" }}>{inf.resumen.totalPedidos}</div>
            <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 2 }}>
              {inf.resumen.entregados} entregados · {inf.resumen.cancelados} cancelados · {inf.resumen.fallidos} fallidos
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600 }}>Total ganado</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#16A34A" }}>{inf.resumen.totalGanado.toFixed(2)} €</div>
            <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 2 }}>
              Com: {inf.resumen.totalComisiones.toFixed(0)} € · Env: {inf.resumen.totalEnvios.toFixed(0)} € · Prop: {inf.resumen.totalPropinas.toFixed(0)} €
            </div>
          </div>
        </div>

        {/* Toggle detalle */}
        <button
          onClick={() => setVerDetalle(!verDetalle)}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 10,
            border: "1px solid var(--c-border)", background: "var(--c-surface)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            color: "var(--c-text)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {verDetalle ? "Ocultar detalle" : "Ver detalle por restaurante"}
          <span style={{ fontSize: 10, transform: verDetalle ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
        </button>

        {verDetalle && (
          <div style={{ marginTop: 16, animation: "fadeIn 0.3s ease" }}>
            {inf.porRestaurante.map((r, i) => (
              <div key={i} style={{
                padding: "14px 0",
                borderBottom: i < inf.porRestaurante.length - 1 ? "1px solid var(--c-border)" : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)" }}>{r.nombre}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#16A34A" }}>
                    +{(r.comision + r.envios + r.propinas).toFixed(2)} €
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--c-muted)", flexWrap: "wrap" }}>
                  <span>{r.pedidos} pedidos</span>
                  <span>Ventas: {r.ventas.toFixed(0)} €</span>
                  <span>Comisión: {r.comision.toFixed(2)} €</span>
                  <span>Envíos: {r.envios.toFixed(2)} €</span>
                  <span>Propinas: {r.propinas.toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial */}
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", marginBottom: 14 }}>Historial de informes</h3>
      {[
        { semana: "10 - 16 Mar 2026", pedidos: 58, ganado: 312.00 },
        { semana: "3 - 9 Mar 2026", pedidos: 72, ganado: 398.00 },
        { semana: "24 Feb - 2 Mar 2026", pedidos: 61, ganado: 345.00 },
      ].map((h, i) => (
        <div key={i} style={{
          background: "var(--c-surface)", borderRadius: 12, padding: "14px 18px",
          border: "1px solid var(--c-border)", marginBottom: 10,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--c-text)" }}>{h.semana}</div>
            <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 2 }}>{h.pedidos} pedidos · {h.ganado.toFixed(2)} € ganados</div>
          </div>
          <button style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid var(--c-border)",
            background: "var(--c-surface)", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", color: "var(--c-accent)",
          }}>PDF</button>
        </div>
      ))}
    </div>
  );
}

function Perfil() {
  const [modo, setModo] = useState(SOCIO.modoEntrega);
  const [radio, setRadio] = useState(SOCIO.radioKm);
  const [enServicio, setEnServicio] = useState(SOCIO.enServicio);
  const [redes, setRedes] = useState(SOCIO.redes);
  const [editandoRedes, setEditandoRedes] = useState(false);

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 20px" }}>Mi perfil</h2>

      {/* Estado en servicio */}
      <div style={{
        background: enServicio ? "#DCFCE7" : "#FEF3C7",
        borderRadius: 14, padding: "16px 18px", marginBottom: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: enServicio ? "#166534" : "#92400E" }}>
            {enServicio ? "En servicio" : "Fuera de servicio"}
          </div>
          <div style={{ fontSize: 12, color: enServicio ? "#15803D" : "#A16207", marginTop: 2 }}>
            {enServicio ? "Estás recibiendo pedidos" : "No recibirás pedidos"}
          </div>
        </div>
        <button
          onClick={() => setEnServicio(!enServicio)}
          style={{
            width: 52, height: 28, borderRadius: 14, border: "none",
            background: enServicio ? "#16A34A" : "#D1D5DB",
            cursor: "pointer", position: "relative", transition: "background 0.2s",
          }}
        >
          <span style={{
            position: "absolute", top: 3, left: enServicio ? 27 : 3,
            width: 22, height: 22, borderRadius: 11, background: "#fff",
            transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }} />
        </button>
      </div>

      {/* Info básica */}
      <div style={{
        background: "var(--c-surface)", borderRadius: 14, padding: "18px",
        border: "1px solid var(--c-border)", marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", marginBottom: 16 }}>Información</h3>
        {[
          { label: "Nombre", value: SOCIO.nombre },
          { label: "Nombre comercial", value: SOCIO.nombreComercial },
          { label: "Email", value: SOCIO.email },
          { label: "Teléfono", value: SOCIO.telefono },
          { label: "URL tienda", value: `pido.com/${SOCIO.slug}`, accent: true },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0",
            borderBottom: i < 4 ? "1px solid var(--c-border)" : "none",
          }}>
            <span style={{ fontSize: 13, color: "var(--c-muted)" }}>{item.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: item.accent ? "var(--c-accent)" : "var(--c-text)" }}>{item.value}</span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 8, lineHeight: 1.5 }}>
          La URL de tu tienda se genera automáticamente con tu nombre comercial.
        </div>
        <button style={{
          width: "100%", marginTop: 14, padding: "10px 0", borderRadius: 10,
          border: "1px solid var(--c-border)", background: "var(--c-surface)",
          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--c-accent)",
        }}>Editar información</button>
      </div>

      {/* Modo de entrega */}
      <div style={{
        background: "var(--c-surface)", borderRadius: 14, padding: "18px",
        border: "1px solid var(--c-border)", marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", marginBottom: 14 }}>Modo de entrega</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { id: "reparto", label: "Reparto a domicilio", icon: "🛵", desc: "Entregas los pedidos al cliente" },
            { id: "recogida", label: "Solo recogida", icon: "🏪", desc: "El cliente recoge en el restaurante" },
            { id: "ambos", label: "Ambos", icon: "🔄", desc: "Recogida y reparto disponibles" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setModo(m.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "12px 14px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                border: modo === m.id ? "2px solid var(--c-accent)" : "1px solid var(--c-border)",
                background: modo === m.id ? "var(--c-accent-light)" : "var(--c-surface)",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Radio de cobertura */}
      <div style={{
        background: "var(--c-surface)", borderRadius: 14, padding: "18px",
        border: "1px solid var(--c-border)", marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", marginBottom: 14 }}>Radio de cobertura</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <input
            type="range" min="1" max="20" value={radio}
            onChange={(e) => setRadio(Number(e.target.value))}
            style={{ flex: 1, accentColor: "#FF5733" }}
          />
          <span style={{
            minWidth: 50, textAlign: "center", fontWeight: 800, fontSize: 16,
            color: "var(--c-accent)",
          }}>{radio} km</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 8 }}>
          Los clientes dentro de este radio podrán ver tus establecimientos.
        </div>
      </div>

      {/* Personalización — Logo */}
      <div style={{
        background: "var(--c-surface)", borderRadius: 14, padding: "18px",
        border: "1px solid var(--c-border)", marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", marginBottom: 14 }}>Logo</h3>
        <div style={{
          width: 100, height: 100, borderRadius: 20, background: "var(--c-surface2)",
          border: "2px dashed var(--c-border)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", cursor: "pointer",
          margin: "0 auto 12px",
        }}>
          <span style={{ fontSize: 28, marginBottom: 4 }}>📷</span>
          <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>Subir logo</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--c-muted)", lineHeight: 1.5 }}>
          Recomendado: 400 × 400 px · PNG o JPG · Máximo 2 MB
        </div>
      </div>

      {/* Personalización — Banner */}
      <div style={{
        background: "var(--c-surface)", borderRadius: 14, padding: "18px",
        border: "1px solid var(--c-border)", marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", marginBottom: 14 }}>Banner</h3>
        <div style={{
          width: "100%", height: 100, borderRadius: 14, background: "var(--c-surface2)",
          border: "2px dashed var(--c-border)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", cursor: "pointer",
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 28, marginBottom: 4 }}>🖼️</span>
          <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>Subir banner</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--c-muted)", lineHeight: 1.5 }}>
          Recomendado: 1200 × 400 px · PNG o JPG · Máximo 5 MB
        </div>
      </div>

      {/* Redes sociales */}
      <div style={{
        background: "var(--c-surface)", borderRadius: 14, padding: "18px",
        border: "1px solid var(--c-border)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", margin: 0 }}>Redes sociales</h3>
          <button
            onClick={() => setEditandoRedes(!editandoRedes)}
            style={{
              background: "none", border: "none", fontSize: 12, fontWeight: 600,
              color: "var(--c-accent)", cursor: "pointer", fontFamily: "inherit",
            }}
          >{editandoRedes ? "Guardar" : "Editar"}</button>
        </div>

        {[
          { key: "instagram", label: "Instagram", icon: "📸", prefix: "@" },
          { key: "tiktok", label: "TikTok", icon: "🎵", prefix: "@" },
          { key: "whatsapp", label: "WhatsApp", icon: "💬", prefix: "" },
        ].map((red, i) => (
          <div key={red.key} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
            borderBottom: i < 2 ? "1px solid var(--c-border)" : "none",
          }}>
            <span style={{ fontSize: 18 }}>{red.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 2 }}>{red.label}</div>
              {editandoRedes ? (
                <input
                  type="text"
                  value={redes[red.key] || ""}
                  onChange={(e) => setRedes({ ...redes, [red.key]: e.target.value })}
                  style={{
                    width: "100%", padding: "6px 10px", borderRadius: 8,
                    border: "1px solid var(--c-border)", fontSize: 13,
                    fontFamily: "inherit", background: "var(--c-surface2)",
                    color: "var(--c-text)", outline: "none",
                  }}
                />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>
                  {redes[red.key] ? `${red.prefix}${redes[red.key]}` : "No configurado"}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnVivo() {
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [etapa, setEtapa] = useState(null);

  const pedidoEntrante = {
    id: "PD-1248", restaurante: "Sushi Zen", direccionRestaurante: "C/ Castillo 8, Santa Cruz",
    cliente: "Elena Fernández", direccionCliente: "C/ La Noria 22, 4ºB, Santa Cruz",
    telCliente: "+34 677 888 999", items: [
      { nombre: "Mix Salmón 12 pzas", cantidad: 1, precio: 14.90 },
      { nombre: "Dragon Roll", cantidad: 2, precio: 12.00 },
    ],
    total: 38.90, envio: 3.00, propina: 2.50, pago: "tarjeta",
    notas: "Sin wasabi, por favor. Portero automático: 4B",
    canal: "pidogo",
  };

  const etapas = [
    { id: "aceptar", label: "Nuevo pedido", desc: "Acepta o rechaza el pedido" },
    { id: "ir_recoger", label: "Ir a recoger", desc: "Navega al restaurante" },
    { id: "recogido", label: "Pedido recogido", desc: "Confirma que tienes el pedido" },
    { id: "ir_entregar", label: "En camino", desc: "Navega al cliente" },
    { id: "entregado", label: "Entregado", desc: "Confirma la entrega" },
  ];

  const etapaIdx = etapa ? etapas.findIndex(e => e.id === etapa) : -1;

  if (!pedidoActivo) {
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 8px" }}>Pedidos en vivo</h2>
        <p style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 24 }}>Aquí aparecen los pedidos en tiempo real.</p>

        {/* Simular pedido entrante */}
        <div style={{
          background: "linear-gradient(135deg, #FF5733, #FF8F73)", borderRadius: 16,
          padding: "20px", marginBottom: 20, animation: "fadeIn 0.5s ease",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ color: "#fff", fontSize: 11, fontWeight: 600, opacity: 0.7, marginBottom: 2 }}>NUEVO PEDIDO</div>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{pedidoEntrante.restaurante}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <PagoBadge pago={pedidoEntrante.pago} />
              <span style={{
                background: pedidoEntrante.canal === "pidogo" ? "#DBEAFE" : "#F3E8FF",
                color: pedidoEntrante.canal === "pidogo" ? "#1E40AF" : "#6B21A8",
                fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
              }}>{pedidoEntrante.canal === "pidogo" ? "Tu tienda" : "App PIDO"}</span>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
            {pedidoEntrante.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: 13, marginBottom: i < pedidoEntrante.items.length - 1 ? 6 : 0 }}>
                <span>{item.cantidad}x {item.nombre}</span>
                <span style={{ fontWeight: 700 }}>{(item.precio * item.cantidad).toFixed(2)} €</span>
              </div>
            ))}
          </div>

          {pedidoEntrante.notas && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 12, fontStyle: "italic" }}>
              Nota: {pedidoEntrante.notas}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: 14, fontWeight: 800, marginBottom: 16 }}>
            <span>Total: {pedidoEntrante.total.toFixed(2)} €</span>
            <span>Tu ganancia: +{(pedidoEntrante.total * 0.1 + pedidoEntrante.envio + pedidoEntrante.propina).toFixed(2)} €</span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={{
              flex: 1, padding: "14px 0", borderRadius: 12, border: "2px solid rgba(255,255,255,0.3)",
              background: "transparent", color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>Rechazar</button>
            <button onClick={() => { setPedidoActivo(pedidoEntrante); setEtapa("ir_recoger"); }}
              style={{
                flex: 2, padding: "14px 0", borderRadius: 12, border: "none",
                background: "#fff", color: "var(--c-accent)", fontSize: 14, fontWeight: 800,
                cursor: "pointer", fontFamily: "inherit",
              }}>Aceptar pedido</button>
          </div>
        </div>

        <div style={{ textAlign: "center", color: "var(--c-muted)", fontSize: 13, padding: "40px 0" }}>
          Esperando nuevos pedidos...
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 16px" }}>Pedido activo</h2>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {etapas.slice(1).map((e, i) => (
          <div key={e.id} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= etapaIdx - 1 ? "var(--c-accent)" : "var(--c-border)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-accent)", marginBottom: 4 }}>
        {etapas[etapaIdx]?.label}
      </div>
      <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 20 }}>
        {etapas[etapaIdx]?.desc}
      </div>

      {/* Info del pedido */}
      <div style={{
        background: "var(--c-surface)", borderRadius: 14, padding: "16px 18px",
        border: "1px solid var(--c-border)", marginBottom: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)" }}>{pedidoActivo.id}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <PagoBadge pago={pedidoActivo.pago} />
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>{pedidoActivo.restaurante}</div>
        {pedidoActivo.items.map((item, i) => (
          <div key={i} style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 2 }}>
            {item.cantidad}x {item.nombre} — {(item.precio * item.cantidad).toFixed(2)} €
          </div>
        ))}
        {pedidoActivo.notas && (
          <div style={{ fontSize: 12, color: "#92400E", background: "#FEF3C7", borderRadius: 8, padding: "8px 10px", marginTop: 8 }}>
            {pedidoActivo.notas}
          </div>
        )}
        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--c-text)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--c-border)" }}>
          Total: {pedidoActivo.total.toFixed(2)} €
          {pedidoActivo.pago === "efectivo" && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginLeft: 8 }}>Cobrar en efectivo</span>
          )}
        </div>
      </div>

      {/* Destino actual */}
      <div style={{
        background: (etapa === "ir_recoger" || etapa === "recogido") ? "#FFF7ED" : "#F0FDF4",
        borderRadius: 14, padding: "16px 18px", marginBottom: 12,
        border: (etapa === "ir_recoger" || etapa === "recogido") ? "1px solid #FED7AA" : "1px solid #BBF7D0",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: (etapa === "ir_recoger" || etapa === "recogido") ? "#C2410C" : "#15803D", marginBottom: 6, textTransform: "uppercase" }}>
          {(etapa === "ir_recoger" || etapa === "recogido") ? "📍 Punto de recogida" : "📍 Punto de entrega"}
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)", marginBottom: 2 }}>
          {(etapa === "ir_recoger" || etapa === "recogido") ? pedidoActivo.restaurante : pedidoActivo.cliente}
        </div>
        <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 10 }}>
          {(etapa === "ir_recoger" || etapa === "recogido") ? pedidoActivo.direccionRestaurante : pedidoActivo.direccionCliente}
        </div>

        {(etapa === "ir_entregar" || etapa === "entregado") && (
          <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 10 }}>
            Tel: {pedidoActivo.telCliente}
          </div>
        )}

        <button style={{
          width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
          background: "#1A73E8", color: "#fff", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit", display: "flex",
          alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Abrir en Google Maps
        </button>
      </div>

      {/* Botón de acción principal */}
      {etapa !== "entregado" && (
        <button onClick={() => {
          const next = { ir_recoger: "recogido", recogido: "ir_entregar", ir_entregar: "entregado" };
          setEtapa(next[etapa]);
        }} style={{
          width: "100%", padding: "16px 0", borderRadius: 14, border: "none",
          background: "var(--c-accent)", color: "#fff", fontSize: 16, fontWeight: 800,
          cursor: "pointer", fontFamily: "inherit", marginTop: 8,
        }}>
          {etapa === "ir_recoger" && "He recogido el pedido"}
          {etapa === "recogido" && "En camino al cliente"}
          {etapa === "ir_entregar" && "Pedido entregado"}
        </button>
      )}

      {etapa === "entregado" && (
        <div style={{
          background: "#DCFCE7", borderRadius: 14, padding: "20px",
          textAlign: "center", marginTop: 8,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#166534", marginBottom: 4 }}>Pedido entregado</div>
          <div style={{ fontSize: 13, color: "#15803D", marginBottom: 16 }}>
            Has ganado +{(pedidoActivo.total * 0.1 + pedidoActivo.envio + pedidoActivo.propina).toFixed(2)} € con este pedido
          </div>
          <button onClick={() => { setPedidoActivo(null); setEtapa(null); }} style={{
            padding: "10px 24px", borderRadius: 10, border: "none",
            background: "#166534", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>Volver a pedidos en vivo</button>
        </div>
      )}
    </div>
  );
}

function Soporte() {
  const [mensajes, setMensajes] = useState([
    { de: "soporte", texto: "¡Hola! Soy el equipo de soporte de PIDO. ¿En qué podemos ayudarte?", hora: "10:00" },
  ]);
  const [input, setInput] = useState("");

  const enviar = () => {
    if (!input.trim()) return;
    setMensajes([...mensajes, { de: "socio", texto: input, hora: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
    setTimeout(() => {
      setMensajes(prev => [...prev, {
        de: "soporte",
        texto: "Gracias por tu mensaje. Un agente te responderá en breve. Tiempo estimado: menos de 5 minutos.",
        hora: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 16px" }}>Soporte PIDO</h2>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {mensajes.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.de === "socio" ? "flex-end" : "flex-start",
            maxWidth: "80%",
          }}>
            <div style={{
              background: m.de === "socio" ? "var(--c-accent)" : "var(--c-surface)",
              color: m.de === "socio" ? "#fff" : "var(--c-text)",
              borderRadius: 14,
              borderBottomRightRadius: m.de === "socio" ? 4 : 14,
              borderBottomLeftRadius: m.de === "soporte" ? 4 : 14,
              padding: "10px 14px", fontSize: 13, lineHeight: 1.5,
              border: m.de === "soporte" ? "1px solid var(--c-border)" : "none",
            }}>
              {m.texto}
            </div>
            <div style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 4, textAlign: m.de === "socio" ? "right" : "left" }}>
              {m.hora}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="Escribe tu mensaje..."
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 12,
            border: "1px solid var(--c-border)", fontSize: 13,
            fontFamily: "inherit", background: "var(--c-surface)",
            color: "var(--c-text)", outline: "none",
          }}
        />
        <button onClick={enviar} style={{
          width: 44, height: 44, borderRadius: 12, border: "none",
          background: "var(--c-accent)", color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontFamily: "inherit",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// --- APP PRINCIPAL ---

export default function PanelSocio() {
  const [seccion, setSeccion] = useState("envivo");

  const nav = [
    { id: "dashboard", label: "Inicio", icon: <IconDashboard /> },
    { id: "pedidos", label: "Pedidos", icon: <IconPedidos /> },
    { id: "restaurantes", label: "Negocios", icon: <IconRestaurantes /> },
    { id: "facturas", label: "Informes", icon: <IconFacturas /> },
    { id: "perfil", label: "Perfil", icon: <IconPerfil /> },
  ];

  return (
    <div style={{
      "--c-accent": "#FF5733", "--c-accent-light": "#FFF0EC", "--c-accent-soft": "#FFD6CC",
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
        {/* Logo + status */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, background: "var(--c-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "#fff",
          }}>J</div>
          <div style={{
            width: 8, height: 8, borderRadius: 4,
            background: SOCIO.enServicio ? "#16A34A" : "#D1D5DB",
            boxShadow: SOCIO.enServicio ? "0 0 6px rgba(22,163,74,0.5)" : "none",
          }} />
        </div>

        {/* Botones header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setSeccion("envivo")} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 14px",
            borderRadius: 10, border: "none",
            background: seccion === "envivo" ? "var(--c-accent)" : "var(--c-accent-light)",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            color: seccion === "envivo" ? "#fff" : "var(--c-accent)",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: 4, background: seccion === "envivo" ? "#fff" : "var(--c-accent)",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
            En vivo
          </button>
          <button onClick={() => setSeccion("soporte")} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
            borderRadius: 10, border: "none",
            background: seccion === "soporte" ? "var(--c-accent)" : "var(--c-surface2)",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            color: seccion === "soporte" ? "#fff" : "var(--c-muted)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Soporte
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: "20px", animation: "fadeIn 0.3s ease" }}>
        {seccion === "envivo" && <EnVivo />}
        {seccion === "dashboard" && <Dashboard />}
        {seccion === "pedidos" && <Pedidos />}
        {seccion === "restaurantes" && <Restaurantes />}
        {seccion === "facturas" && <Facturas />}
        {seccion === "perfil" && <Perfil />}
        {seccion === "soporte" && <Soporte />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 420, background: "var(--c-surface)",
        borderTop: "1px solid var(--c-border)", display: "flex",
        justifyContent: "space-around", padding: "8px 0 12px", zIndex: 50,
      }}>
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setSeccion(n.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
              color: seccion === n.id ? "var(--c-accent)" : "var(--c-muted)",
              fontSize: 10, fontWeight: 600, padding: "4px 8px",
              transition: "color 0.2s",
            }}
          >
            {n.icon}
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}

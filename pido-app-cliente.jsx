import { useState, useEffect } from "react";

// --- DATOS ---
const USUARIO = {
  nombre: "Elena",
  apellido: "Fernández",
  email: "elena@email.com",
  telefono: "+34 677 888 999",
  direccion: "C/ La Noria 22, 4ºB, Santa Cruz",
  lat: 28.4698,
  lng: -16.2549,
  tarjeta: "**** 4521",
  favoritos: [1, 3],
  notificaciones: [
    { id: 1, titulo: "Tu pedido ha sido entregado", desc: "Pizzería Don Mario · PD-1247", hora: "Hace 2h", leida: true },
    { id: 2, titulo: "Promoción: 20% en Sushi Zen", desc: "Válido hasta el 30 de marzo", hora: "Hace 5h", leida: false },
    { id: 3, titulo: "Nuevo restaurante cerca de ti", desc: "La Ricarepa ya está en PIDO", hora: "Ayer", leida: false },
    { id: 4, titulo: "Tu pedido ha sido entregado", desc: "Burger Factory · PD-1240", hora: "Ayer", leida: true },
  ],
};

const CATEGORIAS = [
  { id: 1, nombre: "Pizzas", emoji: "🍕" },
  { id: 2, nombre: "Burgers", emoji: "🍔" },
  { id: 3, nombre: "Sushi", emoji: "🍣" },
  { id: 4, nombre: "Postres", emoji: "🍰" },
  { id: 5, nombre: "Bebidas", emoji: "🥤" },
  { id: 6, nombre: "Latina", emoji: "🫓" },
];

const RESTAURANTES = [
  { id: 1, nombre: "Pizzería Don Mario", cats: [1], rating: 4.8, resenas: 234, tiempo: "25-35", km: 1.2, envio: 2.50, activo: true, emoji: "🍕", destacado: true, modoEntrega: "ambos", dir: "C/ San Fernando 12",
    productos: [
      { id: 101, nombre: "Margherita", precio: 9.50, desc: "Tomate, mozzarella, albahaca", tamanos: [{ n: "Mediana", p: 9.50 }, { n: "Grande", p: 13.50 }], extras: [{ grupo: "Quesos", max: 3, ops: [{ n: "Extra mozzarella", p: 1.50 }, { n: "Gorgonzola", p: 2.00 }] }] },
      { id: 102, nombre: "Pepperoni", precio: 11.00, desc: "Pepperoni, mozzarella, orégano", tamanos: [], extras: [] },
      { id: 103, nombre: "Cuatro Quesos", precio: 12.50, desc: "Mozzarella, gorgonzola, parmesano, emmental", tamanos: [], extras: [] },
      { id: 104, nombre: "Bruschetta", precio: 6.50, desc: "Pan tostado, tomate, albahaca", tamanos: [], extras: [] },
      { id: 105, nombre: "Coca-Cola", precio: 2.50, desc: "33cl", tamanos: [], extras: [] },
    ] },
  { id: 2, nombre: "Burger Factory", cats: [2], rating: 4.6, resenas: 189, tiempo: "20-30", km: 0.8, envio: 1.99, activo: true, emoji: "🍔", destacado: true, modoEntrega: "reparto", dir: "Av. Anaga 45",
    productos: [
      { id: 201, nombre: "Classic Smash", precio: 8.90, desc: "Carne 150g, cheddar, lechuga, tomate", tamanos: [{ n: "Simple", p: 8.90 }, { n: "Doble", p: 12.90 }], extras: [{ grupo: "Extras", max: 3, ops: [{ n: "Bacon", p: 1.50 }, { n: "Huevo", p: 1.00 }] }] },
      { id: 202, nombre: "BBQ Bacon", precio: 10.50, desc: "Carne, bacon, cheddar, BBQ", tamanos: [], extras: [] },
      { id: 203, nombre: "Patatas fritas", precio: 3.50, desc: "Con especias", tamanos: [], extras: [] },
    ] },
  { id: 3, nombre: "Sushi Zen", cats: [3], rating: 4.9, resenas: 312, tiempo: "30-45", km: 2.1, envio: 3.00, activo: true, emoji: "🍣", destacado: true, modoEntrega: "reparto", dir: "C/ Castillo 8",
    productos: [
      { id: 301, nombre: "Mix Salmón 12pzas", precio: 14.90, desc: "Nigiri, maki, uramaki", tamanos: [], extras: [] },
      { id: 302, nombre: "Dragon Roll", precio: 12.00, desc: "Langostino, aguacate, sésamo", tamanos: [], extras: [] },
      { id: 303, nombre: "Edamame", precio: 4.50, desc: "Con sal marina", tamanos: [], extras: [] },
    ] },
  { id: 4, nombre: "Dulce Tentación", cats: [4, 5], rating: 4.5, resenas: 97, tiempo: "15-25", km: 0.5, envio: 1.50, activo: true, emoji: "🍰", destacado: false, modoEntrega: "recogida", dir: "Plaza del Príncipe 3",
    productos: [
      { id: 401, nombre: "Tarta de queso", precio: 5.50, desc: "Estilo NY", tamanos: [], extras: [] },
      { id: 402, nombre: "Tiramisú", precio: 6.00, desc: "Mascarpone, café, cacao", tamanos: [], extras: [] },
      { id: 403, nombre: "Smoothie tropical", precio: 4.50, desc: "Mango, piña, maracuyá", tamanos: [], extras: [] },
    ] },
  { id: 5, nombre: "La Ricarepa", cats: [6, 2], rating: 4.7, resenas: 156, tiempo: "20-30", km: 1.5, envio: 2.00, activo: true, emoji: "🫓", destacado: false, modoEntrega: "ambos", dir: "C/ Bethencourt 22",
    productos: [
      { id: 501, nombre: "Arepa Reina Pepiada", precio: 7.50, desc: "Pollo, aguacate, mayonesa", tamanos: [], extras: [] },
      { id: 502, nombre: "Arepa Pabellón", precio: 8.00, desc: "Carne mechada, caraotas, plátano", tamanos: [], extras: [] },
    ] },
];

const RIDERS_ACTIVOS = [
  { id: 1, nombre: "Juanito Express", lat: 28.4710, lng: -16.2535, rating: 4.7 },
  { id: 2, nombre: "María Delivery", lat: 28.4680, lng: -16.2560, rating: 4.5 },
  { id: 3, nombre: "Rápido SC", lat: 28.4720, lng: -16.2500, rating: 4.3 },
];

// --- COMPONENTES ---
function Stars({ rating, size = 12 }) {
  return <span style={{ color: "#F59E0B", fontSize: size }}>{"★".repeat(Math.floor(rating))}<span style={{ color: "var(--c-muted)", marginLeft: 4, fontSize: size }}>{rating}</span></span>;
}

function EntregaBadge({ modo }) {
  const c = { reparto: { l: "Delivery", bg: "#DCFCE7", c: "#166534", i: "🛵" }, recogida: { l: "Recogida", bg: "#FEF3C7", c: "#92400E", i: "🏪" }, ambos: { l: "Delivery y recogida", bg: "#DBEAFE", c: "#1E40AF", i: "🛵" } }[modo];
  return <span style={{ background: c.bg, color: c.c, fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 3 }}>{c.i} {c.l}</span>;
}

// --- LOGIN ---
function Login({ onLogin }) {
  const [modo, setModo] = useState("login");
  return (
    <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", justifyContent: "center" }}>
      <div style={{ fontSize: 48, fontWeight: 800, color: "var(--c-primary)", marginBottom: 8, letterSpacing: -2 }}>pidoo</div>
      <p style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 32, textAlign: "center" }}>Tu comida favorita, al alcance de un toque</p>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ display: "flex", background: "var(--c-surface2)", borderRadius: 12, padding: 3, marginBottom: 20 }}>
          {["login", "registro"].map(m => (
            <button key={m} onClick={() => setModo(m)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: modo === m ? "var(--c-primary)" : "transparent", color: modo === m ? "#fff" : "var(--c-muted)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>{m === "login" ? "Iniciar sesión" : "Registrarse"}</button>
          ))}
        </div>
        {modo === "registro" && <input placeholder="Nombre completo" style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid var(--c-border)", fontSize: 14, fontFamily: "inherit", marginBottom: 10, background: "var(--c-surface)", color: "var(--c-text)", outline: "none" }} />}
        <input placeholder="Email" style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid var(--c-border)", fontSize: 14, fontFamily: "inherit", marginBottom: 10, background: "var(--c-surface)", color: "var(--c-text)", outline: "none" }} />
        <input placeholder="Contraseña" type="password" style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid var(--c-border)", fontSize: 14, fontFamily: "inherit", marginBottom: 10, background: "var(--c-surface)", color: "var(--c-text)", outline: "none" }} />
        {modo === "registro" && <input placeholder="Teléfono" style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid var(--c-border)", fontSize: 14, fontFamily: "inherit", marginBottom: 10, background: "var(--c-surface)", color: "var(--c-text)", outline: "none" }} />}
        <button onClick={onLogin} style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: "var(--c-primary)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>
          {modo === "login" ? "Entrar" : "Crear cuenta"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--c-muted)" }}>
          {modo === "login" ? "¿Olvidaste tu contraseña?" : "Al registrarte aceptas nuestros términos"}
        </div>
      </div>
    </div>
  );
}

// --- ONBOARDING (selector de vertical con animaciones + permisos nativos al cargar) ---
function Onboarding({ onComplete }) {
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState(null);

  // Al montar, pedir permisos nativos del teléfono (geolocalización + notificaciones)
  useEffect(() => {
    // En producción con Capacitor: Geolocation.requestPermissions() + PushNotifications.requestPermissions()
    // Aquí simulamos el delay del splash → animación de entrada
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  const cats = [
    { id: "comida", nombre: "Comida", emoji: "🍕", desc: "Restaurantes y cafeterías", color: "#FF6B2C", bg: "linear-gradient(135deg, #FFF3ED 0%, #FFE0CC 100%)", delay: 0 },
    { id: "farmacia", nombre: "Farmacia", emoji: "💊", desc: "Medicamentos e higiene", color: "#16A34A", bg: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)", delay: 1 },
    { id: "marketplace", nombre: "Marketplace", emoji: "🛒", desc: "Minimarkets y tiendas", color: "#2563EB", bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", delay: 2 },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes float1 { 0%,100% { transform: translate(0,0) rotate(0deg); } 33% { transform: translate(12px,-18px) rotate(8deg); } 66% { transform: translate(-8px,10px) rotate(-5deg); } }
        @keyframes float2 { 0%,100% { transform: translate(0,0) rotate(0deg); } 33% { transform: translate(-15px,12px) rotate(-10deg); } 66% { transform: translate(10px,-14px) rotate(6deg); } }
        @keyframes float3 { 0%,100% { transform: translate(0,0) rotate(0deg); } 33% { transform: translate(8px,16px) rotate(12deg); } 66% { transform: translate(-12px,-10px) rotate(-8deg); } }
        @keyframes logoIn { from { opacity:0; transform:scale(0.5) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes textIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cardIn0 { from { opacity:0; transform:translateX(-40px) scale(0.9); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes cardIn1 { from { opacity:0; transform:translateY(40px) scale(0.9); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes cardIn2 { from { opacity:0; transform:translateX(40px) scale(0.9); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes emojiBounce { 0%,100% { transform:scale(1); } 50% { transform:scale(1.15); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      {/* Emojis flotantes de fondo */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {["🍕","🍔","🍣","💊","🛒","🥤","🍰","🫓","☕"].map((e, i) => (
          <div key={i} style={{
            position: "absolute",
            top: `${10 + (i * 11) % 80}%`,
            left: `${5 + (i * 13) % 90}%`,
            fontSize: 24 + (i % 3) * 8,
            opacity: 0.08,
            animation: `float${(i % 3) + 1} ${4 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}>{e}</div>
        ))}
      </div>

      {/* Logo con animación */}
      <div style={{
        fontSize: 56, fontWeight: 800, color: "var(--c-primary)", letterSpacing: -3,
        animation: ready ? "logoIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
        opacity: ready ? 1 : 0,
        marginBottom: 6,
      }}>pidoo</div>

      {/* Subtítulo */}
      <p style={{
        fontSize: 18, color: "var(--c-text)", fontWeight: 800, textAlign: "center",
        animation: ready ? "textIn 0.5s ease 0.2s both" : "none",
        opacity: 0,
        marginBottom: 4,
      }}>¿Qué necesitas hoy?</p>
      <p style={{
        fontSize: 13, color: "var(--c-muted)", textAlign: "center",
        animation: ready ? "textIn 0.5s ease 0.35s both" : "none",
        opacity: 0,
        marginBottom: 36,
      }}>Elige y te llevamos lo que quieras</p>

      {/* Tarjetas de categorías con animaciones */}
      <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 1 }}>
        {cats.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onComplete(c.id)}
            onMouseEnter={() => setHovered(c.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "flex", alignItems: "center", gap: 16, width: "100%",
              padding: "22px 20px", borderRadius: 20,
              border: hovered === c.id ? `2px solid ${c.color}` : "2px solid transparent",
              background: c.bg, cursor: "pointer", fontFamily: "inherit",
              textAlign: "left",
              transform: hovered === c.id ? "scale(1.03)" : "scale(1)",
              boxShadow: hovered === c.id ? `0 8px 30px ${c.color}22` : "0 2px 10px rgba(0,0,0,0.04)",
              transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border 0.2s ease",
              animation: ready ? `cardIn${i} 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.4 + i * 0.12}s both` : "none",
              opacity: 0,
            }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: 18, background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30, boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              animation: hovered === c.id ? "emojiBounce 0.4s ease" : "none",
              flexShrink: 0,
            }}>{c.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: c.color, marginBottom: 2 }}>{c.nombre}</div>
              <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{c.desc}</div>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: hovered === c.id ? c.color : "rgba(0,0,0,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.25s ease",
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={hovered === c.id ? "#fff" : c.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Línea shimmer decorativa */}
      <div style={{
        width: 120, height: 4, borderRadius: 2, marginTop: 32,
        background: `linear-gradient(90deg, transparent, var(--c-primary), transparent)`,
        backgroundSize: "200% 100%",
        animation: ready ? "shimmer 2.5s ease-in-out infinite 1s" : "none",
        opacity: 0.3,
      }} />
    </div>
  );
}

// --- HOME ---
function Home({ onOpenRest, catActiva, setCatActiva, busqueda, setBusqueda, favoritos, toggleFav }) {
  const destacados = RESTAURANTES.filter(r => r.destacado);
  const filtrados = RESTAURANTES.filter(r => {
    const mc = !catActiva || r.cats.includes(catActiva);
    const mb = !busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return mc && mb && r.activo;
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <div>
          <div style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>Entregar en</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>{USUARIO.direccion}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--c-surface)", borderRadius: 14, padding: "12px 16px", border: "1px solid var(--c-border)", marginBottom: 20 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar restaurante o plato..." style={{ border: "none", outline: "none", fontSize: 14, fontFamily: "inherit", background: "transparent", flex: 1, color: "var(--c-text)" }} />
        {busqueda && <button onClick={() => setBusqueda("")} style={{ background: "var(--c-surface2)", border: "none", borderRadius: 50, width: 22, height: 22, cursor: "pointer", fontSize: 12, color: "var(--c-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>}
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 24, paddingBottom: 4 }}>
        {CATEGORIAS.map(c => (
          <button key={c.id} onClick={() => setCatActiva(catActiva === c.id ? null : c.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", minWidth: 56, opacity: catActiva && catActiva !== c.id ? 0.4 : 1, transition: "opacity 0.2s" }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: catActiva === c.id ? "var(--c-primary)" : "var(--c-surface)", border: catActiva === c.id ? "none" : "1px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, transition: "all 0.2s" }}>{c.emoji}</div>
            <span style={{ fontSize: 10, fontWeight: 600, color: catActiva === c.id ? "var(--c-primary)" : "var(--c-muted)" }}>{c.nombre}</span>
          </button>
        ))}
      </div>
      {!busqueda && !catActiva && destacados.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--c-text)", marginBottom: 12 }}>Destacados</h2>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
            {destacados.map(r => (
              <div key={r.id} onClick={() => onOpenRest(r)} style={{ minWidth: 240, flexShrink: 0, background: "var(--c-surface)", borderRadius: 16, overflow: "hidden", cursor: "pointer", border: "1px solid var(--c-border)" }}>
                <div style={{ height: 110, background: "linear-gradient(135deg, var(--c-primary-light), var(--c-primary-soft))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, position: "relative" }}>
                  {r.emoji}
                  <span style={{ position: "absolute", top: 8, left: 8, background: "#F59E0B", color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 6 }}>Destacado</span>
                  <span style={{ position: "absolute", bottom: 8, right: 8 }}><EntregaBadge modo={r.modoEntrega} /></span>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)", marginBottom: 4 }}>{r.nombre}</div>
                  <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--c-muted)" }}>
                    <Stars rating={r.rating} size={11} />
                    <span>⏱ {r.tiempo} min</span>
                    <span>{r.km} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--c-text)", marginBottom: 12 }}>
        {busqueda ? `Resultados` : catActiva ? "Restaurantes" : "Cerca de ti"}
      </h2>
      {filtrados.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--c-muted)" }}><div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div><div style={{ fontSize: 14, fontWeight: 600 }}>No hay resultados</div></div>}
      {filtrados.map(r => {
        const isFav = favoritos.includes(r.id);
        return (
          <div key={r.id} onClick={() => onOpenRest(r)} style={{ background: "var(--c-surface)", borderRadius: 16, overflow: "hidden", marginBottom: 14, cursor: "pointer", border: "1px solid var(--c-border)" }}>
            <div style={{ height: 120, background: "linear-gradient(135deg, var(--c-primary-light), var(--c-primary-soft))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, position: "relative" }}>
              {r.emoji}
              <div style={{ position: "absolute", bottom: 8, left: 10, display: "flex", gap: 6 }}>
                <span style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 8 }}>⏱ {r.tiempo} min</span>
                <span style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 8 }}>{r.km} km</span>
              </div>
              <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6, alignItems: "center" }}>
                <EntregaBadge modo={r.modoEntrega} />
                <button onClick={e => { e.stopPropagation(); toggleFav(r.id); }} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isFav ? "❤️" : "🤍"}
                </button>
              </div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: "var(--c-text)" }}>{r.nombre}</span>
                <Stars rating={r.rating} size={12} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--c-muted)" }}>
                <span>{r.resenas} reseñas</span>
                <span style={{ fontWeight: 600, color: r.modoEntrega === "recogida" ? "#92400E" : "var(--c-primary)" }}>
                  {r.modoEntrega === "recogida" ? "🏪 Recoger" : `Envío ${r.envio.toFixed(2)} €`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- RESTAURANTE DETALLE ---
function RestDetalle({ r, onBack, onAddItem }) {
  const [modal, setModal] = useState(null);
  const [tam, setTam] = useState(null);
  const [exSel, setExSel] = useState([]);
  const [cant, setCant] = useState(1);
  const abrirP = p => { setModal(p); setTam(p.tamanos.length > 0 ? 0 : null); setExSel([]); setCant(1); };
  const precioT = () => { if (!modal) return 0; const b = tam !== null ? modal.tamanos[tam].p : modal.precio; return (b + exSel.reduce((s, e) => s + e.p, 0)) * cant; };
  const confirmar = () => { onAddItem({ id: modal.id, nombre: modal.nombre, tamano: tam !== null ? modal.tamanos[tam].n : null, extras: exSel.map(e => e.n), precioUnit: precioT() / cant, cantidad: cant, restaurante_id: r.id, restaurante_nombre: r.nombre, envio: r.envio }); setModal(null); };
  const toggleEx = op => setExSel(p => p.find(e => e.n === op.n) ? p.filter(e => e.n !== op.n) : [...p, op]);

  return (
    <div style={{ animation: "slideIn 0.3s ease" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--c-primary)", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 16, padding: 0, fontFamily: "inherit" }}>← Volver</button>
      <div style={{ height: 150, background: "linear-gradient(135deg, var(--c-primary-light), var(--c-primary-soft))", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, marginBottom: 16 }}>{r.emoji}</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--c-text)", margin: "0 0 4px" }}>{r.nombre}</h2>
      <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: "var(--c-muted)", marginBottom: 4, flexWrap: "wrap" }}>
        <Stars rating={r.rating} /><span>({r.resenas})</span><span>⏱ {r.tiempo} min</span><span>{r.km} km</span>
      </div>
      <div style={{ marginBottom: 20 }}><EntregaBadge modo={r.modoEntrega} /></div>
      {r.modoEntrega === "recogida" && <div style={{ background: "#FEF3C7", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>🏪</span><div><strong>Solo recogida</strong> · {r.dir}</div></div>}
      {r.productos.map(p => (
        <div key={p.id} onClick={() => abrirP(p)} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--c-border)", cursor: "pointer" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)", marginBottom: 2 }}>{p.nombre}</div>
            <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 4 }}>{p.desc}</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "var(--c-primary)" }}>{p.tamanos.length > 0 ? `Desde ${p.precio.toFixed(2)} €` : `${p.precio.toFixed(2)} €`}</div>
          </div>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: "var(--c-surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, border: "1px solid var(--c-border)" }}>{r.emoji}</div>
        </div>
      ))}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--c-bg)", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 420, maxHeight: "80vh", overflowY: "auto", animation: "slideUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--c-text)" }}>{modal.nombre}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--c-muted)" }}>×</button>
            </div>
            <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 16 }}>{modal.desc}</p>
            {modal.tamanos.length > 0 && <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>Tamaño</div>
              {modal.tamanos.map((t, i) => (
                <button key={i} onClick={() => setTam(i)} style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "12px 14px", borderRadius: 10, marginBottom: 6, border: tam === i ? "2px solid var(--c-primary)" : "1px solid var(--c-border)", background: tam === i ? "var(--c-primary-light)" : "var(--c-surface)", cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--c-text)" }}>{t.n}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--c-primary)" }}>{t.p.toFixed(2)} €</span>
                </button>
              ))}
            </div>}
            {modal.extras.map((g, gi) => (
              <div key={gi} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 4 }}>{g.grupo}</div>
                <div style={{ fontSize: 10, color: "var(--c-muted)", marginBottom: 8 }}>Máx. {g.max}</div>
                {g.ops.map((op, oi) => { const sel = exSel.find(e => e.n === op.n); return (
                  <button key={oi} onClick={() => toggleEx(op)} style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: 10, marginBottom: 6, border: sel ? "2px solid var(--c-primary)" : "1px solid var(--c-border)", background: sel ? "var(--c-primary-light)" : "var(--c-surface)", cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: sel ? "none" : "2px solid var(--c-border)", background: sel ? "var(--c-primary)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{sel && <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>✓</span>}</div>
                      <span style={{ fontSize: 13, color: "var(--c-text)" }}>{op.n}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-primary)" }}>+{op.p.toFixed(2)} €</span>
                  </button>
                ); })}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 16 }}>
              <button onClick={() => setCant(Math.max(1, cant - 1))} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-surface)", fontSize: 18, cursor: "pointer", fontFamily: "inherit", color: "var(--c-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)" }}>{cant}</span>
              <button onClick={() => setCant(cant + 1)} style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: "var(--c-primary)", color: "#fff", fontSize: 18, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
            <button onClick={confirmar} style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: "var(--c-primary)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Añadir — {precioT().toFixed(2)} €</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CARRITO ---
function Carrito({ carrito, setCarrito, onPedir }) {
  const [open, setOpen] = useState(false);
  const [propina, setPropina] = useState(0);
  const [metodo, setMetodo] = useState("tarjeta");
  const total = carrito.reduce((s, i) => s + i.precioUnit * i.cantidad, 0);
  const items = carrito.reduce((s, i) => s + i.cantidad, 0);
  const envio = carrito.length > 0 ? carrito[0].envio : 0;
  if (items === 0) return null;
  return (
    <>
      <div onClick={() => setOpen(true)} style={{ position: "fixed", bottom: 72, left: "50%", transform: "translateX(-50%)", background: "var(--c-primary)", color: "#fff", borderRadius: 16, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minWidth: 300, maxWidth: 380, cursor: "pointer", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", zIndex: 50, fontFamily: "inherit" }}>
        <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 8, padding: "2px 10px", fontWeight: 700, fontSize: 14 }}>{items}</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Ver carrito</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{(total + envio + propina).toFixed(2)} €</span>
      </div>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--c-bg)", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto", animation: "slideUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--c-text)" }}>Tu pedido</h3>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--c-muted)" }}>×</button>
            </div>
            <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 14 }}>{carrito[0]?.restaurante_nombre}</div>
            {carrito.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--c-border)" }}>
                <div><div style={{ fontWeight: 600, fontSize: 13, color: "var(--c-text)" }}>{item.cantidad}x {item.nombre}</div>{item.tamano && <div style={{ fontSize: 10, color: "var(--c-muted)" }}>{item.tamano}</div>}{item.extras.length > 0 && <div style={{ fontSize: 10, color: "var(--c-muted)" }}>{item.extras.join(", ")}</div>}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)" }}>{(item.precioUnit * item.cantidad).toFixed(2)} €</span>
                  <button onClick={() => setCarrito(p => p.filter((_, i) => i !== idx))} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-surface)", cursor: "pointer", fontSize: 10, color: "#991B1B", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>Propina</div>
              <div style={{ display: "flex", gap: 8 }}>{[0, 1, 2, 3].map(p => <button key={p} onClick={() => setPropina(p)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: propina === p ? "2px solid var(--c-primary)" : "1px solid var(--c-border)", background: propina === p ? "var(--c-primary-light)" : "var(--c-surface)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: propina === p ? "var(--c-primary)" : "var(--c-text)" }}>{p === 0 ? "No" : `${p} €`}</button>)}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>Método de pago</div>
              <div style={{ display: "flex", gap: 8 }}>{[{ id: "tarjeta", l: "💳 Tarjeta" }, { id: "efectivo", l: "💵 Efectivo" }].map(m => <button key={m.id} onClick={() => setMetodo(m.id)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: metodo === m.id ? "2px solid var(--c-primary)" : "1px solid var(--c-border)", background: metodo === m.id ? "var(--c-primary-light)" : "var(--c-surface)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: metodo === m.id ? "var(--c-primary)" : "var(--c-text)" }}>{m.l}</button>)}</div>
            </div>
            <div style={{ fontSize: 13, color: "var(--c-muted)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Subtotal</span><span>{total.toFixed(2)} €</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Envío</span><span>{envio.toFixed(2)} €</span></div>
              {propina > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#F59E0B" }}><span>Propina</span><span>{propina} €</span></div>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, marginTop: 10, paddingTop: 10, borderTop: "2px solid var(--c-border)", color: "var(--c-text)" }}><span>Total</span><span>{(total + envio + propina).toFixed(2)} €</span></div>
            <button onClick={() => { onPedir({ metodo, propina, total: total + envio + propina }); setOpen(false); }} style={{ width: "100%", marginTop: 16, padding: "16px 0", borderRadius: 14, border: "none", background: "var(--c-primary)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Pedir ahora — {(total + envio + propina).toFixed(2)} €</button>
          </div>
        </div>
      )}
    </>
  );
}

// --- TRACKING ---
function Tracking({ onClose }) {
  const [etapa, setEtapa] = useState(0);
  const [riderPos, setRiderPos] = useState(0);
  const rider = RIDERS_ACTIVOS[0];
  const etapas = [
    { label: "Pedido recibido", desc: "El restaurante ha recibido tu pedido", icon: "📋" },
    { label: "En preparación", desc: "Se está preparando tu pedido", icon: "👨‍🍳" },
    { label: "Listo", desc: `${rider.nombre} va al restaurante`, icon: "🏪" },
    { label: "En camino", desc: `${rider.nombre} trae tu pedido`, icon: "🛵" },
    { label: "Entregado", desc: "Tu pedido ha llegado", icon: "✅" },
  ];

  useEffect(() => {
    if (etapa === 3) {
      const i = setInterval(() => setRiderPos(p => Math.min(p + 2, 100)), 200);
      return () => clearInterval(i);
    }
  }, [etapa]);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: 0 }}>Tu pedido</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 600, color: "var(--c-primary)", cursor: "pointer", fontFamily: "inherit" }}>Cerrar</button>
      </div>
      {/* Mapa con animación del rider */}
      <div style={{ height: 180, borderRadius: 16, background: "linear-gradient(135deg, #E8F5E9, #C8E6C9)", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "10%", width: "80%", height: 3, background: "rgba(0,0,0,0.1)", borderRadius: 2 }} />
        <div style={{ position: "absolute", top: 30, left: "12%", fontSize: 24 }}>🏪</div>
        <div style={{ position: "absolute", top: 30, right: "12%", fontSize: 24 }}>🏠</div>
        {etapa >= 3 && (
          <div style={{ position: "absolute", top: "42%", left: `${10 + riderPos * 0.8}%`, fontSize: 28, transition: "left 0.2s", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>🛵</div>
        )}
        {etapa < 3 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", background: "rgba(255,255,255,0.8)", padding: "6px 14px", borderRadius: 8 }}>
              {etapa === 0 ? "Esperando confirmación..." : etapa === 1 ? "Preparando tu pedido..." : "Buscando repartidor..."}
            </div>
          </div>
        )}
        <div style={{ position: "absolute", bottom: 10, left: 12, background: "rgba(0,0,0,0.7)", color: "#fff", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 600 }}>
          Estimado: {etapa < 3 ? "22 min" : etapa === 4 ? "Entregado" : `${Math.max(1, Math.round(22 * (1 - riderPos / 100)))} min`}
        </div>
      </div>
      {/* Repartidor info */}
      {etapa >= 2 && etapa < 5 && (
        <div style={{ background: "var(--c-surface)", borderRadius: 14, padding: "14px 16px", border: "1px solid var(--c-border)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--c-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛵</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)" }}>{rider.nombre}</div>
            <div style={{ fontSize: 11, color: "var(--c-muted)" }}>★ {rider.rating} · Tu repartidor</div>
          </div>
          <button style={{ width: 38, height: 38, borderRadius: 10, background: "var(--c-primary-light)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          </button>
        </div>
      )}
      {/* Etapas */}
      <div style={{ marginBottom: 20 }}>
        {etapas.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: i <= etapa ? "var(--c-primary)" : "var(--c-surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "all 0.3s" }}>{i <= etapa ? e.icon : ""}</div>
              {i < 4 && <div style={{ width: 2, height: 24, background: i < etapa ? "var(--c-primary)" : "var(--c-border)" }} />}
            </div>
            <div style={{ paddingTop: 4, paddingBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: i <= etapa ? "var(--c-text)" : "var(--c-muted)" }}>{e.label}</div>
              <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{e.desc}</div>
            </div>
          </div>
        ))}
      </div>
      {etapa < 4 && <button onClick={() => { setEtapa(etapa + 1); setRiderPos(0); }} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1px solid var(--c-border)", background: "var(--c-surface)", color: "var(--c-text)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Simular siguiente →</button>}
      {etapa === 4 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 10 }}>¿Cómo fue tu experiencia?</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>{[1,2,3,4,5].map(i => <button key={i} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-surface)", cursor: "pointer", fontSize: 16 }}>★</button>)}</div>
        </div>
      )}
    </div>
  );
}

// --- MAPA ---
function MapaView() {
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 16px" }}>Mapa</h2>
      <div style={{ height: 300, borderRadius: 16, background: "linear-gradient(135deg, #E3F2FD, #BBDEFB)", position: "relative", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🗺️</div>
        <div style={{ position: "absolute", top: "30%", left: "20%", fontSize: 22 }}>🍕</div>
        <div style={{ position: "absolute", top: "45%", left: "55%", fontSize: 22 }}>🍔</div>
        <div style={{ position: "absolute", top: "25%", left: "70%", fontSize: 22 }}>🍣</div>
        <div style={{ position: "absolute", top: "60%", left: "35%", fontSize: 22 }}>🍰</div>
        <div style={{ position: "absolute", top: "55%", left: "65%", fontSize: 22 }}>🫓</div>
        {RIDERS_ACTIVOS.map((r, i) => (
          <div key={r.id} style={{ position: "absolute", top: `${30 + i * 15}%`, left: `${25 + i * 20}%`, background: "var(--c-primary)", borderRadius: 8, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            <span style={{ fontSize: 12 }}>🛵</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>{r.nombre.split(" ")[0]}</span>
          </div>
        ))}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 200, height: 200, borderRadius: "50%", border: "2px dashed var(--c-primary)", opacity: 0.3 }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 20 }}>📍</div>
        <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.7)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 10, fontWeight: 600 }}>Radio: 10 km · {RIDERS_ACTIVOS.length} riders activos</div>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--c-text)", marginBottom: 10 }}>Riders activos</h3>
      {RIDERS_ACTIVOS.map(r => (
        <div key={r.id} style={{ background: "var(--c-surface)", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--c-border)", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--c-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛵</div>
          <div><div style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)" }}>{r.nombre}</div><div style={{ fontSize: 11, color: "var(--c-muted)" }}>★ {r.rating} · Activo</div></div>
          <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: 4, background: "#16A34A", boxShadow: "0 0 6px rgba(22,163,74,0.5)" }} />
        </div>
      ))}
    </div>
  );
}

// --- FAVORITOS ---
function Favoritos({ favoritos, onOpenRest, toggleFav }) {
  const favRests = RESTAURANTES.filter(r => favoritos.includes(r.id));
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 16px" }}>Favoritos</h2>
      {favRests.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: "var(--c-muted)" }}><div style={{ fontSize: 32, marginBottom: 8 }}>❤️</div><div style={{ fontSize: 14, fontWeight: 600 }}>Aún no tienes favoritos</div><div style={{ fontSize: 12, marginTop: 4 }}>Toca el corazón en un restaurante</div></div>}
      {favRests.map(r => (
        <div key={r.id} onClick={() => onOpenRest(r)} style={{ background: "var(--c-surface)", borderRadius: 14, padding: "14px 16px", border: "1px solid var(--c-border)", marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: "var(--c-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{r.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)" }}>{r.nombre}</div>
            <div style={{ fontSize: 11, color: "var(--c-muted)", display: "flex", gap: 8 }}><Stars rating={r.rating} size={11} /><span>⏱ {r.tiempo} min</span></div>
          </div>
          <button onClick={e => { e.stopPropagation(); toggleFav(r.id); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>❤️</button>
        </div>
      ))}
    </div>
  );
}

// --- NOTIFICACIONES ---
function Notificaciones() {
  const [notifs, setNotifs] = useState(USUARIO.notificaciones);
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 16px" }}>Notificaciones</h2>
      {notifs.map(n => (
        <div key={n.id} onClick={() => setNotifs(p => p.map(x => x.id === n.id ? { ...x, leida: true } : x))} style={{ background: n.leida ? "var(--c-surface)" : "var(--c-primary-light)", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--c-border)", marginBottom: 8, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)" }}>{n.titulo}</span>
            {!n.leida && <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--c-primary)" }} />}
          </div>
          <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{n.desc}</div>
          <div style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 4 }}>{n.hora}</div>
        </div>
      ))}
    </div>
  );
}

// --- PEDIDOS ---
function MisPedidos() {
  return (
    <div><h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)", margin: "0 0 16px" }}>Mis pedidos</h2>
      {[{ id: "PD-1247", rest: "Pizzería Don Mario", total: 28.90, fecha: "Hoy, 14:32", estado: "Entregado" },
        { id: "PD-1240", rest: "Sushi Zen", total: 32.00, fecha: "Ayer, 20:10", estado: "Entregado" },
        { id: "PD-1235", rest: "La Ricarepa", total: 15.50, fecha: "23 Mar", estado: "Entregado" },
      ].map(p => (
        <div key={p.id} style={{ background: "var(--c-surface)", borderRadius: 14, padding: "14px 16px", border: "1px solid var(--c-border)", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)" }}>{p.rest}</span>
            <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{p.estado}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--c-muted)" }}><span>{p.fecha}</span><span style={{ fontWeight: 700, color: "var(--c-text)" }}>{p.total.toFixed(2)} €</span></div>
          <button style={{ width: "100%", marginTop: 10, padding: "8px 0", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--c-primary)" }}>Repetir pedido</button>
        </div>
      ))}</div>
  );
}

// --- PERFIL ---
function Perfil() {
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12 }}>E</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--c-text)" }}>{USUARIO.nombre} {USUARIO.apellido}</div>
        <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 2 }}>{USUARIO.email}</div>
      </div>
      <div style={{ background: "var(--c-surface)", borderRadius: 14, border: "1px solid var(--c-border)" }}>
        {["Mis direcciones", "Métodos de pago", "Promociones", "Configuración", "Ayuda", "Cerrar sesión"].map((item, i) => (
          <button key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "14px 18px", border: "none", background: "transparent", borderBottom: i < 5 ? "1px solid var(--c-border)" : "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: item === "Cerrar sesión" ? "#991B1B" : "var(--c-text)", textAlign: "left" }}>{item}<span style={{ color: "var(--c-muted)", fontSize: 16 }}>›</span></button>
        ))}
      </div>
    </div>
  );
}

// --- APP ---
export default function AppPido() {
  const [loggedIn, setLoggedIn] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [categoriaPadre, setCategoriaPadre] = useState(null);
  const [sec, setSec] = useState("home");
  const [restOpen, setRestOpen] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [catAct, setCatAct] = useState(null);
  const [busq, setBusq] = useState("");
  const [pedidoAct, setPedidoAct] = useState(null);
  const [favoritos, setFavoritos] = useState(USUARIO.favoritos);
  const notifsNoLeidas = USUARIO.notificaciones.filter(n => !n.leida).length;

  const toggleFav = id => setFavoritos(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const addItem = item => { if (carrito.length > 0 && carrito[0].restaurante_id !== item.restaurante_id) { setCarrito([item]); return; } setCarrito(p => [...p, item]); };
  const hacerPedido = d => { setPedidoAct(d); setCarrito([]); setSec("tracking"); };
  const abrirRest = r => { setRestOpen(r); setSec("home"); };

  const cssVars = { "--c-primary": "#FF6B2C", "--c-primary-light": "#FFF3ED", "--c-primary-soft": "#FFD6C0", "--c-bg": "#FAFAF8", "--c-surface": "#FFFFFF", "--c-surface2": "#F3F2EF", "--c-border": "#E8E6E1", "--c-text": "#1A1A18", "--c-muted": "#8C8A85" };
  const baseStyle = { ...cssVars, fontFamily: "'DM Sans', sans-serif", maxWidth: 420, margin: "0 auto", background: "var(--c-bg)" };
  const globalCss = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap'); @keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } } @keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } } @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} } * { box-sizing:border-box; margin:0; padding:0 } ::-webkit-scrollbar { display:none }`;

  // Login
  if (!loggedIn) return (
    <div style={baseStyle}>
      <style>{globalCss}</style>
      <Login onLogin={() => setLoggedIn(true)} />
    </div>
  );

  // Onboarding (permisos + selector de categoría)
  if (!onboarded) return (
    <div style={baseStyle}>
      <style>{globalCss}</style>
      <Onboarding onComplete={(cat) => { setCategoriaPadre(cat); setOnboarded(true); }} />
    </div>
  );

  const nav = [
    { id: "home", l: "Inicio", i: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: "favoritos", l: "Favoritos", i: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
    { id: "mapa", l: "Mapa", i: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> },
    { id: "pedidos", l: "Pedidos", i: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg> },
    { id: "perfil", l: "Perfil", i: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  return (
    <div style={{ "--c-primary": "#FF6B2C", "--c-primary-light": "#FFF3ED", "--c-primary-soft": "#FFD6C0", "--c-bg": "#FAFAF8", "--c-surface": "#FFFFFF", "--c-surface2": "#F3F2EF", "--c-border": "#E8E6E1", "--c-text": "#1A1A18", "--c-muted": "#8C8A85", fontFamily: "'DM Sans', sans-serif", maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: "var(--c-bg)", color: "var(--c-text)", position: "relative", paddingBottom: 80 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap'); @keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } } @keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } } @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} } * { box-sizing:border-box; margin:0; padding:0 } ::-webkit-scrollbar { display:none }`}</style>
      {/* Header */}
      <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 24, color: "var(--c-primary)", letterSpacing: -1 }}>pidoo</div>
          <button onClick={() => setOnboarded(false)} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
            borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-surface2)",
            fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: "var(--c-text)",
          }}>
            {categoriaPadre === "comida" ? "🍕" : categoriaPadre === "farmacia" ? "💊" : "🛒"}
            {categoriaPadre === "comida" ? " Comida" : categoriaPadre === "farmacia" ? " Farmacia" : " Market"}
            <span style={{ fontSize: 8, marginLeft: 2, color: "var(--c-muted)" }}>▼</span>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {pedidoAct && <button onClick={() => setSec("tracking")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 10, border: "none", background: "#DCFCE7", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: "#166534" }}><span style={{ width: 6, height: 6, borderRadius: 3, background: "#16A34A", animation: "pulse 1.5s infinite" }} />En curso</button>}
          <button onClick={() => setSec("notificaciones")} style={{ width: 34, height: 34, borderRadius: 10, background: "var(--c-surface2)", border: "none", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-text)" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            {notifsNoLeidas > 0 && <span style={{ position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: 8, background: "var(--c-primary)", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{notifsNoLeidas}</span>}
          </button>
        </div>
      </div>
      <div style={{ padding: "20px", animation: "fadeIn 0.3s ease" }}>
        {sec === "tracking" && pedidoAct ? <Tracking onClose={() => setSec("home")} />
          : restOpen && sec === "home" ? <RestDetalle r={restOpen} onBack={() => setRestOpen(null)} onAddItem={addItem} />
          : sec === "home" ? <Home onOpenRest={abrirRest} catActiva={catAct} setCatActiva={setCatAct} busqueda={busq} setBusqueda={setBusq} favoritos={favoritos} toggleFav={toggleFav} />
          : sec === "favoritos" ? <Favoritos favoritos={favoritos} onOpenRest={abrirRest} toggleFav={toggleFav} />
          : sec === "mapa" ? <MapaView />
          : sec === "pedidos" ? <MisPedidos />
          : sec === "notificaciones" ? <Notificaciones />
          : sec === "perfil" ? <Perfil /> : null}
      </div>
      <Carrito carrito={carrito} setCarrito={setCarrito} onPedir={hacerPedido} />
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: "var(--c-surface)", borderTop: "1px solid var(--c-border)", display: "flex", justifyContent: "space-around", padding: "6px 0 10px", zIndex: 40 }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => { setSec(n.id); setRestOpen(null); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: sec === n.id ? "var(--c-primary)" : "var(--c-muted)", fontSize: 9, fontWeight: 600, padding: "4px 10px" }}>
            {n.i}{n.l}
          </button>
        ))}
      </div>
    </div>
  );
}

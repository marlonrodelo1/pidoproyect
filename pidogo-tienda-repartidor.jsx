import { useState, useRef } from "react";

const RIDER = {
  nombre: "Juanito Express",
  slug: "juanito-express",
  logo: null,
  banner: null,
  activo: true,
  modoEntrega: "recogida",
  radioKm: 10,
  rating: 4.7,
  totalResenas: 128,
  resenas: [
    { id: 1, autor: "María G.", texto: "Siempre puntual y muy amable. Mejor repartidor de la zona.", rating: 5, fecha: "Hace 2 días" },
    { id: 2, autor: "Carlos P.", texto: "Rápido y el pedido llegó perfecto.", rating: 5, fecha: "Hace 1 semana" },
    { id: 3, autor: "Ana R.", texto: "Buen servicio, aunque tardó un poco más de lo esperado.", rating: 4, fecha: "Hace 2 semanas" },
  ],
  redes: {
    instagram: "juanito.express",
    tiktok: "juanitoexpress",
    whatsapp: "+34612345678",
  },
};

const CATEGORIAS = [
  { id: 1, nombre: "Pizzas", emoji: "🍕" },
  { id: 2, nombre: "Hamburguesas", emoji: "🍔" },
  { id: 3, nombre: "Sushi", emoji: "🍣" },
  { id: 4, nombre: "Postres", emoji: "🍰" },
  { id: 5, nombre: "Bebidas", emoji: "🥤" },
];

const ESTABLECIMIENTOS = [
  {
    id: 1, nombre: "Pizzería Don Mario", tipo: "restaurante", categorias: [1], rating: 4.8, totalResenas: 234,
    tiempo: "25-35 min", distanciaKm: 1.2, envio: 2.50, destacado: true, activo: true,
    direccion: "C/ San Fernando 12, Santa Cruz",
    resenas: [
      { id: 10, autor: "Pedro L.", texto: "La mejor pizza de la zona, sin duda.", rating: 5, fecha: "Hace 3 días" },
      { id: 11, autor: "Laura M.", texto: "Buena masa pero el servicio algo lento.", rating: 4, fecha: "Hace 1 semana" },
    ],
    productos: [
      { id: 101, nombre: "Margherita", precio: 9.50, desc: "Tomate, mozzarella, albahaca" },
      { id: 102, nombre: "Pepperoni", precio: 11.00, desc: "Pepperoni, mozzarella, orégano" },
      { id: 103, nombre: "Cuatro Quesos", precio: 12.50, desc: "Mozzarella, gorgonzola, parmesano, emmental" },
    ],
  },
  {
    id: 2, nombre: "Burger Factory", tipo: "restaurante", categorias: [2], rating: 4.6, totalResenas: 189,
    tiempo: "20-30 min", distanciaKm: 0.8, envio: 1.99, destacado: true, activo: true,
    direccion: "Av. Anaga 45, Santa Cruz",
    resenas: [
      { id: 20, autor: "Javi S.", texto: "Hamburguesas brutales. La BBQ Bacon es top.", rating: 5, fecha: "Hace 5 días" },
    ],
    productos: [
      { id: 201, nombre: "Classic Smash", precio: 8.90, desc: "Carne 150g, cheddar, lechuga, tomate" },
      { id: 202, nombre: "BBQ Bacon", precio: 10.50, desc: "Carne 200g, bacon, cheddar, salsa BBQ" },
      { id: 203, nombre: "Veggie Deluxe", precio: 9.50, desc: "Hamburguesa vegetal, aguacate, rúcula" },
    ],
  },
  {
    id: 3, nombre: "Sushi Zen", tipo: "restaurante", categorias: [3], rating: 4.9, totalResenas: 312,
    tiempo: "30-45 min", distanciaKm: 2.1, envio: 3.00, destacado: true, activo: true,
    direccion: "C/ Castillo 8, Santa Cruz",
    resenas: [
      { id: 30, autor: "Marta K.", texto: "Sushi fresco y bien presentado. Repetiré.", rating: 5, fecha: "Hace 1 día" },
    ],
    productos: [
      { id: 301, nombre: "Mix Salmón 12 pzas", precio: 14.90, desc: "Nigiri, maki y uramaki de salmón" },
      { id: 302, nombre: "Dragon Roll", precio: 12.00, desc: "Langostino, aguacate, sésamo" },
    ],
  },
  {
    id: 4, nombre: "Dulce Tentación", tipo: "restaurante", categorias: [4, 5], rating: 4.5, totalResenas: 97,
    tiempo: "15-25 min", distanciaKm: 0.5, envio: 1.50, destacado: false, activo: true,
    direccion: "Plaza del Príncipe 3, Santa Cruz",
    resenas: [],
    productos: [
      { id: 401, nombre: "Tarta de queso", precio: 5.50, desc: "Horneada estilo NY" },
      { id: 402, nombre: "Tiramisú", precio: 6.00, desc: "Mascarpone, café, cacao" },
      { id: 403, nombre: "Smoothie tropical", precio: 4.50, desc: "Mango, piña, maracuyá" },
    ],
  },
  {
    id: 5, nombre: "La Ricarepa", tipo: "restaurante", categorias: [2], rating: 4.7, totalResenas: 156,
    tiempo: "20-30 min", distanciaKm: 1.5, envio: 2.00, destacado: false, activo: true,
    direccion: "C/ Bethencourt Alfonso 22, Santa Cruz",
    resenas: [
      { id: 50, autor: "Diego V.", texto: "Arepas como en Venezuela. Increíbles.", rating: 5, fecha: "Hace 4 días" },
    ],
    productos: [
      { id: 501, nombre: "Arepa Reina Pepiada", precio: 7.50, desc: "Pollo, aguacate, mayonesa" },
      { id: 502, nombre: "Arepa Pabellón", precio: 8.00, desc: "Carne mechada, caraotas, plátano, queso" },
    ],
  },
];

const esRecogida = RIDER.modoEntrega === "recogida";

// --- COMPONENTES ---

function Stars({ rating, size = 12 }) {
  return (
    <span style={{ color: "#F59E0B", fontSize: size, letterSpacing: 1 }}>
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      <span style={{ color: "var(--c-muted)", marginLeft: 4, fontSize: size }}>{rating}</span>
    </span>
  );
}

function Badge({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", borderRadius: 50, border: "none",
      background: active ? "var(--c-accent)" : "var(--c-surface2)",
      color: active ? "#fff" : "var(--c-text)",
      fontSize: 13, fontWeight: 600, cursor: "pointer",
      transition: "all 0.2s ease", whiteSpace: "nowrap", fontFamily: "inherit",
    }}>
      {children}
    </button>
  );
}

function BannerPidoApp() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1A1A18 0%, #2D2D2A 100%)",
      borderRadius: 14, padding: "14px 16px", marginBottom: 20,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: "var(--c-accent)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <span style={{ fontSize: 18 }}>🛵</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
          Estos pedidos son para recoger
        </div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 2 }}>
          ¿Quieres entrega a domicilio?
        </div>
      </div>
      <button style={{
        background: "var(--c-accent)", border: "none", borderRadius: 10,
        padding: "8px 14px", color: "#fff", fontSize: 12, fontWeight: 700,
        cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
      }}>
        Ir a PIDO
      </button>
    </div>
  );
}

function ModoEntregaBadge({ modo, radioKm }) {
  const config = {
    recogida: { label: "Solo recogida", icon: "🏪", bg: "#FEF3C7", color: "#92400E" },
    reparto: { label: `Reparto · ${radioKm} km`, icon: "🛵", bg: "#DCFCE7", color: "#166534" },
    ambos: { label: `Recogida y reparto · ${radioKm} km`, icon: "🛵", bg: "#DBEAFE", color: "#1E40AF" },
  };
  const c = config[modo];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: c.bg, color: c.color, fontSize: 12, fontWeight: 700,
      padding: "6px 14px", borderRadius: 50, marginTop: 8,
    }}>
      <span>{c.icon}</span> {c.label}
    </div>
  );
}

function ResenaCard({ r }) {
  return (
    <div style={{
      background: "var(--c-surface)", borderRadius: 12, padding: "14px 16px",
      border: "1px solid var(--c-border)", minWidth: 260, flexShrink: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)" }}>{r.autor}</span>
        <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{r.fecha}</span>
      </div>
      <Stars rating={r.rating} size={11} />
      <p style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 6, lineHeight: 1.5 }}>{r.texto}</p>
    </div>
  );
}

function ResenasSection({ titulo, rating, total, resenas }) {
  if (!resenas || resenas.length === 0) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--c-text)", margin: 0 }}>{titulo}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <Stars rating={rating} size={13} />
          <span style={{ color: "var(--c-muted)", fontSize: 12 }}>({total})</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
        {resenas.map((r) => <ResenaCard key={r.id} r={r} />)}
      </div>
    </div>
  );
}

function EstablecimientoCard({ r, onOpen, modoEntrega }) {
  const [hover, setHover] = useState(false);
  const soloRecogida = modoEntrega === "recogida";
  return (
    <div
      onClick={() => onOpen(r)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--c-surface)", borderRadius: 16, overflow: "hidden",
        cursor: "pointer", transition: "transform 0.25s ease, box-shadow 0.25s ease",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hover ? "0 12px 32px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid var(--c-border)",
      }}
    >
      <div style={{
        height: 120, background: "linear-gradient(135deg, var(--c-accent-light), var(--c-accent-soft))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, position: "relative",
      }}>
        <span>{r.categorias.includes(1) ? "🍕" : r.categorias.includes(2) ? "🍔" : r.categorias.includes(3) ? "🍣" : "🍽️"}</span>
        {r.destacado && (
          <span style={{
            position: "absolute", top: 10, left: 10, background: "#F59E0B",
            color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px",
            borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.5,
          }}>Destacado</span>
        )}
        {soloRecogida && (
          <span style={{
            position: "absolute", top: 10, right: 10, background: "#FEF3C7",
            color: "#92400E", fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 6,
          }}>🏪 Recogida</span>
        )}
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "var(--c-text)" }}>{r.nombre}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--c-muted)", flexWrap: "wrap" }}>
          <Stars rating={r.rating} />
          <span style={{ color: "var(--c-border)" }}>·</span>
          <span>⏱ {r.tiempo}</span>
          <span style={{ color: "var(--c-border)" }}>·</span>
          <span>{r.distanciaKm} km</span>
        </div>
        <div style={{
          marginTop: 10, fontSize: 13, fontWeight: 600,
          color: soloRecogida ? "#92400E" : "var(--c-accent)",
        }}>
          {soloRecogida ? "🏪 Recoger en tienda" : `Envío ${r.envio.toFixed(2)} €`}
        </div>
      </div>
    </div>
  );
}

function EstablecimientoDetail({ r, onBack, carrito, setCarrito, modoEntrega }) {
  const soloRecogida = modoEntrega === "recogida";

  const addItem = (p) => {
    setCarrito((prev) => {
      const existing = prev.find((i) => i.id === p.id);
      if (existing) return prev.map((i) => (i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...prev, { ...p, cantidad: 1, restaurante_id: r.id, restaurante_nombre: r.nombre }];
    });
  };

  return (
    <div style={{ animation: "slideIn 0.3s ease" }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: "var(--c-accent)", fontSize: 14,
        fontWeight: 600, cursor: "pointer", marginBottom: 16, padding: 0,
        fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
      }}>← Volver</button>

      <div style={{
        height: 160, background: "linear-gradient(135deg, var(--c-accent-light), var(--c-accent-soft))",
        borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 56, marginBottom: 20,
      }}>
        {r.categorias.includes(1) ? "🍕" : r.categorias.includes(2) ? "🍔" : r.categorias.includes(3) ? "🍣" : "🍽️"}
      </div>

      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "var(--c-text)" }}>{r.nombre}</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6, fontSize: 13, color: "var(--c-muted)", flexWrap: "wrap" }}>
        <Stars rating={r.rating} />
        <span style={{ fontSize: 12 }}>({r.totalResenas} reseñas)</span>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, fontSize: 13, color: "var(--c-muted)" }}>
        <span>⏱ {r.tiempo}</span>
        <span style={{ color: "var(--c-border)" }}>·</span>
        <span>{r.distanciaKm} km</span>
        {!soloRecogida && (
          <>
            <span style={{ color: "var(--c-border)" }}>·</span>
            <span>Envío {r.envio.toFixed(2)} €</span>
          </>
        )}
      </div>

      {soloRecogida && (
        <div style={{
          background: "#FEF3C7", borderRadius: 12, padding: "12px 16px",
          marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <span style={{ fontSize: 18, marginTop: 1 }}>🏪</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#92400E", marginBottom: 2 }}>Recogida en tienda</div>
            <div style={{ fontSize: 12, color: "#A16207", lineHeight: 1.4 }}>{r.direccion}</div>
          </div>
        </div>
      )}

      {soloRecogida && <BannerPidoApp />}

      {/* Carta */}
      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: "var(--c-text)" }}>Carta</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {r.productos.map((p) => {
          const enCarrito = carrito.find((i) => i.id === p.id);
          return (
            <div key={p.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 16px", background: "var(--c-surface)", borderRadius: 12,
              border: "1px solid var(--c-border)",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--c-text)", marginBottom: 2 }}>{p.nombre}</div>
                <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 4 }}>{p.desc}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-accent)" }}>{p.precio.toFixed(2)} €</div>
              </div>
              <button onClick={() => addItem(p)} style={{
                width: 38, height: 38, borderRadius: 10, border: "none",
                background: enCarrito ? "var(--c-accent)" : "var(--c-surface2)",
                color: enCarrito ? "#fff" : "var(--c-accent)",
                fontSize: 20, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {enCarrito ? enCarrito.cantidad : "+"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Reseñas del establecimiento */}
      <ResenasSection
        titulo={`Reseñas de ${r.nombre}`}
        rating={r.rating}
        total={r.totalResenas}
        resenas={r.resenas}
      />
    </div>
  );
}

function Carrito({ carrito, setCarrito, envio, modoEntrega }) {
  const [open, setOpen] = useState(false);
  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const items = carrito.reduce((s, i) => s + i.cantidad, 0);
  const soloRecogida = modoEntrega === "recogida";
  const envioFinal = soloRecogida ? 0 : envio;

  if (items === 0) return null;

  return (
    <>
      <div onClick={() => setOpen(true)} style={{
        position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
        background: "var(--c-accent)", color: "#fff", borderRadius: 16,
        padding: "14px 28px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 20, minWidth: 300, maxWidth: 380,
        cursor: "pointer", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", zIndex: 50, fontFamily: "inherit",
      }}>
        <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 8, padding: "2px 10px", fontWeight: 700, fontSize: 14 }}>{items}</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{soloRecogida ? "Ver pedido" : "Ver carrito"}</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{(total + envioFinal).toFixed(2)} €</span>
      </div>

      {open && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "var(--c-bg)", borderRadius: "24px 24px 0 0",
            padding: "24px 20px 32px", width: "100%", maxWidth: 420,
            maxHeight: "70vh", overflowY: "auto", animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--c-text)" }}>
                {soloRecogida ? "Pedido para recoger" : "Tu pedido"}
              </h3>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--c-muted)", fontFamily: "inherit" }}>×</button>
            </div>

            {soloRecogida && (
              <div style={{
                background: "#FEF3C7", borderRadius: 12, padding: "12px 14px",
                marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
                fontSize: 12, color: "#92400E", fontWeight: 600,
              }}>
                <span style={{ fontSize: 16 }}>🏪</span>
                Deberás recoger tu pedido en el restaurante
              </div>
            )}

            {carrito.map((item) => (
              <div key={item.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 0", borderBottom: "1px solid var(--c-border)",
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--c-text)" }}>{item.nombre}</div>
                  <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{item.restaurante_nombre}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => {
                      setCarrito((prev) => prev.map((i) => (i.id === item.id ? { ...i, cantidad: Math.max(0, i.cantidad - 1) } : i)).filter((i) => i.cantidad > 0));
                    }} style={{
                      width: 28, height: 28, borderRadius: 8, border: "1px solid var(--c-border)",
                      background: "var(--c-surface)", cursor: "pointer", fontSize: 16, fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-text)",
                    }}>−</button>
                    <span style={{ fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: "center", color: "var(--c-text)" }}>{item.cantidad}</span>
                    <button onClick={() => {
                      setCarrito((prev) => prev.map((i) => (i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i)));
                    }} style={{
                      width: 28, height: 28, borderRadius: 8, border: "1px solid var(--c-border)",
                      background: "var(--c-surface)", cursor: "pointer", fontSize: 16, fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-text)",
                    }}>+</button>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, minWidth: 60, textAlign: "right", color: "var(--c-text)" }}>
                    {(item.precio * item.cantidad).toFixed(2)} €
                  </span>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16, fontSize: 13, color: "var(--c-muted)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Subtotal</span><span>{total.toFixed(2)} €</span>
              </div>
              {soloRecogida ? (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#16A34A" }}>
                  <span>Envío</span><span style={{ fontWeight: 600 }}>Gratis (recogida)</span>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>Envío</span><span>{envio.toFixed(2)} €</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, marginTop: 12, paddingTop: 12, borderTop: "2px solid var(--c-border)", color: "var(--c-text)" }}>
              <span>Total</span><span>{(total + envioFinal).toFixed(2)} €</span>
            </div>

            <button style={{
              width: "100%", marginTop: 20, padding: "16px 0", borderRadius: 14,
              border: "none", background: "var(--c-accent)", color: "#fff",
              fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>
              {soloRecogida ? `Pedir para recoger — ${total.toFixed(2)} €` : `Hacer pedido — ${(total + envioFinal).toFixed(2)} €`}
            </button>

            {soloRecogida && (
              <div style={{
                marginTop: 14, background: "var(--c-surface2)", borderRadius: 12,
                padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>🛵</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)" }}>¿Quieres que te lo lleven?</div>
                  <div style={{ fontSize: 11, color: "var(--c-muted)" }}>Pide desde la app PIDO</div>
                </div>
                <button style={{
                  background: "var(--c-accent)", border: "none", borderRadius: 8,
                  padding: "6px 12px", color: "#fff", fontSize: 11, fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
                }}>Abrir PIDO</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ShareModal({ slug, onClose }) {
  const url = `pido.com/${slug}`;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--c-bg)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 340,
        animation: "slideUp 0.3s ease",
      }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, textAlign: "center", color: "var(--c-text)" }}>Compartir tienda</h3>
        <div style={{
          background: "var(--c-surface2)", borderRadius: 12, padding: "12px 16px",
          textAlign: "center", marginBottom: 20, fontSize: 14, fontWeight: 600, color: "var(--c-accent)",
          wordBreak: "break-all",
        }}>{url}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { name: "WhatsApp", icon: "💬" },
            { name: "Instagram", icon: "📸" },
            { name: "Copiar enlace", icon: "🔗" },
            { name: "Código QR", icon: "📱" },
          ].map((s) => (
            <button key={s.name} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px",
              borderRadius: 12, border: "1px solid var(--c-border)", background: "var(--c-surface)",
              cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", color: "var(--c-text)",
            }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>{s.name}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{
          width: "100%", marginTop: 16, padding: "12px 0", borderRadius: 12, border: "none",
          background: "var(--c-surface2)", color: "var(--c-muted)", fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>Cerrar</button>
      </div>
    </div>
  );
}

// --- APP PRINCIPAL ---

export default function PidogoTienda() {
  const [catActiva, setCatActiva] = useState(null);
  const [establecimientoOpen, setEstablecimientoOpen] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [showRiderReviews, setShowRiderReviews] = useState(false);

  const destacados = ESTABLECIMIENTOS.filter((r) => r.destacado);
  const filtrados = catActiva
    ? ESTABLECIMIENTOS.filter((r) => r.categorias.includes(catActiva))
    : ESTABLECIMIENTOS;

  const envioActual = establecimientoOpen ? establecimientoOpen.envio : 2.0;

  return (
    <div style={{
      "--c-accent": "#FF5733", "--c-accent-light": "#FFF0EC", "--c-accent-soft": "#FFD6CC",
      "--c-bg": "#FAFAF8", "--c-surface": "#FFFFFF", "--c-surface2": "#F3F2EF",
      "--c-border": "#E8E6E1", "--c-text": "#1A1A18", "--c-muted": "#8C8A85",
      fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, sans-serif",
      maxWidth: 420, margin: "0 auto", minHeight: "100vh",
      background: "var(--c-bg)", color: "var(--c-text)", position: "relative", paddingBottom: 80,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Banner */}
      <div style={{
        height: 180, background: "linear-gradient(135deg, #FF5733 0%, #FF8F73 50%, #FFC4A8 100%)",
        position: "relative", display: "flex", alignItems: "flex-end", padding: "0 20px 16px",
      }}>
        <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8 }}>
          {RIDER.redes.instagram && (
            <a href={`https://instagram.com/${RIDER.redes.instagram}`} target="_blank" rel="noopener noreferrer"
              style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="#fff" stroke="none"/>
              </svg>
            </a>
          )}
          {RIDER.redes.tiktok && (
            <a href={`https://tiktok.com/@${RIDER.redes.tiktok}`} target="_blank" rel="noopener noreferrer"
              style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.8a4.84 4.84 0 01-1-.11z"/>
              </svg>
            </a>
          )}
          {RIDER.redes.whatsapp && (
            <a href={`https://wa.me/${RIDER.redes.whatsapp.replace(/\+/g, "")}`} target="_blank" rel="noopener noreferrer"
              style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.216l-.257-.154-2.874.854.854-2.874-.154-.257A8 8 0 1112 20z"/>
              </svg>
            </a>
          )}
        </div>
        <button onClick={() => setShareOpen(true)} style={{
          position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.25)",
          border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer",
          fontSize: 12, fontWeight: 600, color: "#fff", backdropFilter: "blur(8px)", fontFamily: "inherit",
        }}>Compartir ↗</button>
      </div>

      {/* Logo + Nombre + Rating + Modo entrega */}
      <div style={{ padding: "0 20px", marginTop: -48, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 10 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 22, background: "#fff",
          border: "4px solid #fff", boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, fontWeight: 800, color: "var(--c-accent)",
        }}>J</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 12, letterSpacing: -0.5, textAlign: "center" }}>
          {RIDER.nombre}
        </h1>
        <p style={{ fontSize: 13, color: "var(--c-muted)", marginTop: 2, textAlign: "center" }}>
          pido.com/{RIDER.slug}
        </p>

        {/* Rating del rider clicable */}
        <button
          onClick={() => setShowRiderReviews(!showRiderReviews)}
          style={{
            display: "flex", alignItems: "center", gap: 6, marginTop: 8,
            background: "var(--c-surface)", border: "1px solid var(--c-border)",
            borderRadius: 50, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <Stars rating={RIDER.rating} size={13} />
          <span style={{ fontSize: 12, color: "var(--c-muted)" }}>({RIDER.totalResenas} reseñas)</span>
          <span style={{ fontSize: 10, color: "var(--c-muted)", transform: showRiderReviews ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
        </button>

        <ModoEntregaBadge modo={RIDER.modoEntrega} radioKm={RIDER.radioKm} />
      </div>

      {/* Contenido */}
      <div style={{ padding: "0 20px", marginTop: 20 }}>

        {/* Reseñas del rider (expandibles) */}
        {showRiderReviews && !establecimientoOpen && (
          <div style={{ animation: "fadeIn 0.3s ease", marginBottom: 20 }}>
            <ResenasSection
              titulo="Reseñas de Juanito Express"
              rating={RIDER.rating}
              total={RIDER.totalResenas}
              resenas={RIDER.resenas}
            />
          </div>
        )}

        {establecimientoOpen ? (
          <EstablecimientoDetail
            r={establecimientoOpen}
            onBack={() => setEstablecimientoOpen(null)}
            carrito={carrito}
            setCarrito={setCarrito}
            modoEntrega={RIDER.modoEntrega}
          />
        ) : (
          <>
            {esRecogida && <BannerPidoApp />}

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 24 }}>
              <Badge active={catActiva === null} onClick={() => setCatActiva(null)}>Todos</Badge>
              {CATEGORIAS.map((c) => (
                <Badge key={c.id} active={catActiva === c.id} onClick={() => setCatActiva(c.id)}>
                  {c.emoji} {c.nombre}
                </Badge>
              ))}
            </div>

            {catActiva === null && destacados.length > 0 && (
              <div style={{ marginBottom: 28, animation: "fadeIn 0.4s ease" }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14, letterSpacing: -0.3 }}>Restaurantes destacados</h2>
                <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
                  {destacados.map((r) => (
                    <div key={r.id} style={{ minWidth: 220, flexShrink: 0 }}>
                      <EstablecimientoCard r={r} onOpen={setEstablecimientoOpen} modoEntrega={RIDER.modoEntrega} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ animation: "fadeIn 0.4s ease 0.1s both" }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14, letterSpacing: -0.3 }}>
                {catActiva ? "Restaurantes" : "Todos los restaurantes"}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {filtrados.map((r) => (
                  <EstablecimientoCard key={r.id} r={r} onOpen={setEstablecimientoOpen} modoEntrega={RIDER.modoEntrega} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Carrito carrito={carrito} setCarrito={setCarrito} envio={envioActual} modoEntrega={RIDER.modoEntrega} />
      {shareOpen && <ShareModal slug={RIDER.slug} onClose={() => setShareOpen(false)} />}
    </div>
  );
}

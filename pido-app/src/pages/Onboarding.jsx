import { useState, useEffect } from 'react'

const CATS = [
  { id: 'comida', nombre: 'Comida', emoji: '🍕', desc: 'Restaurantes y cafeterías', color: '#FF6B2C', bg: 'linear-gradient(135deg, #FFF3ED 0%, #FFE0CC 100%)' },
  { id: 'farmacia', nombre: 'Farmacia', emoji: '💊', desc: 'Medicamentos e higiene', color: '#16A34A', bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' },
  { id: 'marketplace', nombre: 'Marketplace', emoji: '🛒', desc: 'Minimarkets y tiendas', color: '#2563EB', bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' },
]

const ANIMATIONS = `
@keyframes float1{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(12px,-18px) rotate(8deg)}66%{transform:translate(-8px,10px) rotate(-5deg)}}
@keyframes float2{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(-15px,12px) rotate(-10deg)}66%{transform:translate(10px,-14px) rotate(6deg)}}
@keyframes float3{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(8px,16px) rotate(12deg)}66%{transform:translate(-12px,-10px) rotate(-8deg)}}
@keyframes logoIn{from{opacity:0;transform:scale(0.5) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes textIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes cardIn0{from{opacity:0;transform:translateX(-40px) scale(0.9)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes cardIn1{from{opacity:0;transform:translateY(40px) scale(0.9)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes cardIn2{from{opacity:0;transform:translateX(40px) scale(0.9)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes emojiBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
`

const EMOJIS = ['🍕','🍔','🍣','💊','🛒','🥤','🍰','🫓','☕']

export default function Onboarding({ onComplete }) {
  const [ready, setReady] = useState(false)
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      <style>{ANIMATIONS}</style>

      {/* Emojis flotantes */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {EMOJIS.map((e, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${10 + (i * 11) % 80}%`, left: `${5 + (i * 13) % 90}%`,
            fontSize: 24 + (i % 3) * 8, opacity: 0.08,
            animation: `float${(i % 3) + 1} ${4 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}>{e}</div>
        ))}
      </div>

      {/* Logo */}
      <div style={{
        fontSize: 56, fontWeight: 800, color: 'var(--c-primary)', letterSpacing: -3,
        animation: ready ? 'logoIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
        opacity: ready ? 1 : 0, marginBottom: 6,
      }}>pidoo</div>

      <p style={{
        fontSize: 18, color: 'var(--c-text)', fontWeight: 800, textAlign: 'center',
        animation: ready ? 'textIn 0.5s ease 0.2s both' : 'none', opacity: 0, marginBottom: 4,
      }}>¿Qué necesitas hoy?</p>
      <p style={{
        fontSize: 13, color: 'var(--c-muted)', textAlign: 'center',
        animation: ready ? 'textIn 0.5s ease 0.35s both' : 'none', opacity: 0, marginBottom: 36,
      }}>Elige y te llevamos lo que quieras</p>

      {/* Tarjetas */}
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
        {CATS.map((c, i) => (
          <button key={c.id} onClick={() => onComplete(c.id)}
            onMouseEnter={() => setHovered(c.id)} onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, width: '100%',
              padding: '22px 20px', borderRadius: 20,
              border: hovered === c.id ? `2px solid ${c.color}` : '2px solid transparent',
              background: c.bg, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              transform: hovered === c.id ? 'scale(1.03)' : 'scale(1)',
              boxShadow: hovered === c.id ? `0 8px 30px ${c.color}22` : '0 2px 10px rgba(0,0,0,0.04)',
              transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border 0.2s ease',
              animation: ready ? `cardIn${i} 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.4 + i * 0.12}s both` : 'none',
              opacity: 0,
            }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              animation: hovered === c.id ? 'emojiBounce 0.4s ease' : 'none', flexShrink: 0,
            }}>{c.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: c.color, marginBottom: 2 }}>{c.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{c.desc}</div>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: hovered === c.id ? c.color : 'rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.25s ease', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={hovered === c.id ? '#fff' : c.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </button>
        ))}
      </div>

      <div style={{
        width: 120, height: 4, borderRadius: 2, marginTop: 32,
        background: 'linear-gradient(90deg, transparent, var(--c-primary), transparent)',
        backgroundSize: '200% 100%',
        animation: ready ? 'shimmer 2.5s ease-in-out infinite 1s' : 'none', opacity: 0.3,
      }} />
    </div>
  )
}

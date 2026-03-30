import { useState } from 'react'
import { Bell } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import RestDetalle from './pages/RestDetalle'
import Carrito from './pages/Carrito'
import Tracking from './pages/Tracking'
import Favoritos from './pages/Favoritos'
import Mapa from './pages/Mapa'
import MisPedidos from './pages/MisPedidos'
import Notificaciones from './pages/Notificaciones'
import Perfil from './pages/Perfil'
import SerSocio from './pages/SerSocio'
import BottomNav from './components/BottomNav'
import TiendaSocio from './pages/TiendaSocio'

function AppContent() {
  const { user, loading } = useAuth()
  const [onboarded, setOnboarded] = useState(false)
  const [categoriaPadre, setCategoriaPadre] = useState(null)
  const [seccion, setSeccion] = useState('home')
  const [restOpen, setRestOpen] = useState(null)
  const [pedidoActivo, setPedidoActivo] = useState(null)
  const [notifsNoLeidas] = useState(0)

  if (loading) {
    return (
      <div style={{ ...shellStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--c-primary)', letterSpacing: -2 }}>pidoo</div>
      </div>
    )
  }

  // Login obligatorio
  if (!user) {
    return <div style={shellStyle}><style>{globalCss}</style><Login /></div>
  }

  // Onboarding
  if (!onboarded) {
    return (
      <div style={shellStyle}>
        <style>{globalCss}</style>
        <Onboarding onComplete={cat => { setCategoriaPadre(cat); setOnboarded(true) }} />
      </div>
    )
  }

  function abrirRest(r) { setRestOpen(r); setSeccion('home') }
  function handlePedidoCreado(pedido) { setPedidoActivo(pedido); setSeccion('tracking') }
  function handleTrack(pedido) { setPedidoActivo(pedido); setSeccion('tracking') }

  const catEmoji = categoriaPadre === 'comida' ? '🍕' : categoriaPadre === 'farmacia' ? '💊' : '🛒'
  const catLabel = categoriaPadre === 'comida' ? 'Comida' : categoriaPadre === 'farmacia' ? 'Farmacia' : 'Market'

  return (
    <div style={{ ...shellStyle, minHeight: '100vh', position: 'relative', paddingBottom: 90 }}>
      <style>{globalCss}</style>

      {/* Header */}
      <div style={{
        padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 24, color: 'var(--c-primary)', letterSpacing: -1 }}>pidoo</div>
          <button onClick={() => setOnboarded(false)} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
            borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-surface2)',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--c-text)',
          }}>
            {catEmoji} {catLabel}
            <span style={{ fontSize: 8, marginLeft: 2, color: 'var(--c-muted)' }}>▼</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pedidoActivo && (
            <button onClick={() => setSeccion('tracking')} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
              borderRadius: 10, border: 'none', background: '#DCFCE7',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#166534',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#16A34A', animation: 'pulse 1.5s infinite' }} />
              En curso
            </button>
          )}
          <button onClick={() => setSeccion('notificaciones')} style={{
            width: 34, height: 34, borderRadius: 10, background: 'var(--c-surface2)',
            border: 'none', cursor: 'pointer', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={18} strokeWidth={1.8} color="var(--c-text)" />
            {notifsNoLeidas > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, background: 'var(--c-primary)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifsNoLeidas}</span>
            )}
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: 20, animation: 'fadeIn 0.3s ease' }}>
        {seccion === 'tracking' && pedidoActivo
          ? <Tracking pedido={pedidoActivo} onClose={() => setSeccion('home')} />
          : restOpen && seccion === 'home'
          ? <RestDetalle establecimiento={restOpen} onBack={() => setRestOpen(null)} />
          : seccion === 'home'
          ? <Home onOpenRest={abrirRest} categoriaPadre={categoriaPadre} onSerSocio={() => setSeccion('ser-socio')} />
          : seccion === 'favoritos'
          ? <Favoritos onOpenRest={abrirRest} />
          : seccion === 'mapa'
          ? <Mapa onOpenRest={abrirRest} />
          : seccion === 'pedidos'
          ? <MisPedidos onTrack={handleTrack} />
          : seccion === 'notificaciones'
          ? <Notificaciones />
          : seccion === 'perfil'
          ? <Perfil />
          : seccion === 'ser-socio'
          ? <SerSocio onClose={() => setSeccion('home')} />
          : null
        }
      </div>

      <Carrito onPedidoCreado={handlePedidoCreado} />
      <BottomNav active={seccion} onChange={s => { setSeccion(s); setRestOpen(null) }} />
    </div>
  )
}

const shellStyle = {
  '--c-primary': '#FF6B2C',
  '--c-primary-light': 'rgba(255,107,44,0.15)',
  '--c-primary-soft': 'rgba(255,107,44,0.25)',
  '--c-bg': '#0D0D0D',
  '--c-surface': 'rgba(255,255,255,0.08)',
  '--c-surface2': 'rgba(255,255,255,0.05)',
  '--c-border': 'rgba(255,255,255,0.1)',
  '--c-text': '#F5F5F5',
  '--c-muted': 'rgba(255,255,255,0.45)',
  '--c-glass': 'rgba(255,255,255,0.06)',
  '--c-glass-border': 'rgba(255,255,255,0.12)',
  fontFamily: "'DM Sans', sans-serif",
  maxWidth: 420,
  margin: '0 auto',
  background: 'var(--c-bg)',
  color: 'var(--c-text)',
}

const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{display:none}
body{background:#0D0D0D;margin:0}
`

function TiendaDetector() {
  const [slugTienda, setSlugTienda] = useState(null)
  const [checking, setChecking] = useState(true)

  useState(() => {
    const path = window.location.pathname.replace(/^\//, '')
    if (path && path !== '') {
      import('./lib/supabase').then(({ supabase }) => {
        supabase.from('socios').select('slug').eq('slug', path).single().then(({ data }) => {
          if (data) setSlugTienda(path)
          setChecking(false)
        }).catch(() => setChecking(false))
      })
    } else {
      setChecking(false)
    }
  })

  if (checking) {
    return (
      <div style={{ ...shellStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <style>{globalCss}</style>
        <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--c-primary)', letterSpacing: -2 }}>pidoo</div>
      </div>
    )
  }

  if (slugTienda) {
    return (
      <div style={{ ...shellStyle, minHeight: '100vh' }}>
        <style>{globalCss}</style>
        <TiendaSocio slug={slugTienda} />
      </div>
    )
  }

  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  )
}

export default function App() {
  return <TiendaDetector />
}

import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { supabase } from './lib/supabase'
import { Bell, Share2 } from 'lucide-react'
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
import PaginaLegal from './pages/PaginaLegal'

function AppContent() {
  const { user, loading } = useAuth()
  const [onboarded, setOnboarded] = useState(false)
  const [categoriaPadre, setCategoriaPadre] = useState(null)
  const [seccion, setSeccion] = useState('home')
  const [restOpen, setRestOpen] = useState(null)
  const [pedidoActivo, setPedidoActivo] = useState(null)
  const [notifsNoLeidas, setNotifsNoLeidas] = useState(0)

  // Cargar y escuchar notificaciones no leídas en tiempo real
  useEffect(() => {
    if (!user) return
    supabase.from('notificaciones').select('id', { count: 'exact', head: true })
      .eq('usuario_id', user.id).eq('leida', false)
      .then(({ count }) => setNotifsNoLeidas(count || 0))
    const ch = supabase.channel('notifs-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${user.id}` },
        () => setNotifsNoLeidas(prev => prev + 1))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user?.id])

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
  function handleTrackingClose() { setPedidoActivo(null); setSeccion('home') }

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
          {pedidoActivo && !['cancelado', 'fallido', 'entregado'].includes(pedidoActivo.estado) && (
            <button onClick={() => setSeccion('tracking')} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
              borderRadius: 10, border: 'none', background: '#DCFCE7',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#166534',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#16A34A', animation: 'pulse 1.5s infinite' }} />
              En curso
            </button>
          )}
          <button onClick={() => { setSeccion('notificaciones'); setNotifsNoLeidas(0) }} style={{
            width: 34, height: 34, borderRadius: 10, background: 'var(--c-surface2)',
            border: 'none', cursor: 'pointer', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={18} strokeWidth={1.8} color="var(--c-text)" />
            {notifsNoLeidas > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, background: 'var(--c-primary)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifsNoLeidas}</span>
            )}
          </button>
          <button onClick={async () => {
            const shareData = { title: 'Pidoo', text: 'Descubre pidoo 🍕 Tus restaurantes, locales y farmacias más cerca. 100% canario 🌴', url: 'https://pidoo.es' }
            if (navigator.share) { try { await navigator.share(shareData) } catch (_) {} }
            else { try { await navigator.clipboard.writeText('https://pidoo.es') } catch (_) {} }
          }} style={{
            width: 34, height: 34, borderRadius: 10, background: 'var(--c-surface2)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Share2 size={18} strokeWidth={1.8} color="var(--c-text)" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="tablet-pad" style={{ padding: 20, animation: 'fadeIn 0.3s ease' }}>
        {seccion === 'tracking' && pedidoActivo
          ? <Tracking pedido={pedidoActivo} onClose={handleTrackingClose} />
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
      <BottomNav active={seccion} onChange={s => {
        setSeccion(s)
        setRestOpen(null)
        if (s === 'notificaciones') setNotifsNoLeidas(0)
      }} />
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
@media(min-width:768px){
  .tablet-grid{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:14px!important}
  .tablet-grid>*{margin-bottom:0!important}
  .tablet-pad{padding:24px 32px!important}
  .tablet-slider-card{min-width:280px!important}
}
@media(min-width:1024px){
  .tablet-grid{grid-template-columns:repeat(3,1fr)!important}
  .tablet-pad{padding:28px 48px!important}
}
`

function TiendaDetector() {
  const [slugTienda, setSlugTienda] = useState(null)
  const [checking, setChecking] = useState(true)
  const [emailConfirmado, setEmailConfirmado] = useState(false)
  const [paginaLegal, setPaginaLegal] = useState(null)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false })
      StatusBar.setBackgroundColor({ color: '#0D0D0D' })
      StatusBar.setStyle({ style: Style.Dark })

      // Capturar deep link de OAuth callback
      CapApp.addListener('appUrlOpen', ({ url }) => {
        if (url.includes('access_token') || url.includes('refresh_token') || url.includes('code=')) {
          // Convertir el deep link scheme a una URL que Supabase pueda parsear
          const parsed = new URL(url)
          const hashOrQuery = parsed.hash || parsed.search
          if (hashOrQuery) {
            const params = new URLSearchParams(hashOrQuery.replace('#', '?').replace('?', ''))
            const access_token = params.get('access_token')
            const refresh_token = params.get('refresh_token')
            if (access_token && refresh_token) {
              supabase.auth.setSession({ access_token, refresh_token })
            }
          }
        }
      })
    }
  }, [])

  // Detectar confirmación de email desde Supabase
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=signup') && !Capacitor.isNativePlatform()) {
      setEmailConfirmado(true)
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    const path = window.location.pathname.replace(/^\//, '')
    // Rutas de páginas legales
    if (path === 'terminos' || path === 'privacidad') {
      setPaginaLegal(path)
      setChecking(false)
      return
    }
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
  }, [])

  if (checking) {
    return (
      <div style={{ ...shellStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <style>{globalCss}</style>
        <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--c-primary)', letterSpacing: -2 }}>pidoo</div>
      </div>
    )
  }

  if (emailConfirmado) {
    return (
      <div style={{ ...shellStyle, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <style>{globalCss}</style>
        <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#F5F5F5', marginBottom: 8, textAlign: 'center' }}>
          Cuenta confirmada
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32, textAlign: 'center', maxWidth: 300, lineHeight: 1.5 }}>
          Tu cuenta ha sido verificada correctamente. Ya puedes iniciar sesion en pidoo.
        </p>
        <a href="es.pidoo.app://login" style={{
          display: 'inline-block', padding: '16px 40px', borderRadius: 14, border: 'none',
          background: '#FF6B2C', color: '#fff', fontSize: 16, fontWeight: 800,
          textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
        }}>
          Abrir la app
        </a>
        <button onClick={() => { setEmailConfirmado(false); window.location.hash = '' }} style={{
          marginTop: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Continuar en la web
        </button>
      </div>
    )
  }

  if (paginaLegal) {
    return (
      <div style={{ ...shellStyle, minHeight: '100vh' }}>
        <style>{globalCss}</style>
        <PaginaLegal slug={paginaLegal} onBack={() => window.history.back()} />
      </div>
    )
  }

  if (slugTienda) {
    return (
      <AuthProvider>
        <div style={{ ...shellStyle, minHeight: '100vh' }}>
          <style>{globalCss}</style>
          <TiendaSocio slug={slugTienda} />
        </div>
      </AuthProvider>
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

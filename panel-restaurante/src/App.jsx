import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Clock, UtensilsCrossed, Users, Settings, BarChart3, Tag } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { supabase } from './lib/supabase'
import { RestProvider, useRest } from './context/RestContext'
import { PedidoAlertProvider, usePedidoAlert } from './context/PedidoAlertContext'
import Login from './pages/Login'
import PedidosEnVivo from './pages/PedidosEnVivo'
import Historial from './pages/Historial'
import Carta from './pages/Carta'
import Socios from './pages/Socios'
import Metricas from './pages/Metricas'
import Ajustes from './pages/Ajustes'
import Promociones from './pages/Promociones'
import './index.css'

const NAV_ICONS = { pedidos: ClipboardList, historial: Clock, carta: UtensilsCrossed, promos: Tag, socios: Users, ajustes: Settings }

function AppContent() {
  const { user, restaurante, loading } = useRest()
  const [seccion, setSeccion] = useState('pedidos')

  const handleNuevoPedido = useCallback(() => {
    setSeccion('pedidos')
  }, [])

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false })
      StatusBar.setBackgroundColor({ color: '#0D0D0D' })
      StatusBar.setStyle({ style: Style.Dark })

      CapApp.addListener('appUrlOpen', ({ url }) => {
        if (url.includes('access_token') || url.includes('refresh_token') || url.includes('code=')) {
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

  if (loading) {
    return (
      <div style={{ ...shell, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>
      </div>
    )
  }

  if (!user || !restaurante) {
    return <div style={shell}><style>{css}</style><Login /></div>
  }

  const nav = [
    { id: 'pedidos', label: 'Pedidos' },
    { id: 'historial', label: 'Historial' },
    { id: 'carta', label: 'Carta' },
    { id: 'promos', label: 'Promos' },
    { id: 'socios', label: 'Socios' },
    { id: 'ajustes', label: 'Ajustes' },
  ]

  return (
    <PedidoAlertProvider onNuevoPedido={handleNuevoPedido}>
      <AppInner seccion={seccion} setSeccion={setSeccion} nav={nav} />
    </PedidoAlertProvider>
  )
}

function AppInner({ seccion, setSeccion, nav }) {
  const { restaurante } = useRest()
  const { pedidosNuevos } = usePedidoAlert()

  return (
    <div style={{ ...shell, minHeight: '100vh', position: 'relative', paddingBottom: 80 }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden' }}>
            {restaurante.logo_url ? <img src={restaurante.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--c-text)' }}>{restaurante.nombre}</div>
            <div style={{ fontSize: 10, color: restaurante.activo ? '#16A34A' : '#991B1B', fontWeight: 600 }}>
              {restaurante.activo ? '● Abierto' : '● Cerrado'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pedidosNuevos.length > 0 && seccion !== 'pedidos' && (
            <button onClick={() => setSeccion('pedidos')} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
              borderRadius: 10, border: 'none', background: '#FEF2F2',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#991B1B',
              animation: 'pulse 1s infinite',
            }}>
              🔔 {pedidosNuevos.length} nuevo{pedidosNuevos.length > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => setSeccion('metricas')} style={{
            padding: '7px 14px', borderRadius: 10, border: 'none',
            background: seccion === 'metricas' ? 'var(--c-primary)' : 'var(--c-surface2)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            color: seccion === 'metricas' ? '#fff' : 'var(--c-muted)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}><BarChart3 size={14} strokeWidth={2} /> Metricas</button>
        </div>
      </div>

      {/* Banner flotante cuando hay pedidos nuevos y NO estamos en Pedidos */}
      {pedidosNuevos.length > 0 && seccion !== 'pedidos' && (
        <button onClick={() => setSeccion('pedidos')} style={{
          position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)', maxWidth: 500, zIndex: 100,
          background: 'linear-gradient(135deg, #B91C1C, #DC2626)',
          borderRadius: 14, padding: '14px 18px', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 8px 32px rgba(185,28,28,0.4)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>
                {pedidosNuevos.length} pedido{pedidosNuevos.length > 1 ? 's' : ''} nuevo{pedidosNuevos.length > 1 ? 's' : ''}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}>Toca para ver y aceptar</div>
            </div>
          </div>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.25)', padding: '6px 12px', borderRadius: 8 }}>
            Ir a pedidos
          </div>
        </button>
      )}

      {/* Contenido */}
      <div style={{ padding: 20, animation: 'fadeIn 0.3s ease' }}>
        {seccion === 'pedidos' && <PedidosEnVivo />}
        {seccion === 'historial' && <Historial />}
        {seccion === 'carta' && <Carta />}
        {seccion === 'promos' && <Promociones />}
        {seccion === 'socios' && <Socios />}
        {seccion === 'metricas' && <Metricas />}
        {seccion === 'ajustes' && <Ajustes />}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100%', background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px', zIndex: 50 }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => setSeccion(n.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: seccion === n.id ? 'var(--c-primary)' : 'var(--c-muted)',
            fontSize: 10, fontWeight: 600, padding: '4px 8px', transition: 'color 0.2s',
            position: 'relative',
          }}>
            {(() => { const Icon = NAV_ICONS[n.id]; return Icon ? <Icon size={20} strokeWidth={seccion === n.id ? 2.5 : 1.8} /> : null })()}
            {n.label}
            {n.id === 'pedidos' && pedidosNuevos.length > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: 0,
                width: 16, height: 16, borderRadius: 8,
                background: '#EF4444', color: '#fff',
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 1s infinite',
              }}>{pedidosNuevos.length}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

const shell = {
  '--c-primary': '#B91C1C', '--c-primary-light': 'rgba(185,28,28,0.15)', '--c-primary-soft': 'rgba(185,28,28,0.25)',
  '--c-bg': '#0D0D0D', '--c-surface': 'rgba(255,255,255,0.08)', '--c-surface2': 'rgba(255,255,255,0.05)',
  '--c-border': 'rgba(255,255,255,0.1)', '--c-text': '#F5F5F5', '--c-muted': 'rgba(255,255,255,0.45)',
  fontFamily: "'DM Sans', sans-serif", width: '100%',
  background: 'var(--c-bg)', color: 'var(--c-text)',
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{display:none}
body{background:#0D0D0D;margin:0}
`

export default function App() {
  return <RestProvider><AppContent /></RestProvider>
}

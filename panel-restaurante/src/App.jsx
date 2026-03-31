import { useState, useEffect } from 'react'
import { ClipboardList, Clock, UtensilsCrossed, Users, Settings, BarChart3 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { RestProvider, useRest } from './context/RestContext'
import Login from './pages/Login'
import PedidosEnVivo from './pages/PedidosEnVivo'
import Historial from './pages/Historial'
import Carta from './pages/Carta'
import Socios from './pages/Socios'
import Metricas from './pages/Metricas'
import Ajustes from './pages/Ajustes'
import './index.css'

const NAV_ICONS = { pedidos: ClipboardList, historial: Clock, carta: UtensilsCrossed, socios: Users, ajustes: Settings }

function AppContent() {
  const { user, restaurante, loading } = useRest()
  const [seccion, setSeccion] = useState('pedidos')

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false })
      StatusBar.setBackgroundColor({ color: '#0D0D0D' })
      StatusBar.setStyle({ style: Style.Dark })
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
    { id: 'socios', label: 'Socios' },
    { id: 'ajustes', label: 'Ajustes' },
  ]

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
        <button onClick={() => setSeccion('metricas')} style={{
          padding: '7px 14px', borderRadius: 10, border: 'none',
          background: seccion === 'metricas' ? 'var(--c-primary)' : 'var(--c-surface2)',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          color: seccion === 'metricas' ? '#fff' : 'var(--c-muted)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}><BarChart3 size={14} strokeWidth={2} /> Metricas</button>
      </div>

      {/* Contenido */}
      <div style={{ padding: 20, animation: 'fadeIn 0.3s ease' }}>
        {seccion === 'pedidos' && <PedidosEnVivo />}
        {seccion === 'historial' && <Historial />}
        {seccion === 'carta' && <Carta />}
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
          }}>
            {(() => { const Icon = NAV_ICONS[n.id]; return Icon ? <Icon size={20} strokeWidth={seccion === n.id ? 2.5 : 1.8} /> : null })()}{n.label}
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

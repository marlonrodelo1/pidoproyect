import { useState } from 'react'
import { ClipboardList, Clock, UtensilsCrossed, Users, Settings, BarChart3 } from 'lucide-react'
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
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px', zIndex: 50 }}>
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
  '--c-primary': '#B91C1C', '--c-primary-light': '#FEF2F2', '--c-primary-soft': '#FECACA',
  '--c-bg': '#FAFAF8', '--c-surface': '#FFFFFF', '--c-surface2': '#F3F2EF',
  '--c-border': '#E8E6E1', '--c-text': '#1A1A18', '--c-muted': '#8C8A85',
  fontFamily: "'DM Sans', sans-serif", maxWidth: 420, margin: '0 auto',
  background: 'var(--c-bg)', color: 'var(--c-text)',
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{display:none}
body{background:#FAFAF8;margin:0}
`

export default function App() {
  return <RestProvider><AppContent /></RestProvider>
}

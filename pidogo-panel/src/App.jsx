import { useState } from 'react'
import { LayoutGrid, ClipboardList, Store, FileText, User, Radio, MessageCircle } from 'lucide-react'
import { SocioProvider, useSocio } from './context/SocioContext'
import Login from './pages/Login'
import EnVivo from './pages/EnVivo'
import Dashboard from './pages/Dashboard'
import Pedidos from './pages/Pedidos'
import Negocios from './pages/Negocios'
import Informes from './pages/Informes'
import Perfil from './pages/Perfil'
import Soporte from './pages/Soporte'
import './index.css'

const NAV_ICONS = { dashboard: LayoutGrid, pedidos: ClipboardList, negocios: Store, informes: FileText, perfil: User }

function AppContent() {
  const { user, socio, loading } = useSocio()
  const [seccion, setSeccion] = useState('envivo')

  if (loading) {
    return (
      <div style={{ ...shell, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--c-accent)' }}>PIDOGO</div>
      </div>
    )
  }

  if (!user || !socio) {
    return <div style={shell}><style>{css}</style><Login /></div>
  }

  const nav = [
    { id: 'dashboard', label: 'Inicio' },
    { id: 'pedidos', label: 'Pedidos' },
    { id: 'negocios', label: 'Negocios' },
    { id: 'informes', label: 'Informes' },
    { id: 'perfil', label: 'Perfil' },
  ]

  return (
    <div style={{ ...shell, minHeight: '100vh', position: 'relative', paddingBottom: 80 }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--c-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', overflow: 'hidden' }}>
            {socio.logo_url ? <img src={socio.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : socio.nombre_comercial?.[0]?.toUpperCase()}
          </div>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: socio.en_servicio ? '#16A34A' : '#D1D5DB', boxShadow: socio.en_servicio ? '0 0 6px rgba(22,163,74,0.5)' : 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setSeccion('envivo')} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, border: 'none',
            background: seccion === 'envivo' ? 'var(--c-accent)' : 'var(--c-accent-light)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            color: seccion === 'envivo' ? '#fff' : 'var(--c-accent)',
          }}>
            <Radio size={14} strokeWidth={2.5} />
            En vivo
          </button>
          <button onClick={() => setSeccion('soporte')} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, border: 'none',
            background: seccion === 'soporte' ? 'var(--c-accent)' : 'var(--c-surface2)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            color: seccion === 'soporte' ? '#fff' : 'var(--c-muted)',
          }}>
            <MessageCircle size={14} strokeWidth={2} />
            Soporte
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: 20, animation: 'fadeIn 0.3s ease' }}>
        {seccion === 'envivo' && <EnVivo />}
        {seccion === 'dashboard' && <Dashboard />}
        {seccion === 'pedidos' && <Pedidos />}
        {seccion === 'negocios' && <Negocios />}
        {seccion === 'informes' && <Informes />}
        {seccion === 'perfil' && <Perfil />}
        {seccion === 'soporte' && <Soporte />}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px', zIndex: 50 }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => setSeccion(n.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: seccion === n.id ? 'var(--c-accent)' : 'var(--c-muted)',
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
  '--c-accent': '#FF5733', '--c-accent-light': 'rgba(255,87,51,0.15)', '--c-accent-soft': 'rgba(255,87,51,0.25)',
  '--c-bg': '#0D0D0D', '--c-surface': 'rgba(255,255,255,0.08)', '--c-surface2': 'rgba(255,255,255,0.05)',
  '--c-border': 'rgba(255,255,255,0.1)', '--c-text': '#F5F5F5', '--c-muted': 'rgba(255,255,255,0.45)',
  fontFamily: "'DM Sans', sans-serif", maxWidth: 420, margin: '0 auto',
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
  return <SocioProvider><AppContent /></SocioProvider>
}

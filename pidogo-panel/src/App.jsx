import { useState, useCallback } from 'react'
import { LayoutGrid, ClipboardList, Store, FileText, User, Radio, MessageCircle } from 'lucide-react'
import { SocioProvider, useSocio } from './context/SocioContext'
import { PedidoAlertProvider, usePedidoAlert } from './context/PedidoAlertContext'
import Login from './pages/Login'
import EnVivo from './pages/EnVivo'
import Dashboard from './pages/Dashboard'
import Pedidos from './pages/Pedidos'
import Negocios from './pages/Negocios'
import Informes from './pages/Informes'
import Perfil from './pages/Perfil'
import Soporte from './pages/Soporte'
import { unlockAudio } from './lib/alarm'
import './index.css'

const NAV_ICONS = { dashboard: LayoutGrid, pedidos: ClipboardList, negocios: Store, informes: FileText, perfil: User }

function AppContent() {
  const { user, socio, loading } = useSocio()
  const [seccion, setSeccion] = useState('envivo')

  // Auto-navegar a EnVivo cuando llega un pedido nuevo
  const handleNuevoPedido = useCallback(() => {
    setSeccion('envivo')
  }, [])

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
    <PedidoAlertProvider onNuevoPedido={handleNuevoPedido}>
      <AppInner seccion={seccion} setSeccion={setSeccion} nav={nav} />
    </PedidoAlertProvider>
  )
}

function AppInner({ seccion, setSeccion, nav }) {
  const { socio } = useSocio()
  const { pedidosPendientes } = usePedidoAlert()

  return (
    <div style={{ ...shell, minHeight: '100vh', position: 'relative', paddingBottom: 80 }} onClick={() => unlockAudio()} onTouchStart={() => unlockAudio()}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--c-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', overflow: 'hidden' }}>
            {socio.logo_url ? <img src={socio.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : socio.nombre_comercial?.[0]?.toUpperCase()}
          </div>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: socio.en_servicio ? '#16A34A' : 'rgba(255,255,255,0.2)', boxShadow: socio.en_servicio ? '0 0 6px rgba(22,163,74,0.5)' : 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setSeccion('envivo')} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, border: 'none',
            background: seccion === 'envivo' ? 'var(--c-accent)' : 'var(--c-accent-light)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            color: seccion === 'envivo' ? '#fff' : 'var(--c-accent)',
            position: 'relative',
          }}>
            <Radio size={14} strokeWidth={2.5} />
            En vivo
            {pedidosPendientes.length > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 18, height: 18, borderRadius: 9,
                background: '#EF4444', color: '#fff',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 1s infinite',
              }}>{pedidosPendientes.length}</span>
            )}
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

      {/* Banner flotante cuando hay pedidos pendientes y NO estamos en EnVivo */}
      {pedidosPendientes.length > 0 && seccion !== 'envivo' && (
        <button onClick={() => setSeccion('envivo')} style={{
          position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)', maxWidth: 500, zIndex: 100,
          background: 'linear-gradient(135deg, #FF5733, #FF8F73)',
          borderRadius: 14, padding: '14px 18px', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 8px 32px rgba(255,87,51,0.4)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>
                {pedidosPendientes.length} pedido{pedidosPendientes.length > 1 ? 's' : ''} nuevo{pedidosPendientes.length > 1 ? 's' : ''}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}>Toca para ver</div>
            </div>
          </div>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.25)', padding: '6px 12px', borderRadius: 8 }}>
            Ver pedidos
          </div>
        </button>
      )}

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
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100%', background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px', zIndex: 50 }}>
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
  return <SocioProvider><AppContent /></SocioProvider>
}

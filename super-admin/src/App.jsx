import { useState } from 'react'
import { AdminProvider, useAdmin } from './context/AdminContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Establecimientos from './pages/Establecimientos'
import Socios from './pages/Socios'
import Usuarios from './pages/Usuarios'
import Pedidos from './pages/Pedidos'
import SoporteAdmin from './pages/SoporteAdmin'
import Finanzas from './pages/Finanzas'
import Configuracion from './pages/Configuracion'
import Notificaciones from './pages/Notificaciones'
import MapaAdmin from './pages/MapaAdmin'
import './index.css'

function AppContent() {
  const { user, loading, logout } = useAdmin()
  const [seccion, setSeccion] = useState('dashboard')

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#FF6B2C', letterSpacing: -1 }}>pidoo</div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar active={seccion} onChange={setSeccion} onLogout={logout} />
      <main style={{ flex: 1, marginLeft: 240, padding: '28px 32px', background: '#0D0D0D', minHeight: '100vh' }}>
        {seccion === 'dashboard' && <Dashboard />}
        {seccion === 'establecimientos' && <Establecimientos />}
        {seccion === 'socios' && <Socios />}
        {seccion === 'usuarios' && <Usuarios />}
        {seccion === 'pedidos' && <Pedidos />}
        {seccion === 'mapa' && <MapaAdmin />}
        {seccion === 'notificaciones' && <Notificaciones />}
        {seccion === 'soporte' && <SoporteAdmin />}
        {seccion === 'finanzas' && <Finanzas />}
        {seccion === 'config' && <Configuracion />}
      </main>
    </div>
  )
}

export default function App() {
  return <AdminProvider><AppContent /></AdminProvider>
}

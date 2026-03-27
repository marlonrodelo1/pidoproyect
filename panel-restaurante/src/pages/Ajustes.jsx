import { useState } from 'react'
import { useRest } from '../context/RestContext'

export default function Ajustes() {
  const { restaurante, updateRestaurante, logout } = useRest()
  const [activo, setActivo] = useState(restaurante?.activo ?? true)

  async function toggleActivo() {
    const nuevo = !activo
    setActivo(nuevo)
    await updateRestaurante({ activo: nuevo })
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>Ajustes</h2>

      {/* Estado abierto/cerrado */}
      <div style={{ background: activo ? '#DCFCE7' : '#FEE2E2', borderRadius: 14, padding: '16px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: activo ? '#166534' : '#991B1B' }}>{activo ? 'Abierto' : 'Cerrado'}</div>
          <div style={{ fontSize: 12, color: activo ? '#15803D' : '#B91C1C', marginTop: 2 }}>{activo ? 'Recibiendo pedidos' : 'No se reciben pedidos'}</div>
        </div>
        <button onClick={toggleActivo} style={{ width: 52, height: 28, borderRadius: 14, border: 'none', background: activo ? '#16A34A' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
          <span style={{ position: 'absolute', top: 3, left: activo ? 27 : 3, width: 22, height: 22, borderRadius: 11, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
      </div>

      {/* Info */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Información</h3>
        {[
          { l: 'Nombre', v: restaurante?.nombre },
          { l: 'Tipo', v: restaurante?.tipo },
          { l: 'Dirección', v: restaurante?.direccion },
          { l: 'Email', v: restaurante?.email },
          { l: 'Teléfono', v: restaurante?.telefono },
          { l: 'Radio cobertura', v: `${restaurante?.radio_cobertura_km} km` },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--c-border)' : 'none' }}>
            <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>{item.l}</span>
            <span style={{ fontSize: 13, fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{item.v || '—'}</span>
          </div>
        ))}
      </div>

      <button onClick={logout} style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: '#FEF2F2', color: '#991B1B', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar sesión</button>
    </div>
  )
}

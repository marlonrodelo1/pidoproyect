import { useAuth } from '../context/AuthContext'

export default function Perfil() {
  const { perfil, logout } = useAuth()

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: 'var(--c-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12,
        }}>
          {perfil?.avatar_url
            ? <img src={perfil.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: 20, objectFit: 'cover' }} />
            : (perfil?.nombre?.[0] || 'U').toUpperCase()
          }
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text)' }}>
          {perfil?.nombre} {perfil?.apellido || ''}
        </div>
        <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{perfil?.email}</div>
        {perfil?.telefono && <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{perfil.telefono}</div>}
      </div>

      <div style={{ background: 'var(--c-surface)', borderRadius: 14, border: '1px solid var(--c-border)' }}>
        {[
          'Mis direcciones',
          'Métodos de pago',
          'Promociones',
          'Configuración',
          'Ayuda',
        ].map((item, i) => (
          <button key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            width: '100%', padding: '14px 18px', border: 'none', background: 'transparent',
            borderBottom: '1px solid var(--c-border)', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 14, fontWeight: 600, color: 'var(--c-text)', textAlign: 'left',
          }}>
            {item}
            <span style={{ color: 'var(--c-muted)', fontSize: 16 }}>›</span>
          </button>
        ))}
        <button onClick={logout} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', padding: '14px 18px', border: 'none', background: 'transparent',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
          color: '#991B1B', textAlign: 'left',
        }}>
          Cerrar sesión
          <span style={{ color: 'var(--c-muted)', fontSize: 16 }}>›</span>
        </button>
      </div>
    </div>
  )
}

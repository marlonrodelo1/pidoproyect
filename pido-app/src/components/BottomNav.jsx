import { Home, Heart, Map, ClipboardList, User } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'home', l: 'Inicio', Icon: Home },
  { id: 'favoritos', l: 'Favoritos', Icon: Heart },
  { id: 'mapa', l: 'Mapa', Icon: Map },
  { id: 'pedidos', l: 'Pedidos', Icon: ClipboardList },
  { id: 'perfil', l: 'Perfil', Icon: User },
]

export default function BottomNav({ active, onChange }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 420, background: 'var(--c-surface)',
      borderTop: '1px solid var(--c-border)',
      display: 'flex', justifyContent: 'space-around', padding: '6px 0 10px', zIndex: 40,
    }}>
      {NAV_ITEMS.map(n => (
        <button key={n.id} onClick={() => onChange(n.id)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          color: active === n.id ? 'var(--c-primary)' : 'var(--c-muted)',
          fontSize: 9, fontWeight: 600, padding: '4px 10px',
        }}>
          <n.Icon size={20} strokeWidth={active === n.id ? 2.5 : 1.8} />
          {n.l}
        </button>
      ))}
    </div>
  )
}

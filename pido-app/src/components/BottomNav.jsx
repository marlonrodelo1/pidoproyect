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
      position: 'fixed', bottom: 10, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)', maxWidth: 388,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 22,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 6px', zIndex: 40,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {NAV_ITEMS.map(n => {
        const isActive = active === n.id
        return (
          <button key={n.id} onClick={() => onChange(n.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: isActive ? '#FF6B2C' : 'rgba(255,255,255,0.5)',
            fontSize: 9, fontWeight: 600, padding: '8px 12px',
            borderRadius: 14, transition: 'all 0.2s ease',
          }}>
            <n.Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            {n.l}
          </button>
        )
      })}
    </div>
  )
}

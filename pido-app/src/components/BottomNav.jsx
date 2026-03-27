import { Home, MapPin, Search, ShoppingCart, User } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'home', Icon: Home },
  { id: 'mapa', Icon: MapPin },
  { id: 'buscar', Icon: Search, isSearch: true },
  { id: 'pedidos', Icon: ShoppingCart },
  { id: 'perfil', Icon: User },
]

export default function BottomNav({ active, onChange, onSearch }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 420, background: '#1A1A18',
      borderRadius: '24px 24px 0 0',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '12px 16px 16px', gap: 10, zIndex: 40,
    }}>
      {NAV_ITEMS.map(n => {
        if (n.isSearch) {
          return (
            <button key={n.id} onClick={() => onChange('home')} style={{
              flex: 1.8, display: 'flex', alignItems: 'center', gap: 8,
              background: '#fff', borderRadius: 50, padding: '12px 18px',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Search size={18} strokeWidth={2} color="#8C8A85" />
              <span style={{ fontSize: 14, color: '#8C8A85', fontWeight: 500 }}>Buscar</span>
            </button>
          )
        }

        const isActive = active === n.id
        return (
          <button key={n.id} onClick={() => onChange(n.id)} style={{
            width: 52, height: 52, borderRadius: 26,
            background: isActive ? '#fff' : 'rgba(255,255,255,0.1)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease', flexShrink: 0,
          }}>
            <n.Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
              color={isActive ? '#1A1A18' : 'rgba(255,255,255,0.6)'}
              fill={isActive && n.id === 'home' ? '#1A1A18' : 'none'}
            />
          </button>
        )
      })}
    </div>
  )
}

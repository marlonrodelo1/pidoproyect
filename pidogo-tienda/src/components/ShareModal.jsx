export default function ShareModal({ slug, onClose }) {
  const url = `pido.com/${slug}`

  function copiar() {
    navigator.clipboard.writeText(`https://${url}`)
    alert('Enlace copiado')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-bg)', borderRadius: 20, padding: 28, width: '90%', maxWidth: 340, animation: 'slideUp 0.3s ease' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, textAlign: 'center', color: 'var(--c-text)' }}>Compartir tienda</h3>
        <div style={{ background: 'var(--c-surface2)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', marginBottom: 20, fontSize: 14, fontWeight: 600, color: 'var(--c-accent)', wordBreak: 'break-all' }}>
          {url}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'WhatsApp', icon: '💬', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`https://${url}`)}`) },
            { name: 'Instagram', icon: '📸', action: () => {} },
            { name: 'Copiar enlace', icon: '🔗', action: copiar },
            { name: 'Código QR', icon: '📱', action: () => {} },
          ].map(s => (
            <button key={s.name} onClick={s.action} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px',
              borderRadius: 12, border: '1px solid var(--c-border)', background: 'var(--c-surface)',
              cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', color: 'var(--c-text)',
            }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>{s.name}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 12, border: 'none', background: 'var(--c-surface2)', color: 'var(--c-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

// Design System PIDO
// Paleta unica - solo estos colores en toda la app

export const colors = {
  // Principal
  primary: '#FF6B2C',
  primaryLight: '#FFF3ED',
  primarySoft: '#FFD6C0',

  // Neutros
  bg: '#FAFAF8',
  surface: '#FFFFFF',
  surface2: '#F3F2EF',
  border: '#E8E6E1',
  text: '#1A1A18',
  textSecondary: '#6B6966',
  muted: '#8C8A85',

  // Estados (solo estos 2)
  success: '#22C55E',
  successLight: '#F0FDF4',
  error: '#EF4444',
  errorLight: '#FEF2F2',
}

// Badge styles unificados
export const badge = (type) => {
  const map = {
    tarjeta: { bg: colors.primaryLight, color: colors.primary },
    efectivo: { bg: colors.successLight, color: '#166534' },
    pido: { bg: colors.primaryLight, color: colors.primary },
    pidogo: { bg: colors.successLight, color: '#166534' },
    activo: { bg: colors.successLight, color: '#166534' },
    inactivo: { bg: colors.errorLight, color: colors.error },
    nuevo: { bg: colors.primaryLight, color: colors.primary },
    aceptado: { bg: colors.primaryLight, color: colors.primary },
    preparando: { bg: colors.primaryLight, color: colors.primary },
    listo: { bg: colors.primaryLight, color: colors.primary },
    en_camino: { bg: colors.primaryLight, color: colors.primary },
    entregado: { bg: colors.successLight, color: '#166534' },
    cancelado: { bg: colors.errorLight, color: colors.error },
    fallido: { bg: colors.errorLight, color: colors.error },
    recogida: { bg: colors.surface2, color: colors.textSecondary },
    reparto: { bg: colors.primaryLight, color: colors.primary },
    pendiente: { bg: colors.surface2, color: colors.muted },
    pagado: { bg: colors.successLight, color: '#166534' },
  }
  const style = map[type] || { bg: colors.surface2, color: colors.muted }
  return {
    background: style.bg, color: style.color,
    fontSize: 10, fontWeight: 700, padding: '3px 10px',
    borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
  }
}

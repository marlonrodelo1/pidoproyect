import { COMISIONES } from './constants.js'

export function formatPrecio(amount) {
  return `${(amount || 0).toFixed(2)}\u20AC`
}

export function formatFecha(date) {
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatHora(date) {
  return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function calcularComision(total, tipo) {
  const esReparto = tipo === 'reparto'
  return {
    comisionPlataforma: total * COMISIONES.plataforma,
    comisionSocio: total * (esReparto ? COMISIONES.socioReparto : COMISIONES.socioRecogida),
    totalComision: total * (esReparto ? COMISIONES.totalReparto : COMISIONES.totalRecogida),
  }
}

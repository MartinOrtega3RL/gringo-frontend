// Reglas de presentacion de la ficha del cliente.

/**
 * RF14 / RF04.1 — cada pestaña se muestra solo si el perfil tiene lectura
 * en ese modulo: el Vendedor no ve reparaciones y el Tecnico no ve compras.
 */
export const pestanasFichaCliente = ({ idCliente, verCompras, verReparaciones }) => {
  const items = []
  if (verCompras) {
    items.push({ clave: 'compras', a: `/clientes/${idCliente}/compras`, texto: 'Compras' })
  }
  if (verReparaciones) {
    items.push({ clave: 'reparaciones', a: `/clientes/${idCliente}/reparaciones`, texto: 'Reparaciones' })
  }
  return items
}

export const destinoInicialFicha = ({ verCompras, verReparaciones }) => {
  if (verCompras) return 'compras'
  if (verReparaciones) return 'reparaciones'
  return null
}

/** "Apple iPhone 13", o lo que haya si falta la marca. */
export const nombreEquipoHistorial = (equipo) =>
  [equipo?.marca, equipo?.modelo].filter(Boolean).join(' ') || 'Equipo sin identificar'

const RX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const RX_WHATSAPP = /^[\d\s+()\-.]+$/

/** Mensaje si el correo cargado no tiene forma de correo; null si esta bien o vacio. */
export const errorDeCorreo = (valor) => {
  const correo = String(valor ?? '').trim()
  if (!correo) return null
  return RX_CORREO.test(correo)
    ? null
    : 'El correo no tiene un formato válido: tiene que llevar @ y un dominio, por ejemplo nombre@dominio.com.'
}

/** Mensaje si el WhatsApp tiene letras o muy pocos numeros; null si esta bien o vacio. */
export const errorDeWhatsapp = (valor) => {
  const numero = String(valor ?? '').trim()
  if (!numero) return null
  if (!RX_WHATSAPP.test(numero)) return 'El WhatsApp solo puede llevar números, espacios, +, guiones y paréntesis.'
  return numero.replace(/\D/g, '').length >= 6 ? null : 'El WhatsApp tiene que tener al menos 6 números.'
}

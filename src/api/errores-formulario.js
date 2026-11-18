// Cuando el servidor rechaza un formulario, devuelve un mensaje general y, aparte,
// el detalle de cada dato que fallo (`detalles: [{ campo, mensaje }]`). Mostrar
// solo el general obliga a adivinar cual es: se reparte, para marcar cada campo.

/**
 * Separa un error de la API en mensajes por campo y un mensaje general.
 * `campos` son los datos que el formulario muestra: lo que falle en otro dato
 * no tiene donde marcarse y se informa en el mensaje general.
 */
export const repartirFallo = (fallo, campos) => {
  const porCampo = {}
  const sueltos = []

  for (const detalle of fallo?.detalles ?? []) {
    const campo = String(detalle.campo ?? '').split('.')[0]
    if (campos.includes(campo)) {
      if (!porCampo[campo]) porCampo[campo] = detalle.mensaje
    } else if (detalle.mensaje) {
      sueltos.push(detalle.mensaje)
    }
  }

  if (Object.keys(porCampo).length === 0) {
    return { porCampo, general: sueltos.length > 0 ? sueltos.join(' ') : (fallo?.message ?? 'Ocurrió un problema.') }
  }

  return {
    porCampo,
    general: sueltos.length > 0 ? sueltos.join(' ') : 'No se guardó: corregí los datos marcados.',
  }
}

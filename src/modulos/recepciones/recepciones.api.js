import { api, consulta } from '../../api/cliente.js'

export const listarRecepciones = ({ estado, idProveedor, desde, hasta, pagina = 1, tamano = 25 } = {}) =>
  api.obtener(`/recepciones${consulta({ estado, idProveedor, desde, hasta, pagina, tamano })}`)

export const listarProveedoresRecepcion = () => api.obtener('/recepciones/proveedores')

export const buscarRecepcion = (idRecepcion) => api.obtener(`/recepciones/${idRecepcion}`)

export const crearRecepcionManual = (datos) => api.enviar('/recepciones', datos)

// Paso 1 de la recepcion con foto: sube la imagen y devuelve lo que leyo el OCR.
export const analizarComprobante = (formulario) => api.subir('/recepciones/ocr/analizar', formulario)

// Paso 2: crea la recepcion con lo que se confirmo; la foto ya esta en el servidor.
export const crearRecepcionOcr = (datos) => api.enviar('/recepciones/ocr', datos)

export const actualizarLineasRecepcion = (idRecepcion, lineas) =>
  api.modificar(`/recepciones/${idRecepcion}/lineas`, { lineas })

export const confirmarRecepcion = (idRecepcion) =>
  api.enviar(`/recepciones/${idRecepcion}/confirmar`)

export const eliminarRecepcion = (idRecepcion) =>
  api.borrar(`/recepciones/${idRecepcion}`)

export const rutaImagenComprobante = (idRecepcion) => `/recepciones/${idRecepcion}/imagen`


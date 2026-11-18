import { useEffect, useMemo, useRef, useState } from 'react'
import {
  analizarComprobante,
  crearRecepcionManual,
  crearRecepcionOcr,
  listarProveedoresRecepcion,
} from '../recepciones.api.js'
import { registrarProveedor } from '../../proveedores/proveedores.api.js'
import {
  TIPOS_COMPROBANTE,
  calcularTotalRecepcion,
  todasConProducto,
} from '../recepciones.reglas.js'
import { ElegirProducto } from '../../existencias/componentes/ElegirProducto.jsx'
import { FormularioProveedor } from '../../proveedores/componentes/FormularioProveedor.jsx'
import { pesos } from '../../servicio/servicio.reglas.js'
import { Dialogo } from '../../../ui/Dialogo.jsx'
import { Boton } from '../../../ui/Boton.jsx'
import { Aviso } from '../../../ui/Estados.jsx'
import { IconoMas, IconoQuitar } from '../../../ui/Iconos.jsx'

const LINEA_VACIA = () => ({ idProducto: null, producto: null, cantidad: 1, precioCosto: '' })

const ETIQUETA = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-crema/75'

const COMO_SE_IDENTIFICO = {
  CUIT: 'Lo reconocí por el CUIT del comprobante.',
  NOMBRE: 'Lo reconocí por el nombre del comprobante.',
}

// RF10.1 y RF10.2 — nueva recepcion de mercaderia.
//
// Con foto es lo primero que se ofrece: se elige la imagen, el servidor la lee y
// devuelve tipo, numero, fecha y proveedor para revisar. Si el proveedor no esta
// cargado se da de alta ahi mismo con el nombre y el CUIT que leyo, igual que un
// producto desconocido en la validacion. Recien con todo confirmado se crea la
// recepcion.
export const DialogoNuevaRecepcion = ({ abierto, alCerrar, alCrear }) => {
  const [modo, setModo] = useState('OCR')
  const [proveedores, setProveedores] = useState([])
  const [idProveedor, setIdProveedor] = useState('')
  const [tipoComprobante, setTipoComprobante] = useState('FACTURA')
  const [numeroComprobante, setNumeroComprobante] = useState('')
  const [fechaComprobante, setFechaComprobante] = useState('')
  const [lineas, setLineas] = useState([LINEA_VACIA()])
  const [analisis, setAnalisis] = useState(null)
  const [analizando, setAnalizando] = useState(false)
  const [altaProveedor, setAltaProveedor] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  // Si se elige otra foto mientras se lee la anterior, la respuesta vieja se ignora.
  const lectura = useRef(0)

  const cargarProveedores = async () => {
    try {
      const { datos } = await listarProveedoresRecepcion()
      setProveedores(datos ?? [])
      return datos ?? []
    } catch {
      setProveedores([])
      return []
    }
  }

  useEffect(() => {
    if (!abierto) return
    lectura.current += 1
    setModo('OCR')
    setError(null)
    setEnviando(false)
    setAnalizando(false)
    setAnalisis(null)
    setAltaProveedor(false)
    setLineas([LINEA_VACIA()])
    setIdProveedor('')
    setTipoComprobante('FACTURA')
    setNumeroComprobante('')
    setFechaComprobante('')
    cargarProveedores()
  }, [abierto])

  // A mano no hay nada que lea el proveedor: se parte del primero de la lista.
  useEffect(() => {
    if (modo === 'MANUAL' && !idProveedor && proveedores[0]) setIdProveedor(String(proveedores[0].idProveedor))
  }, [modo, idProveedor, proveedores])

  const analizar = async (archivo) => {
    const mia = ++lectura.current
    setError(null)
    setAnalisis(null)
    if (!archivo) return

    setAnalizando(true)
    try {
      const formulario = new FormData()
      formulario.append('imagen', archivo)
      const { datos } = await analizarComprobante(formulario)
      if (mia !== lectura.current) return

      setAnalisis(datos)
      setTipoComprobante(datos.encabezado.tipoComprobante ?? 'FACTURA')
      setNumeroComprobante(datos.encabezado.numeroComprobante ?? '')
      setFechaComprobante(datos.encabezado.fechaComprobante ?? '')
      setIdProveedor(datos.proveedor ? String(datos.proveedor.idProveedor) : '')
    } catch (fallo) {
      if (mia === lectura.current) setError(fallo.message)
    } finally {
      if (mia === lectura.current) setAnalizando(false)
    }
  }

  // Lo que se le precarga al alta del proveedor: nombre y CUIT leidos de la foto.
  const inicialProveedor = useMemo(() => {
    const propuesto = analisis?.proveedorPropuesto
    if (!propuesto) return undefined
    return {
      apellidoNombre: propuesto.nombre ?? '',
      tipoDocumento: propuesto.cuit ? 'CUIT' : '',
      numeroDocumento: propuesto.cuit ?? '',
    }
  }, [analisis])

  const altaDeProveedor = async (datos) => {
    const { datos: nuevo } = await registrarProveedor(datos)
    await cargarProveedores()
    setIdProveedor(String(nuevo.idProveedor))
    setAltaProveedor(false)
  }

  const actualizarLinea = (indice, patch) =>
    setLineas((prev) => prev.map((l, i) => (i === indice ? { ...l, ...patch } : l)))

  const quitarLinea = (indice) =>
    setLineas((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== indice) : prev))

  const lineasNormalizadas = lineas.map((l) => ({
    idProducto: l.idProducto,
    cantidad: Number(l.cantidad) || 0,
    precioCosto: Number(l.precioCosto === '' ? -1 : l.precioCosto),
  }))

  const manualValido = Boolean(idProveedor) && todasConProducto(lineasNormalizadas)
  const ocrValido = Boolean(analisis) && Boolean(idProveedor) && !analizando
  const ocupado = enviando || analizando

  const enviar = async (evento) => {
    evento.preventDefault()
    setError(null)
    setEnviando(true)

    try {
      const comun = {
        idProveedor: Number(idProveedor),
        tipoComprobante,
        numeroComprobante: numeroComprobante.trim() || null,
        fechaComprobante: fechaComprobante || null,
      }
      const respuesta = modo === 'MANUAL'
        ? await crearRecepcionManual({ ...comun, lineas: lineasNormalizadas })
        : await crearRecepcionOcr({ ...comun, archivo: analisis.archivo })
      alCrear(respuesta.datos)
    } catch (fallo) {
      setError(fallo.message)
      setEnviando(false)
    }
  }

  const botonModo = (valor, texto) => (
    <button
      type="button"
      disabled={ocupado}
      onClick={() => setModo(valor)}
      className={`border-2 px-3 py-2 text-xs font-bold uppercase tracking-wider ${
        modo === valor
          ? 'border-black bg-ambar text-tinta'
          : 'border-crema/25 bg-tinta/40 text-crema/75'
      }`}
    >
      {texto}
    </button>
  )

  const mostrarDatos = modo === 'MANUAL' || Boolean(analisis)

  return (
    <>
      <Dialogo
        abierto={abierto}
        alCerrar={() => !ocupado && alCerrar()}
        titulo="Nueva recepción de mercadería"
        descripcion="Sacale una foto al comprobante del proveedor y el sistema lee los datos, o cargalo a mano. Nada suma al stock hasta que lo confirmes."
        pie={
          <div className="flex justify-end gap-2">
            <Boton tono="papel" type="button" disabled={ocupado} onClick={alCerrar}>
              Cancelar
            </Boton>
            <Boton
              type="submit"
              form="form-nueva-recepcion"
              cargando={enviando}
              disabled={modo === 'MANUAL' ? !manualValido : !ocrValido}
            >
              Crear recepción
            </Boton>
          </div>
        }
      >
        <form id="form-nueva-recepcion" onSubmit={enviar} className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            {botonModo('OCR', 'Desde una foto del comprobante')}
            {botonModo('MANUAL', 'Cargar a mano')}
          </div>

          {modo === 'OCR' && (
            <div className="grid gap-3 border-2 border-crema/15 bg-tinta/35 p-3">
              <label
                htmlFor="rec-archivo"
                className="block text-xs font-semibold uppercase tracking-[0.14em] text-crema/75"
              >
                Foto o imagen del comprobante (JPG, PNG o WebP, hasta 12 MB)
              </label>
              <input
                id="rec-archivo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={ocupado}
                onChange={(e) => analizar(e.target.files?.[0] ?? null)}
                className="text-xs text-crema file:mr-3 file:border-2 file:border-black file:bg-crema file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:text-tinta"
              />
              {analizando && (
                <Aviso tono="neutro">
                  Leyendo el comprobante… puede tardar unos segundos.
                </Aviso>
              )}
              {analisis && !analisis.ok && (
                <Aviso tono="neutro">
                  No se pudo leer la foto. Completá los datos y creá la recepción igual: la imagen queda
                  guardada y los artículos los cargás a mano.
                </Aviso>
              )}
              {analisis?.ok && (
                <p className="text-xs leading-relaxed text-crema/70">
                  Se detectaron{' '}
                  <span className="numeral font-semibold text-crema">{analisis.cantidadLineas}</span>{' '}
                  {analisis.cantidadLineas === 1 ? 'artículo' : 'artículos'}; los revisás en el paso siguiente.
                  Revisá también lo que está abajo: una foto con sombras puede leerse mal.
                </p>
              )}
            </div>
          )}

          {mostrarDatos && (
            <>
              <div>
                <label htmlFor="rec-proveedor" className={ETIQUETA}>
                  Proveedor
                </label>
                <select
                  id="rec-proveedor"
                  value={idProveedor}
                  disabled={ocupado}
                  onChange={(e) => setIdProveedor(e.target.value)}
                  className="h-11 w-full rounded-[3px] border-2 border-tinta bg-crema px-3 text-sm font-semibold text-tinta"
                >
                  {modo === 'OCR' && <option value="">Elegir…</option>}
                  {proveedores.map((p) => (
                    <option key={p.idProveedor} value={p.idProveedor}>
                      {p.nombre}
                    </option>
                  ))}
                </select>

                {modo === 'OCR' && analisis?.proveedor && (
                  <p className="mt-1.5 text-xs text-crema/65">
                    {COMO_SE_IDENTIFICO[analisis.proveedor.por]}
                  </p>
                )}

                {modo === 'OCR' && analisis && !analisis.proveedor && !idProveedor && (
                  <div className="mt-2 flex flex-wrap items-center gap-3 border-2 border-ambar/60 bg-ambar/10 px-3 py-2">
                    <p className="min-w-0 flex-1 text-xs leading-relaxed text-crema/85">
                      {analisis.proveedorPropuesto?.nombre
                        ? <>No encontré a <strong className="font-semibold">{analisis.proveedorPropuesto.nombre}</strong> entre tus proveedores.</>
                        : 'No pude saber quién emitió el comprobante.'}{' '}
                      Elegilo de la lista o dalo de alta.
                    </p>
                    <Boton
                      type="button"
                      tono="papel"
                      tamano="chico"
                      disabled={ocupado}
                      onClick={() => setAltaProveedor(true)}
                    >
                      <IconoMas /> Dar de alta
                    </Boton>
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="rec-tipo" className={ETIQUETA}>
                    Tipo
                  </label>
                  <select
                    id="rec-tipo"
                    value={tipoComprobante}
                    disabled={ocupado}
                    onChange={(e) => setTipoComprobante(e.target.value)}
                    className="h-11 w-full rounded-[3px] border-2 border-tinta bg-crema px-2.5 text-sm font-semibold text-tinta"
                  >
                    {TIPOS_COMPROBANTE.map(([valor, texto]) => (
                      <option key={valor} value={valor}>{texto}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="rec-numero" className={ETIQUETA}>
                    Nro. comprobante
                  </label>
                  <input
                    id="rec-numero"
                    type="text"
                    maxLength={40}
                    disabled={ocupado}
                    value={numeroComprobante}
                    onChange={(e) => setNumeroComprobante(e.target.value)}
                    placeholder="0001-00001234"
                    className="h-11 w-full rounded-[3px] border-2 border-tinta bg-crema px-2.5 text-sm text-tinta"
                  />
                </div>

                <div>
                  <label htmlFor="rec-fecha" className={ETIQUETA}>
                    Fecha comp.
                  </label>
                  <input
                    id="rec-fecha"
                    type="date"
                    disabled={ocupado}
                    value={fechaComprobante}
                    onChange={(e) => setFechaComprobante(e.target.value)}
                    className="h-11 w-full rounded-[3px] border-2 border-tinta bg-crema px-2.5 text-sm text-tinta"
                  />
                </div>
              </div>
            </>
          )}

          {modo === 'MANUAL' && (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-crema/75">
                  Artículos del comprobante
                </span>
                <span className="numeral text-sm font-bold text-ambar">
                  Total: ${pesos(calcularTotalRecepcion(lineasNormalizadas.map((l) => ({
                    ...l,
                    precioCosto: l.precioCosto < 0 ? 0 : l.precioCosto,
                  }))))}
                </span>
              </div>

              {lineas.map((linea, indice) => (
                <div key={indice} className="grid gap-2 border-2 border-crema/15 bg-tinta/35 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-crema/60">
                      Línea {indice + 1}
                    </span>
                    {lineas.length > 1 && (
                      <button
                        type="button"
                        disabled={enviando}
                        onClick={() => quitarLinea(indice)}
                        className="inline-flex items-center gap-1 text-xs text-crema/55 hover:text-escarlata"
                      >
                        <IconoQuitar className="size-3.5" /> Quitar
                      </button>
                    )}
                  </div>

                  <ElegirProducto
                    etiqueta="Producto"
                    elegido={linea.producto}
                    enfocar={false}
                    deshabilitado={enviando}
                    alElegir={(prod) =>
                      actualizarLinea(indice, {
                        idProducto: prod?.idProducto ?? null,
                        producto: prod,
                      })
                    }
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase text-crema/70">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999999"
                        disabled={enviando}
                        value={linea.cantidad}
                        onChange={(e) => actualizarLinea(indice, { cantidad: e.target.value })}
                        className="numeral h-10 w-full rounded-[3px] border-2 border-tinta bg-crema px-2.5 text-sm font-semibold text-tinta"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase text-crema/70">
                        Costo unit. ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={enviando}
                        value={linea.precioCosto}
                        onChange={(e) => actualizarLinea(indice, { precioCosto: e.target.value })}
                        placeholder="0.00"
                        className="numeral h-10 w-full rounded-[3px] border-2 border-tinta bg-crema px-2.5 text-sm font-semibold text-tinta"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Boton
                type="button"
                tono="papel"
                tamano="chico"
                disabled={enviando}
                onClick={() => setLineas((prev) => [...prev, LINEA_VACIA()])}
              >
                <IconoMas /> Agregar línea
              </Boton>
            </div>
          )}

          {error && <Aviso tono="mal">{error}</Aviso>}
        </form>
      </Dialogo>

      <FormularioProveedor
        abierto={altaProveedor}
        inicial={inicialProveedor}
        alCerrar={() => setAltaProveedor(false)}
        alGuardar={altaDeProveedor}
      />
    </>
  )
}

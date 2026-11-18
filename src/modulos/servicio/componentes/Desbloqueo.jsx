import { useState } from 'react'
import { Texto } from '../../../ui/Formulario.jsx'
import { Boton } from '../../../ui/Boton.jsx'

// RF21.10 — el patrón o PIN con que se desbloquea el equipo. La ficha de papel
// lo pide como opcional: sin él, el técnico no puede probar el equipo.
//
// El patrón se marca tocando los puntos en el orden en que el cliente los une,
// del 1 al 9 de izquierda a derecha y de arriba abajo, como en el teléfono.

const CENTRO = [20, 60, 100]
const coordenadas = (punto) => ({ x: CENTRO[(punto - 1) % 3], y: CENTRO[Math.floor((punto - 1) / 3)] })

/**
 * La grilla de 3 x 3. Con `alTocar` es un control: cada punto es un botón.
 * Sin él solo dibuja el patrón. Los números dicen en qué orden se une cada punto.
 */
export const GrillaPatron = ({ puntos, alTocar, deshabilitado = false, className = 'size-40', claseNumero = 'fill-azul-hondo' }) => {
  const trazo = puntos.map((punto) => {
    const { x, y } = coordenadas(punto)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 120 120" className={className} role={alTocar ? 'group' : 'img'}
      aria-label={alTocar ? 'Grilla del patrón' : `Patrón: ${puntos.join(', ')}`}>
      {puntos.length > 1 && (
        <polyline points={trazo} fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" opacity="0.55" />
      )}
      {Array.from({ length: 9 }, (_, indice) => {
        const punto = indice + 1
        const { x, y } = coordenadas(punto)
        const orden = puntos.indexOf(punto)
        const elegido = orden >= 0
        const circulo = (
          <>
            <circle cx={x} cy={y} r={elegido ? 11 : 5} fill={elegido ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" />
            {elegido && (
              <text x={x} y={y} dy="0.35em" textAnchor="middle" fontSize="11" fontWeight="700" className={claseNumero}>
                {orden + 1}
              </text>
            )}
          </>
        )
        if (!alTocar) return <g key={punto}>{circulo}</g>
        return (
          <g
            key={punto}
            role="button"
            tabIndex={deshabilitado || elegido ? -1 : 0}
            aria-label={elegido ? `Punto ${punto}, ${orden + 1}.º del patrón` : `Punto ${punto}`}
            aria-disabled={deshabilitado || elegido}
            onClick={() => !deshabilitado && !elegido && alTocar(punto)}
            onKeyDown={(evento) => {
              if ((evento.key === 'Enter' || evento.key === ' ') && !deshabilitado && !elegido) {
                evento.preventDefault()
                alTocar(punto)
              }
            }}
            className={`focus:outline-none ${deshabilitado || elegido ? '' : 'cursor-pointer [&:focus-visible>circle]:stroke-[4]'}`}
          >
            {/* Zona de toque más grande que el punto: se acierta con el dedo. */}
            <circle cx={x} cy={y} r="18" fill="transparent" />
            {circulo}
          </g>
        )
      })}
    </svg>
  )
}

const OPCIONES = [
  { tipo: null, texto: 'No dejó código' },
  { tipo: 'PIN', texto: 'PIN o contraseña' },
  { tipo: 'PATRON', texto: 'Patrón' },
]

/** El campo de la recepción. `valor` es null o { tipo, valor }. */
export const CargarDesbloqueo = ({ valor, alCambiar, error, deshabilitado = false }) => {
  const tipo = valor?.tipo ?? null

  return (
    <fieldset disabled={deshabilitado} className="grid gap-3">
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-crema/75">
        Desbloqueo del equipo
      </legend>
      <div className="flex flex-wrap gap-2">
        {OPCIONES.map((opcion) => (
          <label
            key={opcion.texto}
            className={`flex cursor-pointer items-center gap-2 border-2 px-3 py-2 text-sm font-semibold transition-colors ${
              tipo === opcion.tipo ? 'border-crema bg-crema/10 text-crema' : 'border-crema/25 text-crema/65 hover:border-crema/55'
            }`}
          >
            <input
              type="radio"
              name="desbloqueo"
              checked={tipo === opcion.tipo}
              onChange={() => alCambiar(opcion.tipo ? { tipo: opcion.tipo, valor: opcion.tipo === 'PATRON' ? [] : '' } : null)}
              className="size-4 accent-escarlata"
            />
            {opcion.texto}
          </label>
        ))}
      </div>

      {tipo === 'PIN' && (
        <Texto
          etiqueta="PIN o contraseña"
          value={valor.valor}
          onChange={(evento) => alCambiar({ tipo: 'PIN', valor: evento.target.value })}
          error={error}
          maxLength={16}
          autoComplete="off"
          spellCheck={false}
          className="max-w-xs"
          ayuda="Entre 4 y 16 letras o números."
        />
      )}

      {tipo === 'PATRON' && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="text-crema">
            <GrillaPatron
              puntos={valor.valor}
              alTocar={(punto) => alCambiar({ tipo: 'PATRON', valor: [...valor.valor, punto] })}
              deshabilitado={deshabilitado}
            />
          </div>
          <div className="grid gap-2">
            <p className="max-w-56 text-sm leading-relaxed text-crema/65">
              Tocá los puntos en el orden en que el cliente los une.
            </p>
            {valor.valor.length > 0 && (
              <Boton tono="desnudo" tamano="chico" onClick={() => alCambiar({ tipo: 'PATRON', valor: [] })}>
                Empezar de nuevo
              </Boton>
            )}
            {error && <p className="text-xs font-semibold text-escarlata" role="alert">{error}</p>}
          </div>
        </div>
      )}

      <p className="text-xs leading-relaxed text-crema/55">
        Opcional. Solo lo ve quien trabaja en el taller, no sale impreso y se borra al cerrar la orden.
      </p>
    </fieldset>
  )
}

/** En la ficha: oculto hasta que se pide verlo, para que no quede a la vista del mostrador. */
export const VerDesbloqueo = ({ desbloqueo, cerrada }) => {
  const [visible, setVisible] = useState(false)

  if (!desbloqueo) {
    return (
      <span className="font-normal text-tinta/55">
        {cerrada ? 'Se borró al cerrar la orden' : 'No dejó código'}
      </span>
    )
  }

  const nombre = desbloqueo.tipo === 'PATRON' ? `Patrón de ${desbloqueo.valor.length} puntos` : 'PIN o contraseña'

  return (
    <span className="grid justify-items-start gap-1.5">
      <span>{nombre}</span>
      {visible && (
        desbloqueo.tipo === 'PATRON'
          ? <GrillaPatron puntos={desbloqueo.valor} className="size-28 text-tinta" claseNumero="fill-crema" />
          : <span className="numeral text-base tracking-widest">{desbloqueo.valor}</span>
      )}
      <button
        type="button"
        onClick={() => setVisible((actual) => !actual)}
        className="text-xs font-semibold uppercase tracking-wide text-tinta/70 underline underline-offset-2 hover:text-tinta"
      >
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
    </span>
  )
}

import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useSesion } from '../../../app/sesion.jsx'
import { Boton } from '../../../ui/Boton.jsx'
import { Campo } from '../../../ui/Campo.jsx'
import { Filete } from '../../../ui/Panel.jsx'
import { Aviso } from '../../../ui/Estados.jsx'

export const Ingreso = () => {
  const { usuario, rehidratando, ingresar } = useSesion()
  const navegar = useNavigate()

  const [nombreUsuario, setNombreUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [ayudaOlvido, setAyudaOlvido] = useState(false)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario && !rehidratando) return <Navigate to="/" replace />

  const enviar = async (evento) => {
    evento.preventDefault()
    setError(null)
    setEnviando(true)

    try {
      await ingresar({ nombreUsuario: nombreUsuario.trim(), contrasena })
      navegar('/', { replace: true })
    } catch (fallo) {
      setError(fallo.message)
      setContrasena('')
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-azul px-4 py-10">
      <div className="w-full max-w-sm">
        {/* El nombre del comercio como cartel de chapa. No hay logotipo y no
            se inventa uno: la identidad se resuelve con letra. */}
        <div className="mb-8 -rotate-1 border-[3px] border-tinta bg-ambar px-5 py-4 shadow-[6px_6px_0_var(--color-azul-hondo)]">
          <p className="font-[family-name:var(--font-cartel)] text-3xl uppercase leading-[0.9] tracking-tight text-tinta">
            El Gringo
            <span className="mt-1 block text-[0.62em] text-escarlata">Celulares</span>
          </p>
          <Filete className="mt-3" />
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-tinta/70">
            Sistema de gestion · Formosa
          </p>
        </div>

        <form onSubmit={enviar} noValidate className="grid gap-4">
          <Campo
            etiqueta="Usuario"
            name="usuario"
            autoComplete="username"
            autoFocus
            required
            value={nombreUsuario}
            onChange={(evento) => setNombreUsuario(evento.target.value)}
            disabled={enviando}
          />

          <Campo
            etiqueta="Contraseña"
            name="contrasena"
            type="password"
            autoComplete="current-password"
            required
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            disabled={enviando}
          />

          {error && <Aviso tono="mal">{error}</Aviso>}

          <Boton
            type="submit"
            tamano="cartel"
            cargando={enviando}
            disabled={!nombreUsuario.trim() || !contrasena}
            className="mt-2"
          >
            {enviando ? 'Entrando' : 'Entrar'}
          </Boton>
        </form>

        {/* La contraseña no se recupera: no hay correo y nadie la conoce, ni
            el sistema. Se restablece, y quien la restablece depende de quién
            sea el que se la olvidó. */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setAyudaOlvido((previo) => !previo)}
            aria-expanded={ayudaOlvido}
            className="text-sm font-semibold text-crema/75 underline underline-offset-4 hover:text-crema"
          >
            ¿Olvidaste tu contraseña?
          </button>
          {ayudaOlvido && (
            <div className="mt-3 grid gap-2 border-2 border-crema/20 bg-azul-hondo px-4 py-3 text-sm leading-relaxed text-crema/80">
              <p>
                Pedile al <strong className="text-crema">administrador del local</strong> que te la restablezca
                desde <strong className="text-crema">Usuarios</strong>. Te va a dar una contraseña provisoria.
              </p>
              <p>Entrá con esa y cambiala enseguida en <strong className="text-crema">Mi cuenta</strong>.</p>
              <p className="text-crema/60">Si sos el administrador, pedíselo al soporte del sistema.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

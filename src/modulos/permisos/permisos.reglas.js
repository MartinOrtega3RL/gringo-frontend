// Reglas puras de la matriz de permisos en la interfaz (RF03.3).

// Cada perfil protegido conserva el modulo sin el cual nadie podria volver a
// configurarlo: Soporte la matriz y la bitacora, Administrador los usuarios.
export const PERFILES_PROTEGIDOS = {
  Soporte: 'SOPORTE_SISTEMA',
  Administrador: 'ADMIN_SEGURIDAD',
}

// Los datos de estos módulos son del titular: Soporte no tiene acceso.
export const MODULOS_DEL_NEGOCIO = ['CATALOGO_STOCK', 'CLIENTES_PROV', 'VENTAS', 'SERVICIO_TECNICO', 'REPORTES']

/**
 * RF03.3 — regla de coherencia al tildar casillas:
 * - marcar escritura marca lectura;
 * - desmarcar lectura desmarca escritura.
 */
export const alternarPermiso = (actual, campo, valor) => {
  if (campo === 'escritura') {
    return valor
      ? { lectura: true, escritura: true }
      : { lectura: Boolean(actual?.lectura), escritura: false }
  }
  // campo === 'lectura'
  return valor
    ? { lectura: true, escritura: Boolean(actual?.escritura) }
    : { lectura: false, escritura: false }
}

/**
 * Celdas que no se tocan: la que un perfil protegido necesita para seguir
 * siendo lo que es, la columna de soporte en cualquier otro perfil (el
 * soporte es uno solo; dársela a otro perfil sería un segundo soporte) y
 * los módulos del negocio en Soporte (esos datos son del titular).
 */
export const esCeldaProtegida = (perfil, codigoModulo) =>
  (Object.hasOwn(PERFILES_PROTEGIDOS, perfil?.nombre ?? '') && PERFILES_PROTEGIDOS[perfil.nombre] === codigoModulo) ||
  (codigoModulo === PERFILES_PROTEGIDOS.Soporte && perfil?.nombre !== 'Soporte') ||
  (perfil?.nombre === 'Soporte' && MODULOS_DEL_NEGOCIO.includes(codigoModulo))

export const serializarPermisos = (modulos, mapa) =>
  modulos.map((mod) => ({
    codigoModulo: mod.codigo,
    lectura: Boolean(mapa?.[mod.codigo]?.lectura),
    escritura: Boolean(mapa?.[mod.codigo]?.escritura),
  }))


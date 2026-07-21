import { getDb, leerBody, parseJSON, responseError, responseSuccess } from './_db.js'
import { generarToken, ponerCookieSesion, borrarCookieSesion, verificarSesion, requireBarbero } from './_middleware.js'
import { scryptSync, timingSafeEqual, randomBytes } from 'crypto'

function verificarPassword(password, hashGuardado) {
  const [salt, hashOriginal] = hashGuardado.split(':')
  const hashNuevo = scryptSync(password, salt, 64).toString('hex')
  return timingSafeEqual(Buffer.from(hashNuevo), Buffer.from(hashOriginal))
}

function generarHash(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export default async function handler(req, res) {
  const { action } = req.query
  const sql = getDb()

  // ADMIN LOGIN
  if (action === 'admin-login' && req.method === 'POST') {
    try {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { usuario, password } = data
      if (!usuario || !password) return responseError(res, 'Faltan usuario o password')

      const admins = await sql`
        SELECT id, usuario, password_hash FROM admins WHERE usuario = ${usuario}
      `
      if (admins.length === 0) return responseError(res, 'Usuario o contraseña incorrectos', 401)

      const admin = admins[0]
      const passwordValido = verificarPassword(password, admin.password_hash)
      if (!passwordValido) return responseError(res, 'Usuario o contraseña incorrectos', 401)

      const token = generarToken({ id: admin.id, usuario: admin.usuario })
      ponerCookieSesion(res, 'admin_session', token, 60 * 60 * 8)
      return responseSuccess(res, { admin: { id: admin.id, usuario: admin.usuario } })
    } catch (error) {
      console.error('ERROR en admin-login:', error.message)
      return responseError(res, error.message, 500)
    }
  }

  // BARBERO LOGIN
  if (action === 'barbero-login' && req.method === 'POST') {
    try {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { usuario, password } = data
      if (!usuario || !password) return responseError(res, 'Faltan usuario o password')

      const barberos = await sql`
        SELECT id, nombre, usuario, password_hash FROM barberos WHERE usuario = ${usuario}
      `
      if (barberos.length === 0 || !barberos[0].password_hash) {
        return responseError(res, 'Usuario o contraseña incorrectos', 401)
      }

      const barbero = barberos[0]
      const passwordValido = verificarPassword(password, barbero.password_hash)
      if (!passwordValido) return responseError(res, 'Usuario o contraseña incorrectos', 401)

      const token = generarToken({ id: barbero.id, nombre: barbero.nombre }, '30d')
      ponerCookieSesion(res, 'barbero_session', token, 60 * 60 * 24 * 30)
      return responseSuccess(res, { barbero: { id: barbero.id, nombre: barbero.nombre } })
    } catch (error) {
      console.error('ERROR en barbero-login:', error.message)
      return responseError(res, error.message, 500)
    }
  }

  // CLIENTE LOGIN
  if (action === 'cliente-login' && req.method === 'POST') {
    try {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { nombre, telefono } = data
      if (!nombre || !telefono) return responseError(res, 'Nombre y teléfono son obligatorios')

      let cliente = await sql`
        SELECT id, nombre, telefono, puntos FROM clientes WHERE telefono = ${telefono}
      `
      let nuevo = false
      if (cliente.length === 0) {
        const nuevoCliente = await sql`
          INSERT INTO clientes (nombre, telefono, puntos)
          VALUES (${nombre}, ${telefono}, 0)
          RETURNING id, nombre, telefono, puntos
        `
        cliente = nuevoCliente
        nuevo = true
      }

      const token = generarToken({ id: cliente[0].id, nombre: cliente[0].nombre }, '30d')
      ponerCookieSesion(res, 'cliente_session', token, 60 * 60 * 24 * 30)
      return responseSuccess(res, { cliente: cliente[0], nuevo })
    } catch (error) {
      console.error('ERROR en cliente-login:', error.message)
      return responseError(res, error.message, 500)
    }
  }

  // BARBERO: CAMBIAR CONTRASEÑA
  if (action === 'barbero-cambiar-password' && req.method === 'POST') {
    try {
      const barberoSesion = await requireBarbero(req, res)
      if (!barberoSesion) return

      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { passwordActual, passwordNueva } = data
      if (!passwordActual || !passwordNueva) {
        return responseError(res, 'Faltan la contraseña actual y la nueva')
      }
      if (passwordNueva.length < 6) {
        return responseError(res, 'La nueva contraseña debe tener al menos 6 caracteres')
      }

      const rows = await sql`SELECT password_hash FROM barberos WHERE id = ${barberoSesion.id}`
      if (rows.length === 0) return responseError(res, 'Barbero no encontrado', 404)

      const passwordValido = verificarPassword(passwordActual, rows[0].password_hash)
      if (!passwordValido) return responseError(res, 'La contraseña actual no es correcta', 401)

      const nuevoHash = generarHash(passwordNueva)
      await sql`UPDATE barberos SET password_hash = ${nuevoHash} WHERE id = ${barberoSesion.id}`

      return responseSuccess(res, { ok: true })
    } catch (error) {
      console.error('ERROR en barbero-cambiar-password:', error.message)
      return responseError(res, error.message, 500)
    }
  }

  // QUIÉN ESTÁ LOGUEADO (para AuthContext al cargar la app)
  if (action === 'whoami' && req.method === 'GET') {
    const { admin, cliente, barbero } = verificarSesion(req)
    return responseSuccess(res, { admin, cliente, barbero })
  }

  // LOGOUT (sirve para admin, cliente o barbero)
  if (action === 'logout' && req.method === 'POST') {
    borrarCookieSesion(res, 'admin_session')
    borrarCookieSesion(res, 'cliente_session')
    borrarCookieSesion(res, 'barbero_session')
    return responseSuccess(res, { ok: true })
  }

  return responseError(res, `Acción "${action}" no reconocida`, 400)
}
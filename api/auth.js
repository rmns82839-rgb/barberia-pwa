import { getDb, leerBody, parseJSON, responseError, responseSuccess } from './_db.js'
import { generarToken, ponerCookieSesion, borrarCookieSesion, verificarSesion } from './_middleware.js'
import { scryptSync, timingSafeEqual } from 'crypto'

function verificarPassword(password, hashGuardado) {
  const [salt, hashOriginal] = hashGuardado.split(':')
  const hashNuevo = scryptSync(password, salt, 64).toString('hex')
  return timingSafeEqual(Buffer.from(hashNuevo), Buffer.from(hashOriginal))
}

export default async function handler(req, res) {
  console.log('📌 auth.js recibió petición:', req.method, req.query)
  
  const { action } = req.query
  const sql = getDb()

  // ADMIN LOGIN
  if (action === 'admin-login' && req.method === 'POST') {
    try {
      console.log('🔐 Intentando login admin...')
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) {
        console.log('❌ JSON inválido')
        return responseError(res, 'JSON inválido')
      }

      const { usuario, password } = data
      console.log('👤 Usuario:', usuario)
      
      if (!usuario || !password) {
        console.log('❌ Faltan datos')
        return responseError(res, 'Faltan usuario o password')
      }

      const admins = await sql`
        SELECT id, usuario, password_hash FROM admins WHERE usuario = ${usuario}
      `
      console.log('📊 Admins encontrados:', admins.length)

      if (admins.length === 0) {
        console.log('❌ Usuario no encontrado')
        return responseError(res, 'Usuario o contraseña incorrectos', 401)
      }

      const admin = admins[0]
      const passwordValido = verificarPassword(password, admin.password_hash)
      console.log('🔑 Password válido:', passwordValido)
      
      if (!passwordValido) {
        console.log('❌ Password incorrecto')
        return responseError(res, 'Usuario o contraseña incorrectos', 401)
      }

      const token = generarToken({ id: admin.id, usuario: admin.usuario })
      console.log('✅ Login exitoso!')

      ponerCookieSesion(res, 'admin_session', token, 60 * 60 * 8) // 8h
      return responseSuccess(res, { admin: { id: admin.id, usuario: admin.usuario } })
    } catch (error) {
      console.error('❌ ERROR en admin-login:', error.message)
      return responseError(res, error.message, 500)
    }
  }

  // CLIENTE LOGIN
  if (action === 'cliente-login' && req.method === 'POST') {
    try {
      console.log('🔐 Intentando login cliente...')
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { nombre, telefono } = data
      if (!nombre || !telefono) {
        return responseError(res, 'Nombre y teléfono son obligatorios')
      }

      let cliente = await sql`
        SELECT id, nombre, telefono, puntos FROM clientes 
        WHERE telefono = ${telefono}
      `

      let nuevo = false
      if (cliente.length === 0) {
        console.log('📝 Creando nuevo cliente...')
        const nuevoCliente = await sql`
          INSERT INTO clientes (nombre, telefono, puntos)
          VALUES (${nombre}, ${telefono}, 0)
          RETURNING id, nombre, telefono, puntos
        `
        cliente = nuevoCliente
        nuevo = true
      }

      const token = generarToken({ 
        id: cliente[0].id, 
        nombre: cliente[0].nombre 
      }, '30d')

      console.log('✅ Cliente login exitoso!')
      ponerCookieSesion(res, 'cliente_session', token, 60 * 60 * 24 * 30) // 30 días
      return responseSuccess(res, {
        cliente: cliente[0],
        nuevo
      })
    } catch (error) {
      console.error('❌ ERROR en cliente-login:', error.message)
      return responseError(res, error.message, 500)
    }
  }

  // QUIÉN ESTÁ LOGUEADO (para AuthContext al cargar la app)
  if (action === 'whoami' && req.method === 'GET') {
    const { admin, cliente } = verificarSesion(req)
    return responseSuccess(res, { admin, cliente })
  }

  // LOGOUT
  if (action === 'logout' && req.method === 'POST') {
    borrarCookieSesion(res, 'admin_session')
    borrarCookieSesion(res, 'cliente_session')
    return responseSuccess(res, { ok: true })
  }

  console.log('❌ Acción no reconocida:', action)
  return responseError(res, `Acción "${action}" no reconocida`, 400)
}
import jwt from 'jsonwebtoken'
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET no configurada')

export function generarToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

function leerCookie(req, nombre) {
  const raw = req.headers.cookie
  if (!raw) return null
  const match = raw.split(';').map(c => c.trim()).find(c => c.startsWith(nombre + '='))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

function agregarSetCookie(res, valor) {
  const actual = res.getHeader('Set-Cookie')
  if (!actual) {
    res.setHeader('Set-Cookie', valor)
  } else if (Array.isArray(actual)) {
    res.setHeader('Set-Cookie', [...actual, valor])
  } else {
    res.setHeader('Set-Cookie', [actual, valor])
  }
}

export function ponerCookieSesion(res, nombre, token, maxAgeSegundos) {
  agregarSetCookie(res, `${nombre}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSegundos}`)
}

export function borrarCookieSesion(res, nombre) {
  agregarSetCookie(res, `${nombre}=; Path=/; HttpOnly; Max-Age=0`)
}

function verificarToken(req, cookieName) {
  const token = leerCookie(req, cookieName)
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// Para el chequeo de "quién está logueado" al cargar la app — SÍ valida contra la BD
// (si el registro ya no existe, borra la cookie inválida para que la app deje de creer que hay sesión)
export async function verificarSesion(req, res) {
  const adminToken = verificarToken(req, 'admin_session')
  const clienteToken = verificarToken(req, 'cliente_session')
  const barberoToken = verificarToken(req, 'barbero_session')

  let admin = null
  let cliente = null
  let barbero = null

  if (adminToken) {
    const rows = await sql`SELECT id FROM admins WHERE id = ${adminToken.id}`
    if (rows.length > 0) admin = adminToken
    else if (res) borrarCookieSesion(res, 'admin_session')
  }

  if (clienteToken) {
    const rows = await sql`SELECT id FROM clientes WHERE id = ${clienteToken.id}`
    if (rows.length > 0) cliente = clienteToken
    else if (res) borrarCookieSesion(res, 'cliente_session')
  }

  if (barberoToken) {
    const rows = await sql`SELECT id FROM barberos WHERE id = ${barberoToken.id}`
    if (rows.length > 0) barbero = barberoToken
    else if (res) borrarCookieSesion(res, 'barbero_session')
  }

  return { admin, cliente, barbero }
}

export async function requireAdmin(req, res) {
  const admin = verificarToken(req, 'admin_session')
  if (!admin) { res.status(401).json({ error: 'No autorizado' }); return null }
  const admins = await sql`SELECT id FROM admins WHERE id = ${admin.id}`
  if (admins.length === 0) { res.status(401).json({ error: 'Usuario no encontrado' }); return null }
  return admin
}

export async function requireCliente(req, res) {
  const cliente = verificarToken(req, 'cliente_session')
  if (!cliente) { res.status(401).json({ error: 'No autorizado' }); return null }
  const clientes = await sql`SELECT id FROM clientes WHERE id = ${cliente.id}`
  if (clientes.length === 0) { res.status(401).json({ error: 'Usuario no encontrado' }); return null }
  return cliente
}

export async function requireBarbero(req, res) {
  const barbero = verificarToken(req, 'barbero_session')
  if (!barbero) { res.status(401).json({ error: 'No autorizado' }); return null }
  const barberos = await sql`SELECT id FROM barberos WHERE id = ${barbero.id}`
  if (barberos.length === 0) { res.status(401).json({ error: 'Barbero no encontrado' }); return null }
  return barbero
}
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

export function ponerCookieSesion(res, nombre, token, maxAgeSegundos) {
  res.setHeader('Set-Cookie',
    `${nombre}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSegundos}`
  )
}

export function borrarCookieSesion(res, nombre) {
  res.setHeader('Set-Cookie', `${nombre}=; Path=/; HttpOnly; Max-Age=0`)
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

// Para el chequeo rápido de "quién está logueado" al cargar la app (no toca la BD)
export function verificarSesion(req) {
  return {
    admin: verificarToken(req, 'admin_session'),
    cliente: verificarToken(req, 'cliente_session'),
    barbero: verificarToken(req, 'barbero_session'),
  }
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
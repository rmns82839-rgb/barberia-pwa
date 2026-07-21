import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

let sqlInstance = null

export function getDb() {
  if (!sqlInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no configurada')
    }
    sqlInstance = neon(process.env.DATABASE_URL)
  }
  return sqlInstance
}

export function leerBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
  })
}

export function parseJSON(data) {
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function responseError(res, message, status = 400) {
  return res.status(status).json({ error: message })
}

export function responseSuccess(res, data, status = 200) {
  return res.status(status).json(data)
}
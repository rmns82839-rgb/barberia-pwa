import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL)
    const barberos = await sql`
      SELECT id, nombre, alias, especialidad, estado, activo, foto, whatsapp
      FROM barberos
      WHERE activo = true
      ORDER BY id
    `
    res.status(200).json(barberos)
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    res.status(500).json({ error: error.message })
  }
}
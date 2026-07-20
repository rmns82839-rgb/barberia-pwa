import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL)
    const productos = await sql`
      SELECT id, nombre, descripcion, precio, imagen_url
      FROM productos
      ORDER BY id
    `
    return res.status(200).json({ productos })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
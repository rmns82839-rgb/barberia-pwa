import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

export default async function handler(req, res) {
  const notificacion_id = req.query.notificacion_id

  if (!notificacion_id) {
    return res.status(400).json({ error: "Falta notificacion_id" })
  }

  try {
    const sql = neon(process.env.DATABASE_URL)
    const filas = await sql`
      SELECT respuesta FROM notificaciones WHERE id = ${notificacion_id}
    `

    if (filas.length === 0) {
      return res.status(404).json({ error: "No encontrado" })
    }

    return res.status(200).json({ respuesta: filas[0].respuesta })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
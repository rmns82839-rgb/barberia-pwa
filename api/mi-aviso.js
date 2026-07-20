import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

export default async function handler(req, res) {
  const cliente_id = req.query.cliente_id
  const fecha = req.query.fecha

  if (!cliente_id || !fecha) {
    return res.status(400).json({ error: "Faltan cliente_id o fecha" })
  }

  try {
    const sql = neon(process.env.DATABASE_URL)

    // Buscar avisos de proximidad para citas de este cliente hoy, sin responder
    const avisos = await sql`
      SELECT
        n.id AS notificacion_id,
        to_char(c.hora, 'HH24:MI') AS hora,
        b.nombre AS barbero_nombre
      FROM notificaciones n
      JOIN citas c ON c.id = n.cita_id
      JOIN barberos b ON b.id = c.barbero_id
      WHERE c.cliente_id = ${cliente_id}
        AND c.fecha = ${fecha}
        AND n.tipo = 'aviso_proximidad'
        AND n.respuesta IS NULL
      ORDER BY n.enviado_en DESC
      LIMIT 1
    `

    if (avisos.length === 0) {
      return res.status(200).json({ aviso: null })
    }

    return res.status(200).json({ aviso: avisos[0] })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
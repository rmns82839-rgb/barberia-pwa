import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

export default async function handler(req, res) {
  const fecha = req.query.fecha // YYYY-MM-DD

  if (!fecha) {
    return res.status(400).json({ error: "Falta la fecha" })
  }

  try {
    const sql = neon(process.env.DATABASE_URL)

    const citas = await sql`
      SELECT
        c.id,
        c.barbero_id,
        c.tipo,
        c.estado,
        to_char(c.hora, 'HH24:MI') AS hora,
        c.servicio,
        b.nombre AS barbero_nombre,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono
      FROM citas c
      JOIN barberos b ON b.id = c.barbero_id
      LEFT JOIN clientes cl ON cl.id = c.cliente_id
      WHERE c.fecha = ${fecha}
        AND c.estado != 'cancelada'
      ORDER BY c.hora ASC
    `

    return res.status(200).json({ citas })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
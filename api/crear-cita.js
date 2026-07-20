import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  const { barbero_id, cliente_id, fecha, hora, servicio } = req.body

  if (!barbero_id || !cliente_id || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos obligatorios" })
  }

  try {
    const sql = neon(process.env.DATABASE_URL)

    // Verificamos que el bloque siga libre (evita doble reserva)
    const ocupada = await sql`
      SELECT id FROM citas
      WHERE barbero_id = ${barbero_id}
        AND fecha = ${fecha}
        AND hora = ${hora}
        AND estado != 'cancelada'
    `
    if (ocupada.length > 0) {
      return res.status(409).json({ error: "Ese horario ya fue tomado, elige otro" })
    }

    const nueva = await sql`
      INSERT INTO citas (barbero_id, cliente_id, tipo, fecha, hora, servicio, estado)
      VALUES (${barbero_id}, ${cliente_id}, 'agendada', ${fecha}, ${hora}, ${servicio || null}, 'confirmada')
      RETURNING id, barbero_id, fecha, to_char(hora, 'HH24:MI') AS hora, servicio
    `

    return res.status(201).json({ cita: nueva[0] })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
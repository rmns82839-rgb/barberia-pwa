import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

function leerBody(req) {
  return new Promise((resolve) => {
    let data = ""
    req.on("data", (chunk) => (data += chunk))
    req.on("end", () => resolve(data))
  })
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const raw = await leerBody(req)
    let barbero_id, fecha
    try {
      const parsed = JSON.parse(raw)
      barbero_id = parsed.barbero_id
      fecha = parsed.fecha
    } catch {
      return res.status(400).json({ error: "JSON inválido" })
    }

    if (!barbero_id || !fecha) {
      return res.status(400).json({ error: "Faltan barbero_id o fecha" })
    }

    const sql = neon(process.env.DATABASE_URL)

    // Buscar la próxima cita AGENDADA del barbero ese día que aún no fue avisada
    const proxima = await sql`
      SELECT
        c.id,
        to_char(c.hora, 'HH24:MI') AS hora,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono
      FROM citas c
      JOIN clientes cl ON cl.id = c.cliente_id
      WHERE c.barbero_id = ${barbero_id}
        AND c.fecha = ${fecha}
        AND c.tipo = 'agendada'
        AND c.estado = 'confirmada'
      ORDER BY c.hora ASC
      LIMIT 1
    `

    if (proxima.length === 0) {
      return res.status(200).json({ mensaje: "No hay próximas citas por avisar" })
    }

    const cita = proxima[0]

    // Registrar el aviso y capturar su id
    const notif = await sql`
      INSERT INTO notificaciones (cita_id, tipo)
      VALUES (${cita.id}, 'aviso_proximidad')
      RETURNING id
    `

    return res.status(200).json({
      cita: {
        id: cita.id,
        hora: cita.hora,
        cliente_nombre: cita.cliente_nombre,
        cliente_telefono: cita.cliente_telefono,
      },
      notificacion_id: notif[0].id,
    })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
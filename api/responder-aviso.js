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
    let notificacion_id, respuesta
    try {
      const parsed = JSON.parse(raw)
      notificacion_id = parsed.notificacion_id
      respuesta = parsed.respuesta
    } catch {
      return res.status(400).json({ error: "JSON inválido" })
    }

    if (!notificacion_id || !respuesta) {
      return res.status(400).json({ error: "Faltan datos" })
    }

    if (respuesta !== "confirmado" && respuesta !== "cancelado") {
      return res.status(400).json({ error: "Respuesta no válida" })
    }

    const sql = neon(process.env.DATABASE_URL)
    await sql`
      UPDATE notificaciones
      SET respuesta = ${respuesta}, respondido_en = now()
      WHERE id = ${notificacion_id}
    `

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
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
    let barbero_id, estado
    try {
      const parsed = JSON.parse(raw)
      barbero_id = parsed.barbero_id
      estado = parsed.estado
    } catch {
      return res.status(400).json({ error: "JSON inválido" })
    }

    if (!barbero_id || !estado) {
      return res.status(400).json({ error: "Faltan barbero_id o estado" })
    }

    if (estado !== "disponible" && estado !== "ocupado") {
      return res.status(400).json({ error: "Estado no válido" })
    }

    const sql = neon(process.env.DATABASE_URL)
    const actualizado = await sql`
      UPDATE barberos
      SET estado = ${estado}
      WHERE id = ${barbero_id}
      RETURNING id, nombre, estado
    `

    if (actualizado.length === 0) {
      return res.status(404).json({ error: "Barbero no encontrado" })
    }

    return res.status(200).json({ barbero: actualizado[0] })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
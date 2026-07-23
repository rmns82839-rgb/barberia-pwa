import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"
import { requireAdmin } from "./_middleware.js"

dotenv.config({ path: ".env.local" })

function leerBody(req) {
  return new Promise((resolve) => {
    let data = ""
    req.on("data", (chunk) => (data += chunk))
    req.on("end", () => resolve(data))
  })
}

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL)

    // ---- GET: información pública del negocio (sin auth) ----
    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM negocio WHERE id = 1`
      return res.status(200).json({ negocio: rows[0] || null })
    }

    // ---- PUT: editar información (solo admin) ----
    if (req.method === "PUT") {
      const admin = await requireAdmin(req, res)
      if (!admin) return

      const raw = await leerBody(req)
      let data
      try {
        data = JSON.parse(raw)
      } catch {
        return res.status(400).json({ error: "JSON inválido" })
      }

      const actual = await sql`SELECT * FROM negocio WHERE id = 1`
      const base = actual[0] || {}

      const campos = [
        "nombre", "eslogan", "direccion", "logo_url",
        "foto_ubicacion_url", "instagram", "facebook", "tiktok", "mapa_url",
        "whatsapp", "youtube",
      ]
      const merged = {}
      for (const campo of campos) {
        merged[campo] = data[campo] !== undefined ? (data[campo] || null) : (base[campo] ?? null)
      }

      await sql`
        INSERT INTO negocio (id, nombre, eslogan, direccion, logo_url, foto_ubicacion_url, instagram, facebook, tiktok, mapa_url, whatsapp, youtube)
        VALUES (1, ${merged.nombre}, ${merged.eslogan}, ${merged.direccion}, ${merged.logo_url}, ${merged.foto_ubicacion_url}, ${merged.instagram}, ${merged.facebook}, ${merged.tiktok}, ${merged.mapa_url}, ${merged.whatsapp}, ${merged.youtube})
        ON CONFLICT (id) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          eslogan = EXCLUDED.eslogan,
          direccion = EXCLUDED.direccion,
          logo_url = EXCLUDED.logo_url,
          foto_ubicacion_url = EXCLUDED.foto_ubicacion_url,
          instagram = EXCLUDED.instagram,
          facebook = EXCLUDED.facebook,
          tiktok = EXCLUDED.tiktok,
          mapa_url = EXCLUDED.mapa_url,
          whatsapp = EXCLUDED.whatsapp,
          youtube = EXCLUDED.youtube
      `
      return res.status(200).json({ ok: true, negocio: merged })
    }

    return res.status(405).json({ error: "Método no permitido" })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
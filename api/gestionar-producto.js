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
  try {
    const sql = neon(process.env.DATABASE_URL)
    const raw = await leerBody(req)
    let body = {}
    if (raw) {
      try {
        body = JSON.parse(raw)
      } catch {
        return res.status(400).json({ error: "JSON inválido" })
      }
    }

    // CREAR producto
    if (req.method === "POST") {
      const { nombre, descripcion, precio, imagen_url } = body
      if (!nombre || precio == null) {
        return res.status(400).json({ error: "Faltan nombre o precio" })
      }
      const nuevo = await sql`
        INSERT INTO productos (nombre, descripcion, precio, imagen_url)
        VALUES (${nombre}, ${descripcion || null}, ${precio}, ${imagen_url || null})
        RETURNING id, nombre, descripcion, precio, imagen_url
      `
      return res.status(201).json({ producto: nuevo[0] })
    }

    // EDITAR producto
    if (req.method === "PUT") {
      const { id, nombre, descripcion, precio, imagen_url } = body
      if (!id) return res.status(400).json({ error: "Falta id" })
      const editado = await sql`
        UPDATE productos
        SET nombre = ${nombre},
            descripcion = ${descripcion || null},
            precio = ${precio},
            imagen_url = ${imagen_url || null}
        WHERE id = ${id}
        RETURNING id, nombre, descripcion, precio, imagen_url
      `
      return res.status(200).json({ producto: editado[0] })
    }

    // ELIMINAR producto
    if (req.method === "DELETE") {
      const { id } = body
      if (!id) return res.status(400).json({ error: "Falta id" })
      await sql`DELETE FROM productos WHERE id = ${id}`
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: "Método no permitido" })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
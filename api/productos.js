import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const sql = neon(process.env.DATABASE_URL)

    // ---- Lista de categorías (para las tarjetas del catálogo) ----
    if (req.query.categorias) {
      const categorias = await sql`SELECT id, nombre, orden FROM categorias ORDER BY orden, nombre`
      return res.status(200).json({ categorias })
    }

    // ---- Fotos de un producto (para el carrusel) ----
    if (req.query.imagenes) {
      const imagenes = await sql`
        SELECT id, imagen_url, orden FROM producto_imagenes
        WHERE producto_id = ${req.query.imagenes} ORDER BY orden, id
      `
      return res.status(200).json({ imagenes })
    }

    // ---- Productos (opcionalmente filtrados por categoria_id) ----
    const categoriaId = req.query.categoria_id
    const productos = categoriaId
      ? await sql`
          SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen_url, p.categoria_id, c.nombre AS categoria_nombre
          FROM productos p
          LEFT JOIN categorias c ON c.id = p.categoria_id
          WHERE p.categoria_id = ${categoriaId}
          ORDER BY p.id
        `
      : await sql`
          SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen_url, p.categoria_id, c.nombre AS categoria_nombre
          FROM productos p
          LEFT JOIN categorias c ON c.id = p.categoria_id
          ORDER BY c.orden NULLS LAST, p.id
        `
    return res.status(200).json({ productos })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
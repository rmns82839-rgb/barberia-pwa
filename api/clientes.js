import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  const { nombre, telefono } = req.body

  if (!nombre || !telefono) {
    return res.status(400).json({ error: "Nombre y teléfono son obligatorios" })
  }

  try {
    const sql = neon(process.env.DATABASE_URL)

    // ¿Ya existe un cliente con ese teléfono?
    const existente = await sql`SELECT id, nombre, telefono FROM clientes WHERE telefono = ${telefono}`

    if (existente.length > 0) {
      // Cliente ya registrado: lo devolvemos
      return res.status(200).json({ cliente: existente[0], nuevo: false })
    }

    // Cliente nuevo: lo insertamos
    const nuevo = await sql`
      INSERT INTO clientes (nombre, telefono)
      VALUES (${nombre}, ${telefono})
      RETURNING id, nombre, telefono
    `
    return res.status(201).json({ cliente: nuevo[0], nuevo: true })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
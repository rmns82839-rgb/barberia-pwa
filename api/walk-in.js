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
    let barbero_id, fecha, hora, nombre, telefono
    try {
      const parsed = JSON.parse(raw)
      barbero_id = parsed.barbero_id
      fecha = parsed.fecha
      hora = parsed.hora
      nombre = parsed.nombre     // opcional
      telefono = parsed.telefono // opcional
    } catch {
      return res.status(400).json({ error: "JSON inválido" })
    }

    if (!barbero_id || !fecha || !hora) {
      return res.status(400).json({ error: "Faltan barbero_id, fecha u hora" })
    }

    const sql = neon(process.env.DATABASE_URL)

    let cliente_id = null

    // Si el admin escribió un nombre, buscamos o creamos el cliente
    if (nombre && nombre.trim()) {
      if (telefono && telefono.trim()) {
        // Con teléfono: buscamos si ya existe
        const existente = await sql`SELECT id FROM clientes WHERE telefono = ${telefono.trim()}`
        if (existente.length > 0) {
          cliente_id = existente[0].id
        } else {
          const nuevo = await sql`
            INSERT INTO clientes (nombre, telefono)
            VALUES (${nombre.trim()}, ${telefono.trim()})
            RETURNING id
          `
          cliente_id = nuevo[0].id
        }
      } else {
        // Solo nombre, sin teléfono: creamos cliente con teléfono placeholder único
        const nuevo = await sql`
          INSERT INTO clientes (nombre, telefono)
          VALUES (${nombre.trim()}, ${'walkin-' + Date.now()})
          RETURNING id
        `
        cliente_id = nuevo[0].id
      }
    }

    // Creamos la cita tipo walk_in
    const cita = await sql`
      INSERT INTO citas (barbero_id, cliente_id, tipo, fecha, hora, estado)
      VALUES (${barbero_id}, ${cliente_id}, 'walk_in', ${fecha}, ${hora}, 'confirmada')
      RETURNING id, to_char(hora, 'HH24:MI') AS hora
    `

    // Marcamos al barbero como ocupado
    await sql`UPDATE barberos SET estado = 'ocupado' WHERE id = ${barbero_id}`

    return res.status(201).json({ cita: cita[0] })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
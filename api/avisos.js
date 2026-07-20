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
    const accion = req.query.accion

    // ---- POST: avisar al siguiente cliente (admin) ----
    if (req.method === "POST" && accion === "avisar") {
      const raw = await leerBody(req)
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        return res.status(400).json({ error: "JSON inválido" })
      }
      const { barbero_id, fecha } = body
      if (!barbero_id || !fecha) {
        return res.status(400).json({ error: "Faltan barbero_id o fecha" })
      }

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
    }

    // ---- GET: consultar si el cliente tiene un aviso pendiente ----
    if (req.method === "GET" && accion === "mi-aviso") {
      const cliente_id = req.query.cliente_id
      const fecha = req.query.fecha
      if (!cliente_id || !fecha) {
        return res.status(400).json({ error: "Faltan cliente_id o fecha" })
      }

      const avisos = await sql`
        SELECT
          n.id AS notificacion_id,
          to_char(c.hora, 'HH24:MI') AS hora,
          b.nombre AS barbero_nombre
        FROM notificaciones n
        JOIN citas c ON c.id = n.cita_id
        JOIN barberos b ON b.id = c.barbero_id
        WHERE c.cliente_id = ${cliente_id}
          AND c.fecha = ${fecha}
          AND n.tipo = 'aviso_proximidad'
          AND n.respuesta IS NULL
        ORDER BY n.enviado_en DESC
        LIMIT 1
      `

      if (avisos.length === 0) {
        return res.status(200).json({ aviso: null })
      }
      return res.status(200).json({ aviso: avisos[0] })
    }

    // ---- POST: el cliente responde el aviso ----
    if (req.method === "POST" && accion === "responder") {
      const raw = await leerBody(req)
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        return res.status(400).json({ error: "JSON inválido" })
      }
      const { notificacion_id, respuesta } = body
      if (!notificacion_id || !respuesta) {
        return res.status(400).json({ error: "Faltan datos" })
      }
      if (respuesta !== "confirmado" && respuesta !== "cancelado") {
        return res.status(400).json({ error: "Respuesta no válida" })
      }

      await sql`
        UPDATE notificaciones
        SET respuesta = ${respuesta}, respondido_en = now()
        WHERE id = ${notificacion_id}
      `
      return res.status(200).json({ ok: true })
    }

    // ---- GET: el admin consulta el estado de la respuesta ----
    if (req.method === "GET" && accion === "estado") {
      const notificacion_id = req.query.notificacion_id
      if (!notificacion_id) {
        return res.status(400).json({ error: "Falta notificacion_id" })
      }
      const filas = await sql`
        SELECT respuesta FROM notificaciones WHERE id = ${notificacion_id}
      `
      if (filas.length === 0) {
        return res.status(404).json({ error: "No encontrado" })
      }
      return res.status(200).json({ respuesta: filas[0].respuesta })
    }

    return res.status(400).json({ error: "Acción no reconocida" })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
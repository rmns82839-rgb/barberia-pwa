import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const DURACION_MIN = 45

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

    // ---- GET: mi aviso de proximidad (cliente) ----
    if (req.method === "GET" && accion === "mi-aviso") {
      const cliente_id = req.query.cliente_id
      const fecha = req.query.fecha
      if (!cliente_id || !fecha) return res.status(400).json({ error: "Faltan cliente_id o fecha" })

      const avisos = await sql`
        SELECT n.id AS notificacion_id, to_char(c.hora, 'HH24:MI') AS hora, b.nombre AS barbero_nombre
        FROM notificaciones n
        JOIN citas c ON c.id = n.cita_id
        JOIN barberos b ON b.id = c.barbero_id
        WHERE c.cliente_id = ${cliente_id} AND c.fecha = ${fecha}
          AND n.tipo = 'aviso_proximidad' AND n.respuesta IS NULL
        ORDER BY n.enviado_en DESC LIMIT 1
      `
      return res.status(200).json({ aviso: avisos[0] || null })
    }

    // ---- POST: responder aviso de proximidad (cliente) ----
    if (req.method === "POST" && accion === "responder-aviso") {
      const body = await leerBody(req)
      const data = JSON.parse(body)
      const { notificacion_id, respuesta } = data
      if (!notificacion_id || !respuesta) return res.status(400).json({ error: "Faltan datos" })
      if (respuesta !== 'confirmado' && respuesta !== 'cancelado') return res.status(400).json({ error: "Respuesta no válida" })

      const result = await sql`
        UPDATE notificaciones SET respuesta = ${respuesta}, respondido_en = now()
        WHERE id = ${notificacion_id} RETURNING id
      `
      if (result.length === 0) return res.status(404).json({ error: "Notificación no encontrada" })
      return res.status(200).json({ ok: true })
    }

    // ---- GET: disponibilidad de horarios ----
    if (req.method === "GET" && accion === "disponibilidad") {
      const barbero_id = req.query.barbero_id
      const fecha = req.query.fecha
      if (!barbero_id || !fecha) {
        return res.status(400).json({ error: "Faltan barbero_id o fecha" })
      }

      const excepcion = await sql`
        SELECT cerrado, abre, cierra FROM horario_excepciones WHERE fecha = ${fecha}
      `
      let abre, cierra
      if (excepcion.length > 0) {
        if (excepcion[0].cerrado) {
          return res.status(200).json({ disponibles: [], mensaje: "Cerrado ese día" })
        }
        abre = excepcion[0].abre
        cierra = excepcion[0].cierra
      } else {
        const diaSemana = new Date(fecha + "T00:00:00").getDay()
        const horario = await sql`
          SELECT abre, cierra, activo FROM horario_semanal WHERE dia_semana = ${diaSemana}
        `
        if (horario.length === 0 || !horario[0].activo || !horario[0].abre) {
          return res.status(200).json({ disponibles: [], mensaje: "Cerrado ese día" })
        }
        abre = horario[0].abre
        cierra = horario[0].cierra
      }

      const bloques = []
      let [h, m] = abre.split(":").map(Number)
      const [hCierra, mCierra] = cierra.split(":").map(Number)
      const finMinutos = hCierra * 60 + mCierra
      while (h * 60 + m + DURACION_MIN <= finMinutos) {
        const hora = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        bloques.push(hora)
        m += DURACION_MIN
        while (m >= 60) {
          m -= 60
          h += 1
        }
      }

      const ocupadas = await sql`
        SELECT to_char(hora, 'HH24:MI') AS hora
        FROM citas
        WHERE barbero_id = ${barbero_id}
          AND fecha = ${fecha}
          AND estado != 'cancelada'
      `
      const horasOcupadas = ocupadas.map((o) => o.hora)
      const disponibles = bloques.filter((b) => !horasOcupadas.includes(b))
      return res.status(200).json({ disponibles })
    }

    // ---- GET: citas del día (admin) ----
    if (req.method === "GET" && accion === "dia") {
      const fecha = req.query.fecha
      if (!fecha) {
        return res.status(400).json({ error: "Falta la fecha" })
      }
      const citas = await sql`
        SELECT
          c.id, c.barbero_id, c.tipo, c.estado,
          to_char(c.hora, 'HH24:MI') AS hora,
          c.servicio,
          b.nombre AS barbero_nombre,
          cl.nombre AS cliente_nombre,
          cl.telefono AS cliente_telefono
        FROM citas c
        JOIN barberos b ON b.id = c.barbero_id
        LEFT JOIN clientes cl ON cl.id = c.cliente_id
        WHERE c.fecha = ${fecha}
          AND c.estado != 'cancelada'
        ORDER BY c.hora ASC
      `
      return res.status(200).json({ citas })
    }

    // ---- POST: crear cita agendada ----
    if (req.method === "POST" && accion === "crear") {
      const raw = await leerBody(req)
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        return res.status(400).json({ error: "JSON inválido" })
      }
      const { barbero_id, cliente_id, fecha, hora, servicio } = body
      if (!barbero_id || !cliente_id || !fecha || !hora) {
        return res.status(400).json({ error: "Faltan datos obligatorios" })
      }

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
    }

    // ---- POST: registrar walk-in ----
    if (req.method === "POST" && accion === "walkin") {
      const raw = await leerBody(req)
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        return res.status(400).json({ error: "JSON inválido" })
      }
      const { barbero_id, fecha, hora, nombre, telefono } = body
      if (!barbero_id || !fecha || !hora) {
        return res.status(400).json({ error: "Faltan barbero_id, fecha u hora" })
      }

      let cliente_id = null
      if (nombre && nombre.trim()) {
        if (telefono && telefono.trim()) {
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
          const nuevo = await sql`
            INSERT INTO clientes (nombre, telefono)
            VALUES (${nombre.trim()}, ${'walkin-' + Date.now()})
            RETURNING id
          `
          cliente_id = nuevo[0].id
        }
      }

      const cita = await sql`
        INSERT INTO citas (barbero_id, cliente_id, tipo, fecha, hora, estado)
        VALUES (${barbero_id}, ${cliente_id}, 'walk_in', ${fecha}, ${hora}, 'confirmada')
        RETURNING id, to_char(hora, 'HH24:MI') AS hora
      `
      await sql`UPDATE barberos SET estado = 'ocupado' WHERE id = ${barbero_id}`
      return res.status(201).json({ cita: cita[0] })
    }

    return res.status(400).json({ error: "Acción no reconocida" })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
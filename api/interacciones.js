import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"
import { requireCliente, requireBarbero, verificarSesion } from "./_middleware.js"

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

    // ---- GET: likes + comentarios de un item (público; si hay sesión de cliente, indica si ya reaccionó) ----
    if (req.method === "GET" && !accion) {
      const { tipo, item_id } = req.query
      if (!tipo || !item_id) return res.status(400).json({ error: "Faltan tipo o item_id" })

      const totalLikes = await sql`
        SELECT COUNT(*) FROM reacciones WHERE tipo = ${tipo} AND item_id = ${item_id}
      `
      const comentarios = await sql`
        SELECT c.id, c.comentario, c.creado_en, c.cliente_id, c.respuesta_a, cl.nombre AS cliente_nombre
        FROM comentarios c
        JOIN clientes cl ON cl.id = c.cliente_id
        WHERE c.tipo = ${tipo} AND c.item_id = ${item_id}
        ORDER BY c.creado_en ASC
      `

      let miLike = false
      const { cliente } = await verificarSesion(req, res)
      if (cliente) {
        const yaLike = await sql`
          SELECT id FROM reacciones WHERE tipo = ${tipo} AND item_id = ${item_id} AND cliente_id = ${cliente.id}
        `
        miLike = yaLike.length > 0
      }

      return res.status(200).json({
        total_likes: Number(totalLikes[0].count),
        comentarios,
        mi_like: miLike,
        mi_cliente_id: cliente?.id || null,
      })
    }

    // ---- POST: dar/quitar "me encanta" ----
    if (req.method === "POST" && accion === "like") {
      const cliente = await requireCliente(req, res)
      if (!cliente) return

      const raw = await leerBody(req)
      let data
      try { data = JSON.parse(raw) } catch { return res.status(400).json({ error: "JSON inválido" }) }
      const { tipo, item_id } = data
      if (!tipo || !item_id) return res.status(400).json({ error: "Faltan tipo o item_id" })

      const existente = await sql`
        SELECT id FROM reacciones WHERE tipo = ${tipo} AND item_id = ${item_id} AND cliente_id = ${cliente.id}
      `
      if (existente.length > 0) {
        await sql`DELETE FROM reacciones WHERE id = ${existente[0].id}`
        return res.status(200).json({ like: false })
      }
      await sql`INSERT INTO reacciones (tipo, item_id, cliente_id) VALUES (${tipo}, ${item_id}, ${cliente.id})`
      return res.status(200).json({ like: true })
    }

    // ---- POST: agregar un comentario nuevo (ilimitados por cliente; puede ser respuesta a otro) ----
    if (req.method === "POST" && accion === "comentar") {
      const cliente = await requireCliente(req, res)
      if (!cliente) return

      const raw = await leerBody(req)
      let data
      try { data = JSON.parse(raw) } catch { return res.status(400).json({ error: "JSON inválido" }) }
      const { tipo, item_id, comentario, respuesta_a } = data
      if (!tipo || !item_id) return res.status(400).json({ error: "Faltan tipo o item_id" })
      if (!comentario || !comentario.trim()) return res.status(400).json({ error: "El comentario no puede estar vacío" })

      // Si es respuesta, confirma que el comentario padre pertenece al mismo item
      if (respuesta_a) {
        const padre = await sql`SELECT id FROM comentarios WHERE id = ${respuesta_a} AND tipo = ${tipo} AND item_id = ${item_id}`
        if (padre.length === 0) return res.status(400).json({ error: "El comentario al que respondes no existe" })
      }

      const nuevo = await sql`
        INSERT INTO comentarios (tipo, item_id, cliente_id, comentario, respuesta_a)
        VALUES (${tipo}, ${item_id}, ${cliente.id}, ${comentario.trim()}, ${respuesta_a || null})
        RETURNING id, comentario, creado_en, cliente_id, respuesta_a
      `
      return res.status(201).json({ comentario: { ...nuevo[0], cliente_nombre: cliente.nombre } })
    }

    // ---- DELETE: borrar mi propio comentario (borra también sus respuestas, por cascada) ----
    if (req.method === "POST" && accion === "comentario-borrar") {
      const cliente = await requireCliente(req, res)
      if (!cliente) return

      const raw = await leerBody(req)
      let data
      try { data = JSON.parse(raw) } catch { return res.status(400).json({ error: "JSON inválido" }) }
      const { id } = data
      if (!id) return res.status(400).json({ error: "Falta id" })

      const resultado = await sql`
        DELETE FROM comentarios WHERE id = ${id} AND cliente_id = ${cliente.id} RETURNING id
      `
      if (resultado.length === 0) return res.status(404).json({ error: "Comentario no encontrado o no te pertenece" })
      return res.status(200).json({ ok: true })
    }

    // ---- GET: contador + detalle de interacciones nuevas en el portafolio del barbero ----
    if (req.method === "GET" && accion === "mis-notificaciones") {
      const barbero = await requireBarbero(req, res)
      if (!barbero) return

      const fila = await sql`SELECT interacciones_vistas_en FROM barberos WHERE id = ${barbero.id}`
      const desde = fila[0]?.interacciones_vistas_en || new Date(0)

      const likes = await sql`
        SELECT COUNT(*) FROM reacciones r
        JOIN galeria_trabajos g ON g.id = r.item_id
        WHERE r.tipo = 'trabajo' AND g.barbero_id = ${barbero.id} AND r.creado_en > ${desde}
      `
      const comentarios = await sql`
        SELECT COUNT(*) FROM comentarios c
        JOIN galeria_trabajos g ON g.id = c.item_id
        WHERE c.tipo = 'trabajo' AND g.barbero_id = ${barbero.id} AND c.creado_en > ${desde}
      `

      const detalle = await sql`
        SELECT * FROM (
          SELECT 'like' AS tipo_evento, g.id AS trabajo_id, g.imagen_url, g.descripcion AS trabajo_descripcion,
                 cl.nombre AS cliente_nombre, NULL AS comentario, r.creado_en
          FROM reacciones r
          JOIN galeria_trabajos g ON g.id = r.item_id
          JOIN clientes cl ON cl.id = r.cliente_id
          WHERE r.tipo = 'trabajo' AND g.barbero_id = ${barbero.id} AND r.creado_en > ${desde}

          UNION ALL

          SELECT 'comentario' AS tipo_evento, g.id, g.imagen_url, g.descripcion,
                 cl.nombre, c.comentario, c.creado_en
          FROM comentarios c
          JOIN galeria_trabajos g ON g.id = c.item_id
          JOIN clientes cl ON cl.id = c.cliente_id
          WHERE c.tipo = 'trabajo' AND g.barbero_id = ${barbero.id} AND c.creado_en > ${desde}
        ) eventos
        ORDER BY creado_en DESC
        LIMIT 30
      `

      return res.status(200).json({
        total: Number(likes[0].count) + Number(comentarios[0].count),
        detalle,
      })
    }

    // ---- POST: marcar como vistas las interacciones (reinicia el contador) ----
    if (req.method === "POST" && accion === "marcar-vistas") {
      const barbero = await requireBarbero(req, res)
      if (!barbero) return

      await sql`UPDATE barberos SET interacciones_vistas_en = NOW() WHERE id = ${barbero.id}`
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: "Acción no reconocida" })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}
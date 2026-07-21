import { getDb, leerBody, parseJSON, responseError, responseSuccess } from './_db.js'
import { requireCliente } from './_middleware.js'

export default async function handler(req, res) {
  const sql = getDb()

  // ---- GET: reseñas + promedio de un barbero (público, sin auth) ----
  if (req.method === 'GET') {
    const barbero_id = req.query.barbero_id
    if (!barbero_id) return responseError(res, 'Falta barbero_id')

    const resenas = await sql`
      SELECT r.id, r.calificacion, r.comentario, r.creado_en, c.nombre AS cliente_nombre
      FROM resenas r
      JOIN clientes c ON c.id = r.cliente_id
      WHERE r.barbero_id = ${barbero_id}
      ORDER BY r.creado_en DESC
    `
    const promedio = await sql`
      SELECT ROUND(AVG(calificacion)::numeric, 1) AS promedio, COUNT(*) AS total
      FROM resenas
      WHERE barbero_id = ${barbero_id}
    `
    return responseSuccess(res, {
      resenas,
      promedio: promedio[0].promedio ? Number(promedio[0].promedio) : null,
      total: Number(promedio[0].total),
    })
  }

  // ---- POST: crear o actualizar la reseña del cliente logueado ----
  if (req.method === 'POST') {
    const cliente = await requireCliente(req, res)
    if (!cliente) return

    const body = await leerBody(req)
    const data = parseJSON(body)
    if (!data) return responseError(res, 'JSON inválido')

    const { barbero_id, calificacion, comentario } = data
    if (!barbero_id || !calificacion) {
      return responseError(res, 'Faltan barbero_id o calificación')
    }
    if (calificacion < 1 || calificacion > 5) {
      return responseError(res, 'La calificación debe ser entre 1 y 5')
    }

    const resena = await sql`
      INSERT INTO resenas (barbero_id, cliente_id, calificacion, comentario)
      VALUES (${barbero_id}, ${cliente.id}, ${calificacion}, ${comentario || null})
      ON CONFLICT (barbero_id, cliente_id)
      DO UPDATE SET calificacion = ${calificacion}, comentario = ${comentario || null}, creado_en = NOW()
      RETURNING id, calificacion, comentario, creado_en
    `
    return responseSuccess(res, { resena: resena[0] }, 201)
  }

  return responseError(res, 'Método no permitido', 405)
}
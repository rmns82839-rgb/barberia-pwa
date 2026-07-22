import { getDb, leerBody, parseJSON, responseError, responseSuccess } from './_db.js'
import { requireBarbero } from './_middleware.js'

export default async function handler(req, res) {
  const sql = getDb()

  // ---- GET: fotos de un barbero (público, sin auth) ----
  if (req.method === 'GET') {
    const barbero_id = req.query.barbero_id
    if (!barbero_id) return responseError(res, 'Falta barbero_id')

    const fotos = await sql`
      SELECT id, imagen_url, descripcion, creado_en
      FROM galeria_trabajos
      WHERE barbero_id = ${barbero_id}
      ORDER BY creado_en DESC
    `
    return responseSuccess(res, { fotos })
  }

  // ---- POST: agregar foto al portafolio (solo el barbero dueño de la sesión) ----
  if (req.method === 'POST') {
    const barbero = await requireBarbero(req, res)
    if (!barbero) return

    const body = await leerBody(req)
    const data = parseJSON(body)
    if (!data) return responseError(res, 'JSON inválido')

    const { imagen_url, descripcion } = data
    if (!imagen_url) return responseError(res, 'Falta imagen_url')

    const foto = await sql`
      INSERT INTO galeria_trabajos (barbero_id, imagen_url, descripcion)
      VALUES (${barbero.id}, ${imagen_url}, ${descripcion || null})
      RETURNING id, imagen_url, descripcion, creado_en
    `
    return responseSuccess(res, { foto: foto[0] }, 201)
  }

  // ---- PUT: actualizar datos de PERFIL del barbero (accion=perfil) ----
  if (req.method === 'PUT' && req.query.accion === 'perfil') {
    const barbero = await requireBarbero(req, res)
    if (!barbero) return

    const body = await leerBody(req)
    const data = parseJSON(body)
    if (!data) return responseError(res, 'JSON inválido')

    const { imagen_url, nombre, alias, especialidad } = data

    if (imagen_url) {
      await sql`UPDATE barberos SET foto = ${imagen_url} WHERE id = ${barbero.id}`
    }
    if (nombre !== undefined || alias !== undefined || especialidad !== undefined) {
      const actual = await sql`SELECT nombre, alias, especialidad FROM barberos WHERE id = ${barbero.id}`
      const base = actual[0]
      await sql`
        UPDATE barberos
        SET nombre = ${nombre !== undefined ? nombre : base.nombre},
            alias = ${alias !== undefined ? (alias || null) : base.alias},
            especialidad = ${especialidad !== undefined ? (especialidad || null) : base.especialidad}
        WHERE id = ${barbero.id}
      `
    }

    const actualizado = await sql`
      SELECT nombre, alias, especialidad, foto FROM barberos WHERE id = ${barbero.id}
    `
    return responseSuccess(res, { ok: true, perfil: actualizado[0] })
  }

  // ---- DELETE: borrar foto del portafolio (solo si es del barbero dueño de la sesión) ----
  if (req.method === 'DELETE') {
    const barbero = await requireBarbero(req, res)
    if (!barbero) return

    const body = await leerBody(req)
    const data = parseJSON(body)
    if (!data) return responseError(res, 'JSON inválido')

    const { id } = data
    if (!id) return responseError(res, 'Falta id')

    const result = await sql`
      DELETE FROM galeria_trabajos
      WHERE id = ${id} AND barbero_id = ${barbero.id}
      RETURNING id
    `
    if (result.length === 0) return responseError(res, 'Foto no encontrada o no te pertenece', 404)
    return responseSuccess(res, { ok: true })
  }

  return responseError(res, 'Método no permitido', 405)
}
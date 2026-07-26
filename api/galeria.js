import { getDb, leerBody, parseJSON, responseError, responseSuccess, borrarBlob } from './_db.js'
import { requireBarbero } from './_middleware.js'

export default async function handler(req, res) {
  const sql = getDb()

  // =========================================
  // ESTILOS DE CORTE (solo el barbero dueño, con recurso=estilo)
  // =========================================
  if (req.query.recurso === 'estilo') {
    if (req.method === 'GET') {
      const barbero = await requireBarbero(req, res)
      if (!barbero) return

      const estilos = await sql`
        SELECT id, nombre, descripcion, portada_url, creado_en
        FROM estilos_corte
        WHERE creado_por_barbero_id = ${barbero.id}
        ORDER BY creado_en DESC
      `
      return responseSuccess(res, { estilos })
    }

    if (req.method === 'POST') {
      const barbero = await requireBarbero(req, res)
      if (!barbero) return

      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { nombre, descripcion, portada_url } = data
      if (!nombre || !nombre.trim()) return responseError(res, 'Falta el nombre del estilo')

      const nuevo = await sql`
        INSERT INTO estilos_corte (nombre, descripcion, portada_url, creado_por_barbero_id)
        VALUES (${nombre.trim()}, ${descripcion || null}, ${portada_url || null}, ${barbero.id})
        RETURNING id, nombre, descripcion, portada_url, creado_en
      `
      await sql`
        INSERT INTO estilo_barberos (estilo_id, barbero_id) VALUES (${nuevo[0].id}, ${barbero.id})
      `
      return responseSuccess(res, { estilo: nuevo[0] }, 201)
    }

    if (req.method === 'PUT') {
      const barbero = await requireBarbero(req, res)
      if (!barbero) return

      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { id, nombre, descripcion, portada_url } = data
      if (!id) return responseError(res, 'Falta id')

      const actual = await sql`SELECT portada_url FROM estilos_corte WHERE id = ${id} AND creado_por_barbero_id = ${barbero.id}`
      if (actual.length === 0) return responseError(res, 'Estilo no encontrado o no te pertenece', 404)
      const portadaAnterior = actual[0].portada_url

      const editado = await sql`
        UPDATE estilos_corte
        SET nombre = ${nombre?.trim() || nombre},
            descripcion = ${descripcion !== undefined ? (descripcion || null) : null},
            portada_url = ${portada_url !== undefined ? (portada_url || null) : portadaAnterior}
        WHERE id = ${id} AND creado_por_barbero_id = ${barbero.id}
        RETURNING id, nombre, descripcion, portada_url
      `
      if (portadaAnterior && portada_url !== undefined && portadaAnterior !== portada_url) {
        await borrarBlob(portadaAnterior)
      }
      return responseSuccess(res, { estilo: editado[0] })
    }

    if (req.method === 'DELETE') {
      const barbero = await requireBarbero(req, res)
      if (!barbero) return

      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { id } = data
      if (!id) return responseError(res, 'Falta id')

      const imagenesExtra = await sql`SELECT imagen_url FROM estilo_imagenes WHERE estilo_id = ${id}`
      const estilo = await sql`
        DELETE FROM estilos_corte
        WHERE id = ${id} AND creado_por_barbero_id = ${barbero.id}
        RETURNING id, portada_url
      `
      if (estilo.length === 0) return responseError(res, 'Estilo no encontrado o no te pertenece', 404)

      if (estilo[0].portada_url) await borrarBlob(estilo[0].portada_url)
      for (const img of imagenesExtra) {
        await borrarBlob(img.imagen_url)
      }
      return responseSuccess(res, { ok: true })
    }

    return responseError(res, 'Método no permitido', 405)
  }

  // =========================================
  // FOTOS ADICIONALES DE UN ESTILO (hasta 5, con recurso=estilo-imagen)
  // =========================================
  if (req.query.recurso === 'estilo-imagen') {
    const barbero = await requireBarbero(req, res)
    if (!barbero) return

    if (req.method === 'POST') {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { estilo_id, imagen_url } = data
      if (!estilo_id || !imagen_url) return responseError(res, 'Faltan estilo_id o imagen_url')

      const dueño = await sql`SELECT id FROM estilos_corte WHERE id = ${estilo_id} AND creado_por_barbero_id = ${barbero.id}`
      if (dueño.length === 0) return responseError(res, 'Estilo no encontrado o no te pertenece', 404)

      const existentes = await sql`SELECT COUNT(*) FROM estilo_imagenes WHERE estilo_id = ${estilo_id}`
      if (Number(existentes[0].count) >= 5) return responseError(res, 'Ya tiene el máximo de 5 fotos')

      const nueva = await sql`
        INSERT INTO estilo_imagenes (estilo_id, imagen_url, orden)
        VALUES (${estilo_id}, ${imagen_url}, ${Number(existentes[0].count)})
        RETURNING id, imagen_url, orden
      `
      return responseSuccess(res, { imagen: nueva[0] }, 201)
    }

    if (req.method === 'GET') {
      const estilo_id = req.query.estilo_id
      if (!estilo_id) return responseError(res, 'Falta estilo_id')
      const imagenes = await sql`
        SELECT id, imagen_url, orden FROM estilo_imagenes WHERE estilo_id = ${estilo_id} ORDER BY orden, id
      `
      return responseSuccess(res, { imagenes })
    }

    if (req.method === 'DELETE') {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { id } = data
      if (!id) return responseError(res, 'Falta id')

      const resultado = await sql`
        DELETE FROM estilo_imagenes ei
        USING estilos_corte e
        WHERE ei.id = ${id} AND ei.estilo_id = e.id AND e.creado_por_barbero_id = ${barbero.id}
        RETURNING ei.id, ei.imagen_url
      `
      if (resultado.length === 0) return responseError(res, 'No encontrada o no te pertenece', 404)

      await borrarBlob(resultado[0].imagen_url)
      return responseSuccess(res, { ok: true })
    }

    return responseError(res, 'Método no permitido', 405)
  }

  // =========================================
  // GALERÍA DE TRABAJOS (comportamiento original, sin recurso=)
  // =========================================

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

    const { imagen_url, nombre, alias, especialidad, whatsapp } = data

    if (imagen_url) {
      const actualFoto = await sql`SELECT foto FROM barberos WHERE id = ${barbero.id}`
      const fotoAnterior = actualFoto[0]?.foto

      await sql`UPDATE barberos SET foto = ${imagen_url} WHERE id = ${barbero.id}`

      if (fotoAnterior && fotoAnterior !== imagen_url) {
        await borrarBlob(fotoAnterior)
      }
    }
    if (nombre !== undefined || alias !== undefined || especialidad !== undefined || whatsapp !== undefined) {
      const actual = await sql`SELECT nombre, alias, especialidad, whatsapp FROM barberos WHERE id = ${barbero.id}`
      const base = actual[0]
      await sql`
        UPDATE barberos
        SET nombre = ${nombre !== undefined ? nombre : base.nombre},
            alias = ${alias !== undefined ? (alias || null) : base.alias},
            especialidad = ${especialidad !== undefined ? (especialidad || null) : base.especialidad},
            whatsapp = ${whatsapp !== undefined ? (whatsapp || null) : base.whatsapp}
        WHERE id = ${barbero.id}
      `
    }

    const actualizado = await sql`
      SELECT nombre, alias, especialidad, foto, whatsapp FROM barberos WHERE id = ${barbero.id}
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
      RETURNING id, imagen_url
    `
    if (result.length === 0) return responseError(res, 'Foto no encontrada o no te pertenece', 404)

    await borrarBlob(result[0].imagen_url)

    return responseSuccess(res, { ok: true })
  }

  return responseError(res, 'Método no permitido', 405)
}
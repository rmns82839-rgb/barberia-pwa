import { getDb, leerBody, parseJSON, responseError, responseSuccess } from './_db.js'
import { requireAdmin } from './_middleware.js'
import { scryptSync, randomBytes } from 'crypto'

function generarHash(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const sql = getDb()
  const { action } = req.query

  try {
    // =========================================
    // 1. CLIENTES
    // =========================================
    if (action === 'clientes' && req.method === 'GET') {
      const clientes = await sql`
        SELECT id, nombre, telefono, creado_en
        FROM clientes
        WHERE telefono NOT LIKE 'walkin-%'
        ORDER BY creado_en DESC
      `
      return responseSuccess(res, { clientes })
    }

    // =========================================
    // 2. PRODUCTOS
    // =========================================
    if (action === 'productos' && req.method === 'GET') {
      const productos = await sql`
        SELECT id, nombre, descripcion, precio, imagen_url
        FROM productos
        ORDER BY id
      `
      return responseSuccess(res, { productos })
    }

    // =========================================
    // 3. CREAR PRODUCTO
    // =========================================
    if (action === 'productos' && req.method === 'POST') {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { nombre, descripcion, precio, imagen_url } = data
      if (!nombre || precio == null) {
        return responseError(res, 'Faltan nombre o precio')
      }

      const nuevo = await sql`
        INSERT INTO productos (nombre, descripcion, precio, imagen_url)
        VALUES (${nombre}, ${descripcion || null}, ${precio}, ${imagen_url || null})
        RETURNING id, nombre, descripcion, precio, imagen_url
      `
      return responseSuccess(res, { producto: nuevo[0] }, 201)
    }

    // =========================================
    // 4. EDITAR PRODUCTO
    // =========================================
    if (action === 'productos' && req.method === 'PUT') {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { id, nombre, descripcion, precio, imagen_url } = data
      if (!id) return responseError(res, 'Falta id')

      const editado = await sql`
        UPDATE productos
        SET nombre = ${nombre},
            descripcion = ${descripcion || null},
            precio = ${precio},
            imagen_url = ${imagen_url || null}
        WHERE id = ${id}
        RETURNING id, nombre, descripcion, precio, imagen_url
      `
      if (editado.length === 0) {
        return responseError(res, 'Producto no encontrado', 404)
      }
      return responseSuccess(res, { producto: editado[0] })
    }

    // =========================================
    // 5. ELIMINAR PRODUCTO
    // =========================================
    if (action === 'productos' && req.method === 'DELETE') {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { id } = data
      if (!id) return responseError(res, 'Falta id')

      const result = await sql`DELETE FROM productos WHERE id = ${id} RETURNING id`
      if (result.length === 0) {
        return responseError(res, 'Producto no encontrado', 404)
      }
      return responseSuccess(res, { ok: true })
    }

    // =========================================
    // 6. ESTADÍSTICAS (Dashboard)
    // =========================================
    if (action === 'stats' && req.method === 'GET') {
      const [totalClientes, totalCitasHoy, totalProductos, totalCitas] = await Promise.all([
        sql`SELECT COUNT(*) FROM clientes`,
        sql`SELECT COUNT(*) FROM citas WHERE fecha = CURRENT_DATE`,
        sql`SELECT COUNT(*) FROM productos`,
        sql`SELECT COUNT(*) FROM citas`
      ])

      return responseSuccess(res, {
        clientes: Number(totalClientes[0].count),
        citasHoy: Number(totalCitasHoy[0].count),
        productos: Number(totalProductos[0].count),
        totalCitas: Number(totalCitas[0].count)
      })
    }

    // =========================================
    // 7. HORARIO SEMANAL
    // =========================================
    if (action === 'horario-semanal' && req.method === 'GET') {
      const horario = await sql`
        SELECT id, dia_semana, abre, cierra, activo
        FROM horario_semanal
        ORDER BY dia_semana
      `
      return responseSuccess(res, { horario })
    }

    if (action === 'horario-semanal' && req.method === 'PUT') {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { dia_semana, abre, cierra, activo } = data
      if (dia_semana == null) return responseError(res, 'Falta dia_semana')

      const actualizado = await sql`
        UPDATE horario_semanal
        SET abre = ${activo ? abre : null},
            cierra = ${activo ? cierra : null},
            activo = ${!!activo}
        WHERE dia_semana = ${dia_semana}
        RETURNING id, dia_semana, abre, cierra, activo
      `
      if (actualizado.length > 0) {
        return responseSuccess(res, { dia: actualizado[0] })
      }
      const creado = await sql`
        INSERT INTO horario_semanal (dia_semana, abre, cierra, activo)
        VALUES (${dia_semana}, ${activo ? abre : null}, ${activo ? cierra : null}, ${!!activo})
        RETURNING id, dia_semana, abre, cierra, activo
      `
      return responseSuccess(res, { dia: creado[0] }, 201)
    }

    // =========================================
    // 8. EXCEPCIONES DE HORARIO (cierres/aperturas especiales)
    // =========================================
    if (action === 'horario-excepciones' && req.method === 'GET') {
      const excepciones = await sql`
        SELECT id, fecha, cerrado, abre, cierra
        FROM horario_excepciones
        WHERE fecha >= CURRENT_DATE
        ORDER BY fecha
      `
      return responseSuccess(res, { excepciones })
    }

    if (action === 'horario-excepciones' && req.method === 'POST') {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { fecha, cerrado, abre, cierra } = data
      if (!fecha) return responseError(res, 'Falta fecha')

      const nueva = await sql`
        INSERT INTO horario_excepciones (fecha, cerrado, abre, cierra)
        VALUES (${fecha}, ${!!cerrado}, ${cerrado ? null : abre || null}, ${cerrado ? null : cierra || null})
        ON CONFLICT (fecha)
        DO UPDATE SET cerrado = ${!!cerrado}, abre = ${cerrado ? null : abre || null}, cierra = ${cerrado ? null : cierra || null}
        RETURNING id, fecha, cerrado, abre, cierra
      `
      return responseSuccess(res, { excepcion: nueva[0] }, 201)
    }

    if (action === 'horario-excepciones' && req.method === 'DELETE') {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { id } = data
      if (!id) return responseError(res, 'Falta id')

      const result = await sql`DELETE FROM horario_excepciones WHERE id = ${id} RETURNING id`
      if (result.length === 0) return responseError(res, 'No encontrada', 404)
      return responseSuccess(res, { ok: true })
    }

    // =========================================
    // 9. ESTADÍSTICAS POR BARBERO (reseñas + desempeño)
    // =========================================
    if (action === 'barberos-stats' && req.method === 'GET') {
      const barberos = await sql`
        SELECT
          b.id, b.nombre, b.alias, b.estado, b.usuario,
          COALESCE(r.promedio, 0) AS promedio,
          COALESCE(r.total, 0) AS total_resenas,
          COALESCE(c.atendidas, 0) AS atendidas
        FROM barberos b
        LEFT JOIN (
          SELECT barbero_id, ROUND(AVG(calificacion)::numeric, 1) AS promedio, COUNT(*) AS total
          FROM resenas GROUP BY barbero_id
        ) r ON r.barbero_id = b.id
        LEFT JOIN (
          SELECT barbero_id, COUNT(*) AS atendidas
          FROM citas WHERE estado = 'atendida' GROUP BY barbero_id
        ) c ON c.barbero_id = b.id
        WHERE b.activo = true
        ORDER BY b.id
      `
      return responseSuccess(res, {
        barberos: barberos.map((b) => ({
          ...b,
          promedio: Number(b.promedio),
          total_resenas: Number(b.total_resenas),
          atendidas: Number(b.atendidas),
        })),
      })
    }

    // =========================================
    // 10. CREAR NUEVO BARBERO
    // =========================================
    if (action === 'crear-barbero' && req.method === 'POST') {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { nombre, usuario, password, especialidad } = data
      if (!nombre || !usuario || !password) {
        return responseError(res, 'Faltan nombre, usuario o contraseña')
      }
      if (password.length < 6) {
        return responseError(res, 'La contraseña debe tener al menos 6 caracteres')
      }

      const existente = await sql`SELECT id FROM barberos WHERE usuario = ${usuario}`
      if (existente.length > 0) {
        return responseError(res, 'Ese usuario ya está en uso')
      }

      const hash = generarHash(password)
      const nuevo = await sql`
        INSERT INTO barberos (nombre, usuario, password_hash, especialidad, estado, activo)
        VALUES (${nombre}, ${usuario}, ${hash}, ${especialidad || null}, 'disponible', true)
        RETURNING id, nombre, usuario, especialidad, estado
      `
      return responseSuccess(res, { barbero: nuevo[0] }, 201)
    }

    // =========================================
    // 11. RESETEAR CONTRASEÑA DE UN BARBERO (sin pedir la actual)
    // =========================================
    if (action === 'resetear-password-barbero' && req.method === 'POST') {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')

      const { barbero_id, passwordNueva } = data
      if (!barbero_id || !passwordNueva) {
        return responseError(res, 'Faltan barbero_id o passwordNueva')
      }
      if (passwordNueva.length < 6) {
        return responseError(res, 'La contraseña debe tener al menos 6 caracteres')
      }

      const hash = generarHash(passwordNueva)
      const result = await sql`
        UPDATE barberos SET password_hash = ${hash} WHERE id = ${barbero_id} RETURNING id
      `
      if (result.length === 0) return responseError(res, 'Barbero no encontrado', 404)
      return responseSuccess(res, { ok: true })
    }

    return responseError(res, 'Acción no reconocida', 400)
  } catch (error) {
    console.error('ERROR REAL:', error.message)
    return responseError(res, error.message, 500)
  }
}
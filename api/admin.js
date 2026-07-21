import { getDb, leerBody, parseJSON, responseError, responseSuccess } from './_db.js'
import { requireAdmin } from './_middleware.js'

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
    // 7. AVISAR SIGUIENTE CLIENTE
    // =========================================
    if (action === 'avisos' && req.method === 'POST') {
      const body = await leerBody(req)
      const data = parseJSON(body)
      if (!data) return responseError(res, 'JSON inválido')
      
      const { barbero_id, fecha } = data
      if (!barbero_id || !fecha) {
        return responseError(res, 'Faltan barbero_id o fecha')
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
        return responseSuccess(res, { mensaje: 'No hay próximas citas por avisar' })
      }

      const cita = proxima[0]
      const notif = await sql`
        INSERT INTO notificaciones (cita_id, tipo)
        VALUES (${cita.id}, 'aviso_proximidad')
        RETURNING id
      `

      return responseSuccess(res, {
        cita: {
          id: cita.id,
          hora: cita.hora,
          cliente_nombre: cita.cliente_nombre,
          cliente_telefono: cita.cliente_telefono,
        },
        notificacion_id: notif[0].id,
      })
    }

    
    // =========================================
    // 8. CONSULTAR ESTADO DE AVISO
    // =========================================
    if (action === 'estado-aviso' && req.method === 'GET') {
      const notificacion_id = req.query.notificacion_id
      if (!notificacion_id) {
        return responseError(res, 'Falta notificacion_id')
      }
      
      const filas = await sql`
        SELECT respuesta FROM notificaciones WHERE id = ${notificacion_id}
      `
      if (filas.length === 0) {
        return responseError(res, 'No encontrado', 404)
      }
      return responseSuccess(res, { respuesta: filas[0].respuesta })
    }

    return responseError(res, 'Acción no reconocida', 400)
  } catch (error) {
    console.error('ERROR REAL:', error.message)
    return responseError(res, error.message, 500)
  }
}
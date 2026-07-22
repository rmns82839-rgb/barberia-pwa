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

    return responseError(res, 'Acción no reconocida', 400)
  } catch (error) {
    console.error('ERROR REAL:', error.message)
    return responseError(res, error.message, 500)
  }
}
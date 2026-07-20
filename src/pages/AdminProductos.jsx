import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function AdminProductos() {
  const [admin, setAdmin] = useState(null)
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Formulario (sirve para crear o editar)
  const [editandoId, setEditandoId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const guardado = localStorage.getItem('admin')
    if (!guardado) {
      navigate('/admin-login')
      return
    }
    setAdmin(JSON.parse(guardado))
  }, [navigate])

  const cargarProductos = () => {
    fetch('/api/productos')
      .then((res) => res.json())
      .then((data) => {
        setProductos(data.productos || [])
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }

  useEffect(() => {
    if (admin) cargarProductos()
  }, [admin])

  const limpiarFormulario = () => {
    setEditandoId(null)
    setNombre('')
    setDescripcion('')
    setPrecio('')
    setImagenUrl('')
  }

  const empezarEdicion = (p) => {
    setEditandoId(p.id)
    setNombre(p.nombre)
    setDescripcion(p.descripcion || '')
    setPrecio(String(p.precio).replace('.00', ''))
    setImagenUrl(p.imagen_url || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const subirFoto = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setSubiendoFoto(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/subir-imagen?filename=${encodeURIComponent(archivo.name)}`,
        {
          method: 'POST',
          body: archivo,
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImagenUrl(data.url)
    } catch (err) {
      setError('Error al subir la foto: ' + err.message)
    } finally {
      setSubiendoFoto(false)
    }
  }

  const guardarProducto = async () => {
    if (!nombre.trim() || !precio) {
      setError('Nombre y precio son obligatorios')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const esEdicion = editandoId != null
      const res = await fetch('/api/gestionar-producto', {
        method: esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editandoId,
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          precio: Number(precio),
          imagen_url: imagenUrl || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      limpiarFormulario()
      cargarProductos()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminarProducto = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      const res = await fetch('/api/gestionar-producto', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      cargarProductos()
    } catch (err) {
      setError(err.message)
    }
  }

  const formatoPrecio = (valor) => {
    if (valor == null) return ''
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Gestionar productos</h1>
        <button
          onClick={() => navigate('/admin')}
          className="text-sm text-gray-500 underline"
        >
          Volver al panel
        </button>
      </div>

      {/* Formulario crear/editar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-sm font-medium mb-3">
          {editandoId ? 'Editar producto' : 'Nuevo producto'}
        </h2>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Precio (ej: 25000)"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />

          {/* Subir foto */}
          <div className="border rounded p-3">
            <label className="block text-xs text-gray-500 mb-2">Foto del producto</label>
            {imagenUrl && (
              <img
                src={imagenUrl}
                alt="Vista previa"
                className="w-24 h-24 object-cover rounded mb-2"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={subirFoto}
              disabled={subiendoFoto}
              className="text-xs w-full"
            />
            {subiendoFoto && (
              <p className="text-xs text-gray-500 mt-1">Subiendo foto...</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={guardarProducto}
              disabled={guardando || subiendoFoto}
              className="bg-gray-900 text-white rounded px-3 py-2 text-sm disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar producto'}
            </button>
            {editandoId && (
              <button
                onClick={limpiarFormulario}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      {cargando && <p className="text-gray-500 text-sm">Cargando...</p>}

      <div className="space-y-3">
        {productos.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-lg shadow p-3 flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xl overflow-hidden">
                {p.imagen_url ? (
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  '🧴'
                )}
              </div>
              <div>
                <div className="font-medium text-sm">{p.nombre}</div>
                {p.descripcion && (
                  <div className="text-xs text-gray-400">{p.descripcion}</div>
                )}
                <div className="text-xs text-gray-500">{formatoPrecio(p.precio)}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => empezarEdicion(p)}
                className="text-xs bg-gray-200 rounded px-3 py-1"
              >
                Editar
              </button>
              <button
                onClick={() => eliminarProducto(p.id)}
                className="text-xs bg-red-100 text-red-700 rounded px-3 py-1"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminProductos
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil, Trash2, ImagePlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'

function AdminProductos() {
  const { admin } = useAuth()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  const [editandoId, setEditandoId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [aBorrar, setABorrar] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login')
      return
    }
  }, [admin, navigate])

  const cargarProductos = () => {
    fetch('/api/admin?action=productos')
      .then((res) => res.json())
      .then((data) => {
        setProductos(data.productos || [])
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
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
      toast.success('Foto subida')
    } catch (err) {
      toast.error('Error al subir la foto: ' + err.message)
    } finally {
      setSubiendoFoto(false)
    }
  }

  const guardarProducto = async () => {
    if (!nombre.trim() || !precio) {
      toast.error('Nombre y precio son obligatorios')
      return
    }
    setGuardando(true)
    try {
      const esEdicion = editandoId != null
      const res = await fetch('/api/admin?action=productos', {
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
      toast.success(esEdicion ? 'Producto actualizado' : 'Producto agregado')
      limpiarFormulario()
      cargarProductos()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminarProducto = async () => {
    if (!aBorrar) return
    try {
      const res = await fetch('/api/admin?action=productos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: aBorrar.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Producto eliminado')
      setABorrar(null)
      cargarProductos()
    } catch (err) {
      toast.error(err.message)
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
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Gestionar productos</h1>
        <button
          onClick={() => navigate('/admin')}
          className="text-sm text-gray-500 dark:text-gray-400 underline"
        >
          Volver al panel
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <h2 className="text-sm font-medium mb-3">
          {editandoId ? 'Editar producto' : 'Nuevo producto'}
        </h2>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <input
            type="text"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <input
            type="number"
            placeholder="Precio (ej: 25000)"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />

          <div className="border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg p-3">
            <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <ImagePlus size={14} /> Foto del producto
            </label>
            {imagenUrl && (
              <img
                src={imagenUrl}
                alt="Vista previa"
                className="w-24 h-24 object-cover rounded-lg mb-2"
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
              <div className="mt-1">
                <CargandoTijera texto="Subiendo foto..." size={12} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={guardarProducto}
              disabled={guardando || subiendoFoto}
              className="flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {guardando ? (
                <CargandoTijera texto="Guardando..." size={14} className="text-white" />
              ) : editandoId ? (
                'Guardar cambios'
              ) : (
                'Agregar producto'
              )}
            </button>
            {editandoId && (
              <button
                onClick={limpiarFormulario}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition active:scale-95"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {cargando && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg skeleton-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded skeleton-shimmer" />
                <div className="h-3 w-20 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {productos.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl overflow-hidden shrink-0">
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
                  <div className="text-xs text-gray-400 dark:text-gray-500">{p.descripcion}</div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">{formatoPrecio(p.precio)}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => empezarEdicion(p)}
                aria-label="Editar"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition active:scale-95"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setABorrar(p)}
                aria-label="Eliminar"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 text-red-700 transition active:scale-95"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={aBorrar != null}
        onClose={() => setABorrar(null)}
        title="Eliminar producto"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ¿Seguro que quieres eliminar <strong>{aBorrar?.nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={eliminarProducto}
            className="bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95"
          >
            Sí, eliminar
          </button>
          <button
            onClick={() => setABorrar(null)}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminProductos
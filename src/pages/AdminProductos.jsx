import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil, Trash2, ImagePlus, Tag, X, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'

function AdminProductos() {
  const { admin } = useAuth()
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)

  const [editandoId, setEditandoId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [aBorrar, setABorrar] = useState(null)

  const [modalCategoria, setModalCategoria] = useState(false)
  const [categoriaEditandoId, setCategoriaEditandoId] = useState(null)
  const [catNombre, setCatNombre] = useState('')
  const [catDescripcion, setCatDescripcion] = useState('')
  const [catFotoUrl, setCatFotoUrl] = useState('')
  const [subiendoFotoCategoria, setSubiendoFotoCategoria] = useState(false)
  const [guardandoCategoria, setGuardandoCategoria] = useState(false)
  const [categoriaABorrar, setCategoriaABorrar] = useState(null)

  const [imagenesExtra, setImagenesExtra] = useState([])
  const [subiendoExtra, setSubiendoExtra] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login')
      return
    }
  }, [admin, navigate])

  const cargarCategorias = () => {
    fetch('/api/admin?action=categorias')
      .then((res) => res.json())
      .then((data) => setCategorias(data.categorias || []))
      .catch((err) => toast.error(err.message))
  }

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
    if (admin) {
      cargarCategorias()
      cargarProductos()
    }
  }, [admin])

  const abrirNuevaCategoria = () => {
    setCategoriaEditandoId(null)
    setCatNombre('')
    setCatDescripcion('')
    setCatFotoUrl('')
    setModalCategoria(true)
  }

  const abrirEditarCategoria = (cat) => {
    setCategoriaEditandoId(cat.id)
    setCatNombre(cat.nombre)
    setCatDescripcion(cat.descripcion || '')
    setCatFotoUrl(cat.foto_url || '')
    setModalCategoria(true)
  }

  const subirFotoCategoria = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setSubiendoFotoCategoria(true)
    try {
      const res = await fetch(
        `/api/subir-imagen?filename=${encodeURIComponent(archivo.name)}`,
        { method: 'POST', body: archivo }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCatFotoUrl(data.url)
      toast.success('Foto subida')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubiendoFotoCategoria(false)
    }
  }

  const guardarCategoria = async () => {
    if (!catNombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setGuardandoCategoria(true)
    try {
      const esEdicion = categoriaEditandoId != null
      const res = await fetch('/api/admin?action=categorias', {
        method: esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: categoriaEditandoId,
          nombre: catNombre.trim(),
          descripcion: catDescripcion.trim(),
          foto_url: catFotoUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(esEdicion ? 'Categoría actualizada' : 'Categoría creada')
      setModalCategoria(false)
      cargarCategorias()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardandoCategoria(false)
    }
  }

  const borrarCategoria = async () => {
    if (!categoriaABorrar) return
    try {
      const res = await fetch('/api/admin?action=categorias', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: categoriaABorrar.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Categoría eliminada')
      setCategoriaABorrar(null)
      cargarCategorias()
      cargarProductos()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const limpiarFormulario = () => {
    setEditandoId(null)
    setNombre('')
    setDescripcion('')
    setPrecio('')
    setImagenUrl('')
    setCategoriaId('')
    setImagenesExtra([])
  }

  const cargarImagenesExtra = (productoId) => {
    fetch(`/api/admin?action=producto-imagenes&producto_id=${productoId}`)
      .then((res) => res.json())
      .then((data) => setImagenesExtra(data.imagenes || []))
      .catch(() => {})
  }

  const empezarEdicion = (p) => {
    setEditandoId(p.id)
    setNombre(p.nombre)
    setDescripcion(p.descripcion || '')
    setPrecio(String(p.precio).replace('.00', ''))
    setImagenUrl(p.imagen_url || '')
    setCategoriaId(p.categoria_id || '')
    cargarImagenesExtra(p.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const subirFoto = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setSubiendoFoto(true)
    try {
      const res = await fetch(
        `/api/subir-imagen?filename=${encodeURIComponent(archivo.name)}`,
        { method: 'POST', body: archivo }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImagenUrl(data.url)
      toast.success('Foto principal subida')
    } catch (err) {
      toast.error('Error al subir la foto: ' + err.message)
    } finally {
      setSubiendoFoto(false)
    }
  }

  const subirFotoExtra = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo || !editandoId) return
    if (imagenesExtra.length >= 5) {
      toast.error('Ya tiene el máximo de 5 fotos')
      return
    }
    setSubiendoExtra(true)
    try {
      const resSubida = await fetch(
        `/api/subir-imagen?filename=${encodeURIComponent(archivo.name)}`,
        { method: 'POST', body: archivo }
      )
      const dataSubida = await resSubida.json()
      if (!resSubida.ok) throw new Error(dataSubida.error)

      const res = await fetch('/api/admin?action=producto-imagenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: editandoId, imagen_url: dataSubida.url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Foto agregada')
      cargarImagenesExtra(editandoId)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubiendoExtra(false)
      e.target.value = ''
    }
  }

  const borrarImagenExtra = async (id) => {
    try {
      const res = await fetch('/api/admin?action=producto-imagenes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImagenesExtra((prev) => prev.filter((img) => img.id !== id))
    } catch (err) {
      toast.error(err.message)
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
          categoria_id: categoriaId || null,
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

      {/* ---- Categorías ---- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-1">
            <Tag size={14} /> Categorías
          </h2>
          <button
            onClick={abrirNuevaCategoria}
            className="flex items-center gap-1 text-xs font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full px-3 py-1.5 transition active:scale-95"
          >
            <Plus size={13} /> Nueva
          </button>
        </div>

        {categorias.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">Aún no hay categorías.</p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => abrirEditarCategoria(cat)}
              className="relative bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex flex-col items-center text-center transition active:scale-95"
            >
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setCategoriaABorrar(cat)
                }}
                aria-label="Eliminar categoría"
                className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700"
              >
                <X size={11} />
              </span>
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex items-center justify-center mb-1">
                {cat.foto_url ? (
                  <img src={cat.foto_url} alt={cat.nombre} className="w-full h-full object-cover" />
                ) : (
                  <Tag size={16} className="text-gray-400" />
                )}
              </div>
              <span className="text-xs font-medium truncate w-full">{cat.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      <Modal
        open={modalCategoria}
        onClose={() => setModalCategoria(false)}
        title={categoriaEditandoId ? 'Editar categoría' : 'Nueva categoría'}
      >
        <div className="space-y-2">
          <input
            type="text"
            value={catNombre}
            onChange={(e) => setCatNombre(e.target.value)}
            placeholder="Nombre (ej: Gorras)"
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            value={catDescripcion}
            onChange={(e) => setCatDescripcion(e.target.value)}
            placeholder="Descripción breve (opcional)"
            rows={2}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none"
          />
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Foto (opcional)</label>
            {catFotoUrl && (
              <img src={catFotoUrl} alt="Vista previa" className="w-20 h-20 object-cover rounded-lg mb-2" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={subirFotoCategoria}
              disabled={subiendoFotoCategoria}
              className="text-xs w-full"
            />
            {subiendoFotoCategoria && (
              <div className="mt-1">
                <CargandoTijera texto="Subiendo..." size={12} />
              </div>
            )}
          </div>
          <button
            onClick={guardarCategoria}
            disabled={guardandoCategoria}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {guardandoCategoria ? (
              <CargandoTijera texto="Guardando..." size={14} className="text-white dark:text-gray-900" />
            ) : categoriaEditandoId ? (
              'Guardar cambios'
            ) : (
              'Crear categoría'
            )}
          </button>
        </div>
      </Modal>

      {/* ---- Formulario de producto ---- */}
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
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Sin categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className="border dark:border-gray-700 rounded-lg p-3">
            <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <ImagePlus size={14} /> Foto principal (portada)
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

          {editandoId && (
            <div className="border dark:border-gray-700 rounded-lg p-3">
              <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <ImagePlus size={14} /> Fotos adicionales (hasta 5, para el carrusel) — {imagenesExtra.length}/5
              </label>
              {imagenesExtra.length > 0 && (
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {imagenesExtra.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded overflow-hidden">
                      <img src={img.imagen_url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => borrarImagenExtra(img.id)}
                        aria-label="Eliminar"
                        className="absolute top-0.5 right-0.5 flex items-center justify-center w-4 h-4 rounded bg-black/60 text-white"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {imagenesExtra.length < 5 && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={subirFotoExtra}
                    disabled={subiendoExtra}
                    className="text-xs w-full"
                  />
                  {subiendoExtra && (
                    <div className="mt-1">
                      <CargandoTijera texto="Subiendo..." size={12} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={guardarProducto}
              disabled={guardando || subiendoFoto}
              className="flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
            >
              {guardando ? (
                <CargandoTijera texto="Guardando..." size={14} className="text-white dark:text-gray-900" />
              ) : editandoId ? (
                'Guardar cambios'
              ) : (
                'Agregar producto'
              )}
            </button>
            {editandoId && (
              <button
                onClick={limpiarFormulario}
                className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition active:scale-95"
              >
                Cancelar
              </button>
            )}
          </div>
          {!editandoId && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Guarda el producto primero; luego podrás agregarle hasta 5 fotos adicionales al editarlo.
            </p>
          )}
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
                  <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                ) : (
                  '🧴'
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-medium text-sm">{p.nombre}</div>
                  {p.categoria_nombre && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
                      {p.categoria_nombre}
                    </span>
                  )}
                </div>
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

      <Modal open={aBorrar != null} onClose={() => setABorrar(null)} title="Eliminar producto">
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
            className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </Modal>

      <Modal open={categoriaABorrar != null} onClose={() => setCategoriaABorrar(null)} title="Eliminar categoría">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ¿Eliminar <strong>{categoriaABorrar?.nombre}</strong>? Los productos que la tenían quedarán sin categoría (no se borran).
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={borrarCategoria}
            className="bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95"
          >
            Sí, eliminar
          </button>
          <button
            onClick={() => setCategoriaABorrar(null)}
            className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminProductos
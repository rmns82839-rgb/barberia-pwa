import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { SprayCan, ShoppingCart, Plus, Minus, Trash2, MessageCircle, ArrowLeft } from 'lucide-react'
import Modal from '../components/Modal.jsx'
import Carrusel from '../components/Carrusel.jsx'

const WHATSAPP_BARBERIA = '3054494534'
const CLAVE_CARRITO = 'carrito-barberia'

function cargarCarritoGuardado() {
  try {
    const raw = localStorage.getItem(CLAVE_CARRITO)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function CatalogoCategoria() {
  const { categoriaId } = useParams()
  const navigate = useNavigate()

  const [nombreCategoria, setNombreCategoria] = useState('')
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [carrito, setCarrito] = useState(cargarCarritoGuardado)
  const [modalCarrito, setModalCarrito] = useState(false)
  const [direccion, setDireccion] = useState('')

  const [productoAbierto, setProductoAbierto] = useState(null)
  const [imagenesProducto, setImagenesProducto] = useState([])

  useEffect(() => {
    setCargando(true)
    Promise.all([
      fetch(`/api/productos?categoria_id=${categoriaId}`).then((r) => r.json()),
      fetch('/api/productos?categorias=1').then((r) => r.json()),
    ])
      .then(([dataProductos, dataCategorias]) => {
        setProductos(dataProductos.productos || [])
        const cat = (dataCategorias.categorias || []).find((c) => String(c.id) === categoriaId)
        setNombreCategoria(cat?.nombre || 'Categoría')
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }, [categoriaId])

  useEffect(() => {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito))
  }, [carrito])

  const formatoPrecio = (valor) => {
    if (valor == null) return ''
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor)
  }

  const abrirProducto = (producto) => {
    setProductoAbierto(producto)
    setImagenesProducto(producto.imagen_url ? [{ imagen_url: producto.imagen_url }] : [])
    fetch(`/api/productos?imagenes=${producto.id}`)
      .then((res) => res.json())
      .then((data) => {
        const extra = data.imagenes || []
        if (extra.length > 0) setImagenesProducto(extra)
      })
      .catch(() => {})
  }

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.id === producto.id)
      if (existente) {
        return prev.map((i) => (i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i))
      }
      return [...prev, { id: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 }]
    })
    toast.success(`${producto.nombre} agregado al carrito`)
  }

  const cambiarCantidad = (id, delta) => {
    setCarrito((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    )
  }

  const quitarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((i) => i.id !== id))
  }

  const totalItems = carrito.reduce((acc, i) => acc + i.cantidad, 0)
  const totalPrecio = carrito.reduce((acc, i) => acc + i.cantidad * i.precio, 0)

  const pedirPorWhatsapp = () => {
    if (carrito.length === 0) {
      toast.error('Tu carrito está vacío')
      return
    }
    const lineas = carrito.map(
      (i) => `- ${i.cantidad}x ${i.nombre} - ${formatoPrecio(i.cantidad * i.precio)}`
    )
    let mensaje = `🛒 *Nuevo pedido*\n\n${lineas.join('\n')}\n\nTotal: ${formatoPrecio(totalPrecio)}`
    if (direccion.trim()) {
      mensaje += `\n\n📍 Entregar en: ${direccion.trim()}`
    }
    mensaje += '\n\n¿Confirmas disponibilidad y costo de envío?'
    const link = `https://wa.me/57${WHATSAPP_BARBERIA}?text=${encodeURIComponent(mensaje)}`
    window.open(link, '_blank')
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-24">
      <button
        onClick={() => navigate('/catalogo')}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3"
      >
        <ArrowLeft size={14} />
        Todas las categorías
      </button>
      <h1 className="text-xl font-bold mb-4">{nombreCategoria}</h1>

      {cargando && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col">
              <div className="w-full aspect-square rounded-lg skeleton-shimmer mb-3" />
              <div className="h-3 w-24 rounded skeleton-shimmer mb-2" />
              <div className="h-3 w-16 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      )}

      {!cargando && productos.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no hay productos en esta categoría.</p>
      )}

      {!cargando && productos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {productos.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col h-full"
            >
              <button onClick={() => abrirProducto(p)} className="text-left">
                <div className="w-full aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3 overflow-hidden">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <SprayCan size={32} className="text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1 truncate">{p.nombre}</h3>
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex-grow line-clamp-2">
                {p.descripcion || '\u00A0'}
              </p>
              <div className="font-bold text-gray-900 dark:text-gray-100 mb-2">{formatoPrecio(p.precio)}</div>
              <button
                onClick={() => agregarAlCarrito(p)}
                className="w-full flex items-center justify-center gap-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-xs font-medium transition active:scale-95 mt-auto"
              >
                <Plus size={14} />
                Agregar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón flotante del carrito */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={() => setModalCarrito(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-amber-500 text-white rounded-full pl-4 pr-5 py-3 shadow-lg active:scale-95 transition"
          >
            <ShoppingCart size={20} />
            <span className="font-semibold text-sm">{totalItems}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal de detalle de producto con carrusel */}
      <Modal open={productoAbierto != null} onClose={() => setProductoAbierto(null)} title={productoAbierto?.nombre || ''}>
        {productoAbierto && (
          <div>
            <Carrusel imagenes={imagenesProducto} alt={productoAbierto.nombre} />
            {productoAbierto.descripcion && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{productoAbierto.descripcion}</p>
            )}
            <div className="font-bold text-lg text-gray-900 dark:text-gray-100 mt-2 mb-3">
              {formatoPrecio(productoAbierto.precio)}
            </div>
            <button
              onClick={() => {
                agregarAlCarrito(productoAbierto)
                setProductoAbierto(null)
              }}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2.5 text-sm font-medium transition active:scale-95"
            >
              <Plus size={16} />
              Agregar al carrito
            </button>
          </div>
        )}
      </Modal>

      {/* Modal del carrito */}
      <Modal open={modalCarrito} onClose={() => setModalCarrito(false)} title="Tu carrito">
        {carrito.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Tu carrito está vacío.</p>
        ) : (
          <>
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 mb-4">
              {carrito.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatoPrecio(item.precio)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => cambiarCantidad(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 transition active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm">{item.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 transition active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => quitarDelCarrito(item.id)}
                      aria-label="Quitar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-100 text-red-700 transition active:scale-95 ml-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between font-bold text-sm mb-3 pt-3 border-t dark:border-gray-700">
              <span>Total</span>
              <span>{formatoPrecio(totalPrecio)}</span>
            </div>

            <input
              type="text"
              placeholder="Dirección de entrega (opcional, para domicilio)"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <button
              onClick={pedirPorWhatsapp}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-3 py-3 text-sm font-semibold transition active:scale-95"
            >
              <MessageCircle size={18} />
              Pedir por WhatsApp
            </button>
          </>
        )}
      </Modal>
    </div>
  )
}

export default CatalogoCategoria
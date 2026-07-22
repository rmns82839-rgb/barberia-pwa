import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { SprayCan } from 'lucide-react'

function Catalogo() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/productos')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setProductos(data.productos || [])
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }, [])

  const formatoPrecio = (valor) => {
    if (valor == null) return ''
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor)
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Catálogo de productos</h1>

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
        <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no hay productos disponibles.</p>
      )}

      {!cargando && productos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {productos.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col"
            >
              <div className="w-full aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                {p.imagen_url ? (
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <SprayCan size={32} className="text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <h3 className="font-semibold text-sm mb-1">{p.nombre}</h3>
              {p.descripcion && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex-grow">{p.descripcion}</p>
              )}
              <div className="font-bold text-gray-900 dark:text-gray-100">{formatoPrecio(p.precio)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Catalogo
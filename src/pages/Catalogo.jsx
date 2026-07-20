import { useState, useEffect } from 'react'

function Catalogo() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/productos')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setProductos(data.productos || [])
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
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
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Catálogo de productos</h1>

      {cargando && <p className="text-gray-500 text-sm">Cargando productos...</p>}
      {error && <p className="text-red-500 text-sm">Error: {error}</p>}

      {!cargando && productos.length === 0 && (
        <p className="text-gray-500 text-sm">Aún no hay productos disponibles.</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {productos.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-lg shadow p-4 flex flex-col"
          >
            <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-4xl mb-3">
              {p.imagen_url ? (
                <img
                  src={p.imagen_url}
                  alt={p.nombre}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                '🧴'
              )}
            </div>
            <h3 className="font-semibold text-sm mb-1">{p.nombre}</h3>
            {p.descripcion && (
              <p className="text-xs text-gray-500 mb-2 flex-grow">{p.descripcion}</p>
            )}
            <div className="font-bold text-gray-900">{formatoPrecio(p.precio)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Catalogo
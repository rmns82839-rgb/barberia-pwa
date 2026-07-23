import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { SprayCan, ChevronRight } from 'lucide-react'

function Catalogo() {
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/productos?categorias=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setCategorias(data.categorias || [])
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }, [])

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Catálogo de productos</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Elige una categoría para ver los productos.
      </p>

      {cargando && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      )}

      {!cargando && categorias.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Aún no hay categorías configuradas.
        </p>
      )}

      {!cargando && categorias.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/catalogo/${cat.id}`)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col items-center justify-center gap-2 transition active:scale-95 h-28"
            >
              <SprayCan size={28} className="text-amber-600" />
              <div className="flex items-center gap-1 font-semibold text-sm">
                {cat.nombre}
                <ChevronRight size={14} className="text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Catalogo
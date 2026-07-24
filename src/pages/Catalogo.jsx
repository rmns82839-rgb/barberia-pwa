import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { SprayCan, ChevronRight, MapPin } from 'lucide-react'
import { IconoWhatsApp, IconoInstagram, IconoFacebook, IconoTikTok, IconoYouTube } from '../components/IconosRedes.jsx'

function Catalogo() {
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [negocio, setNegocio] = useState(null)
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

  useEffect(() => {
    fetch('/api/negocio')
      .then((res) => res.json())
      .then((data) => setNegocio(data.negocio))
      .catch(() => {})
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
            <div key={i} className="h-32 rounded-xl skeleton-shimmer" />
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center justify-center gap-2 transition active:scale-95 h-32 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 overflow-hidden flex items-center justify-center">
                {cat.foto_url ? (
                  <img src={cat.foto_url} alt={cat.nombre} className="w-full h-full object-cover" />
                ) : (
                  <SprayCan size={22} className="text-amber-600" />
                )}
              </div>
              <div className="flex items-center gap-1 font-semibold text-sm">
                {cat.nombre}
                <ChevronRight size={14} className="text-gray-400" />
              </div>
              {cat.descripcion && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">{cat.descripcion}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {negocio && (negocio.direccion || negocio.instagram || negocio.facebook || negocio.tiktok || negocio.youtube || negocio.whatsapp || negocio.foto_ubicacion_url) && (
        <div className="mt-10 pt-6 border-t dark:border-gray-700 text-center">
          {negocio.foto_ubicacion_url && (
            <img
              src={negocio.foto_ubicacion_url}
              alt="Nuestra ubicación"
              className="w-full h-40 object-cover rounded-xl mb-4"
            />
          )}

          {negocio.direccion && (
            <p className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <MapPin size={14} />
              {negocio.direccion}
            </p>
          )}

          {negocio.mapa_url && (
            <a
              href={negocio.mapa_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium mb-4"
            >
              <MapPin size={14} />
              Cómo llegar
            </a>
          )}

          {negocio.whatsapp && (
            <a
              href={`https://wa.me/57${negocio.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mb-3 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-full"
            >
              <IconoWhatsApp size={14} />
              Escríbenos por WhatsApp
            </a>
          )}

          {(negocio.instagram || negocio.facebook || negocio.tiktok || negocio.youtube) && (
            <div className="flex items-center justify-center gap-2">
              {negocio.instagram && (
                <a
                  href={negocio.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white transition active:scale-95"
                >
                  <IconoInstagram size={18} />
                </a>
              )}
              {negocio.facebook && (
                <a
                  href={negocio.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white transition active:scale-95"
                >
                  <IconoFacebook size={18} />
                </a>
              )}
              {negocio.tiktok && (
                <a
                  href={negocio.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-900 dark:bg-gray-700 text-white transition active:scale-95"
                >
                  <IconoTikTok size={18} />
                </a>
              )}
              {negocio.youtube && (
                <a
                  href={negocio.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white transition active:scale-95"
                >
                  <IconoYouTube size={18} />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Catalogo
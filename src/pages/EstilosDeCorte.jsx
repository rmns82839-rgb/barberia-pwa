import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Scissors, Calendar } from 'lucide-react'
import Modal from '../components/Modal.jsx'
import Carrusel from '../components/Carrusel.jsx'
import LikesComentarios from '../components/LikesComentarios.jsx'

function EstilosDeCorte() {
  const navigate = useNavigate()
  const [estilos, setEstilos] = useState([])
  const [cargando, setCargando] = useState(true)

  const [estiloAbierto, setEstiloAbierto] = useState(null)
  const [imagenesEstilo, setImagenesEstilo] = useState([])

  useEffect(() => {
    fetch('/api/productos?estilos=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setEstilos(data.estilos || [])
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }, [])

  const abrirEstilo = (estilo) => {
    setEstiloAbierto(estilo)
    setImagenesEstilo(estilo.portada_url ? [{ imagen_url: estilo.portada_url }] : [])
    fetch(`/api/productos?estilo_imagenes=${estilo.id}`)
      .then((res) => res.json())
      .then((data) => {
        const extra = data.imagenes || []
        if (extra.length > 0) setImagenesEstilo(extra)
      })
      .catch(() => {})
  }

  const agendarConBarbero = (barberoId) => {
    setEstiloAbierto(null)
    navigate(`/citas?barbero=${barberoId}`)
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Estilos de corte</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Inspírate y agenda directo con el barbero que hace ese estilo.
      </p>

      {cargando && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square rounded-xl skeleton-shimmer" />
          ))}
        </div>
      )}

      {!cargando && estilos.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no hay estilos de corte publicados.</p>
      )}

      {!cargando && estilos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {estilos.map((e) => (
            <button
              key={e.id}
              onClick={() => abrirEstilo(e)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden flex flex-col h-full text-left transition active:scale-95"
            >
              <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {e.portada_url ? (
                  <img src={e.portada_url} alt={e.nombre} className="w-full h-full object-cover" />
                ) : (
                  <Scissors size={32} className="text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div className="p-2.5">
                <h3 className="font-semibold text-sm truncate">{e.nombre}</h3>
                {e.barberos?.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {e.barberos.map((b) => b.alias || b.nombre).join(', ')}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={estiloAbierto != null} onClose={() => setEstiloAbierto(null)} title={estiloAbierto?.nombre || ''}>
        {estiloAbierto && (
          <div>
            <Carrusel imagenes={imagenesEstilo} alt={estiloAbierto.nombre} />

            {estiloAbierto.descripcion && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{estiloAbierto.descripcion}</p>
            )}

            <LikesComentarios tipo="estilo" itemId={estiloAbierto.id} />

            {estiloAbierto.barberos?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Lo hacen:</p>
                <div className="space-y-2">
                  {estiloAbierto.barberos.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                          {b.foto ? (
                            <img src={b.foto} alt={b.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <Scissors size={14} className="text-gray-500" />
                          )}
                        </div>
                        <span className="text-sm font-medium truncate">{b.alias || b.nombre}</span>
                      </div>
                      <button
                        onClick={() => agendarConBarbero(b.id)}
                        className="flex items-center gap-1 text-xs font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full px-3 py-1.5 transition active:scale-95 shrink-0"
                      >
                        <Calendar size={12} />
                        Agendar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default EstilosDeCorte
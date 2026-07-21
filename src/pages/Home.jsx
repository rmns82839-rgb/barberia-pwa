import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Scissors, Star, MessageSquarePlus, Images } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal.jsx'

function Estrellas({ valor, tamano = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={tamano}
          className={n <= Math.round(valor) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
        />
      ))}
    </div>
  )
}

function SelectorEstrellas({ valor, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star
            size={26}
            className={n <= valor ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}

function Home() {
  const { cliente } = useAuth()
  const navigate = useNavigate()
  const [barberos, setBarberos] = useState([])
  const [ratings, setRatings] = useState({})
  const [cargando, setCargando] = useState(true)
  const [modalResena, setModalResena] = useState(null)
  const [calificacion, setCalificacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [modalGaleria, setModalGaleria] = useState(null)
  const [fotosGaleria, setFotosGaleria] = useState([])

  useEffect(() => {
    fetch('/api/barberos')
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo conectar')
        return res.json()
      })
      .then((data) => {
        setBarberos(data)
        setCargando(false)
        data.forEach((b) => cargarPromedio(b.id))
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }, [])

  const cargarPromedio = (barbero_id) => {
    fetch(`/api/resenas?barbero_id=${barbero_id}`)
      .then((res) => res.json())
      .then((data) => {
        setRatings((prev) => ({ ...prev, [barbero_id]: data }))
      })
      .catch(() => {})
  }

  const abrirGaleria = (barbero_id) => {
    setModalGaleria(barbero_id)
    fetch(`/api/galeria?barbero_id=${barbero_id}`)
      .then((res) => res.json())
      .then((data) => setFotosGaleria(data.fotos || []))
      .catch(() => toast.error('No se pudo cargar la galería'))
  }

  const abrirModalResena = (barbero_id) => {
    if (!cliente) {
      toast.info('Inicia sesión para dejar una reseña')
      navigate('/login')
      return
    }
    setModalResena(barbero_id)
    setCalificacion(0)
    setComentario('')
  }

  const enviarResena = async () => {
    if (!calificacion) {
      toast.error('Elige una calificación')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbero_id: modalResena,
          calificacion,
          comentario: comentario.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar la reseña')
      toast.success('¡Gracias por tu reseña!')
      setModalResena(null)
      cargarPromedio(modalResena)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Bienvenido a la Barbería</h1>
      <p className="text-gray-600 mb-6">
        Agenda tu cita, revisa el catálogo de productos y más.
      </p>

      <h2 className="text-lg font-semibold mb-3">Nuestros barberos</h2>

      {cargando && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 flex flex-col items-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gray-200 mb-3" />
              <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-14 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {!cargando && (
        <div className="grid grid-cols-2 gap-4">
          {barberos.map((barbero) => {
            const rating = ratings[barbero.id]
            return (
              <div
                key={barbero.id}
                className="bg-white rounded-xl shadow p-4 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                  <Scissors size={26} className="text-gray-700" />
                </div>
                <h3 className="font-semibold">{barbero.nombre}</h3>
                <span
                  className={`mt-2 text-xs px-2 py-1 rounded-full ${
                    barbero.estado === 'disponible'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {barbero.estado === 'disponible' ? 'Disponible' : 'Ocupado'}
                </span>

                {rating && rating.promedio ? (
                  <div className="mt-2 flex items-center gap-1">
                    <Estrellas valor={rating.promedio} />
                    <span className="text-xs text-gray-500">
                      {rating.promedio} ({rating.total})
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-400">Sin reseñas todavía</p>
                )}

                <button
                  onClick={() => abrirGaleria(barbero.id)}
                  className="mt-2 flex items-center gap-1 text-xs text-gray-600 font-medium"
                >
                  <Images size={14} />
                  Ver trabajos
                </button>

                <button
                  onClick={() => abrirModalResena(barbero.id)}
                  className="mt-1 flex items-center gap-1 text-xs text-blue-600 font-medium"
                >
                  <MessageSquarePlus size={14} />
                  Dejar reseña
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modalResena != null}
        onClose={() => setModalResena(null)}
        title="Califica a tu barbero"
      >
        <div className="space-y-3">
          <SelectorEstrellas valor={calificacion} onChange={setCalificacion} />
          <textarea
            placeholder="Cuéntanos tu experiencia (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          />
          <button
            onClick={enviarResena}
            disabled={enviando}
            className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : 'Enviar reseña'}
          </button>
        </div>
      </Modal>

      <Modal
        open={modalGaleria != null}
        onClose={() => setModalGaleria(null)}
        title="Trabajos del barbero"
      >
        {fotosGaleria.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no ha subido fotos de sus trabajos.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {fotosGaleria.map((f) => (
              <div key={f.id}>
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img src={f.imagen_url} alt={f.descripcion || 'Trabajo'} className="w-full h-full object-cover" />
                </div>
                {f.descripcion && (
                  <p className="text-xs text-gray-600 mt-1 truncate" title={f.descripcion}>
                    {f.descripcion}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Home
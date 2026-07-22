import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Scissors, Star, MessageSquarePlus, Images, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'

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
  const [cargandoGaleria, setCargandoGaleria] = useState(false)
  const [modalVerResenas, setModalVerResenas] = useState(null)

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
    setCargandoGaleria(true)
    setFotosGaleria([])
    fetch(`/api/galeria?barbero_id=${barbero_id}`)
      .then((res) => res.json())
      .then((data) => setFotosGaleria(data.fotos || []))
      .catch(() => toast.error('No se pudo cargar la galería'))
      .finally(() => setCargandoGaleria(false))
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
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Agenda tu cita, revisa el catálogo de productos y más.
      </p>

      <button
        onClick={() => navigate('/login')}
        className="w-full mb-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl px-4 py-3.5 font-semibold shadow-md transition active:scale-95"
      >
        ✂️ Aparta tu cita ahora
      </button>

      <h2 className="text-lg font-semibold mb-3">Nuestros barberos</h2>

      {cargando && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full skeleton-shimmer mb-3" />
              <div className="h-3 w-20 rounded skeleton-shimmer mb-2" />
              <div className="h-3 w-14 rounded skeleton-shimmer" />
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
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-3 overflow-hidden">
                  {barbero.foto ? (
                    <img src={barbero.foto} alt={barbero.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <Scissors size={26} className="text-gray-700 dark:text-gray-300" />
                  )}
                </div>
                <h3 className="font-semibold">{barbero.alias || barbero.nombre}</h3>
                {barbero.especialidad && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{barbero.especialidad}</p>
                )}
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
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {rating.promedio} ({rating.total})
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Sin reseñas todavía</p>
                )}

                <div className="grid grid-cols-2 gap-2 w-full mt-3">
                  <button
                    onClick={() => abrirGaleria(barbero.id)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition active:scale-95"
                  >
                    <Images size={18} />
                    <span>Ver trabajos</span>
                  </button>

                  <button
                    onClick={() => setModalVerResenas(barbero.id)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition active:scale-95"
                  >
                    <MessageCircle size={18} />
                    <span>Ver reseñas</span>
                  </button>

                  <button
                    onClick={() => abrirModalResena(barbero.id)}
                    className="col-span-2 flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-xs font-medium bg-blue-600 text-white transition active:scale-95"
                  >
                    <MessageSquarePlus size={18} />
                    <span>Dejar reseña</span>
                  </button>
                </div>
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
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none"
          />
          <button
            onClick={enviarResena}
            disabled={enviando}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {enviando ? <CargandoTijera texto="Enviando..." size={14} className="text-white" /> : 'Enviar reseña'}
          </button>
        </div>
      </Modal>

      <Modal
        open={modalGaleria != null}
        onClose={() => setModalGaleria(null)}
        title="Trabajos del barbero"
      >
        {cargandoGaleria ? (
          <div className="grid grid-cols-1 gap-3 max-h-[65vh] overflow-y-auto pr-1">
            {[1, 2].map((i) => (
              <div key={i} className="aspect-square rounded-xl skeleton-shimmer" />
            ))}
          </div>
        ) : fotosGaleria.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aún no ha subido fotos de sus trabajos.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-h-[65vh] overflow-y-auto pr-1">
            {fotosGaleria.map((f) => (
              <div key={f.id}>
                <div className="aspect-square rounded-xl overflow-hidden">
                  <img src={f.imagen_url} alt={f.descripcion || 'Trabajo'} className="w-full h-full object-cover" />
                </div>
                {f.descripcion && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {f.descripcion}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={modalVerResenas != null}
        onClose={() => setModalVerResenas(null)}
        title="Reseñas de clientes"
      >
        {(!ratings[modalVerResenas] || ratings[modalVerResenas].resenas.length === 0) ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aún no hay reseñas para este barbero.</p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {ratings[modalVerResenas].resenas.map((r) => (
              <div key={r.id} className="border-b dark:border-gray-700 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{r.cliente_nombre}</span>
                  <Estrellas valor={r.calificacion} tamano={13} />
                </div>
                {r.comentario && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{r.comentario}</p>
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
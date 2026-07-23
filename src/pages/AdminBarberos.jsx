import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Star, ChevronDown, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Estrellas({ valor, tamano = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={tamano}
          className={n <= Math.round(valor) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}
        />
      ))}
    </div>
  )
}

function AdminBarberos() {
  const { admin } = useAuth()
  const navigate = useNavigate()
  const [barberos, setBarberos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [expandido, setExpandido] = useState(null)
  const [resenasPorBarbero, setResenasPorBarbero] = useState({})

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login')
    }
  }, [admin, navigate])

  useEffect(() => {
    if (!admin) return
    fetch('/api/admin?action=barberos-stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setBarberos(data.barberos || [])
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }, [admin])

  const alternarExpandido = (barberoId) => {
    if (expandido === barberoId) {
      setExpandido(null)
      return
    }
    setExpandido(barberoId)
    if (!resenasPorBarbero[barberoId]) {
      fetch(`/api/resenas?barbero_id=${barberoId}`)
        .then((res) => res.json())
        .then((data) => {
          setResenasPorBarbero((prev) => ({ ...prev, [barberoId]: data.resenas || [] }))
        })
        .catch(() => {})
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Desempeño de barberos</h1>
        <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 dark:text-gray-400 underline">
          Volver al panel
        </button>
      </div>

      {cargando && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      )}

      {!cargando && barberos.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No hay barberos activos registrados.</p>
      )}

      <div className="space-y-3">
        {barberos.map((b) => (
          <div key={b.id} className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <button
              onClick={() => alternarExpandido(b.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div>
                <div className="font-semibold text-sm">{b.alias || b.nombre}</div>
                <div className="flex items-center gap-2 mt-1">
                  {b.total_resenas > 0 ? (
                    <>
                      <Estrellas valor={b.promedio} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {b.promedio} ({b.total_resenas})
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">Sin reseñas todavía</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <CheckCircle2 size={12} />
                  {b.atendidas} {b.atendidas === 1 ? 'cita atendida' : 'citas atendidas'} en total
                </div>
              </div>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform ${expandido === b.id ? 'rotate-180' : ''}`}
              />
            </button>

            {expandido === b.id && (
              <div className="border-t dark:border-gray-700 p-4">
                {!resenasPorBarbero[b.id] ? (
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded skeleton-shimmer" />
                    <div className="h-3 w-40 rounded skeleton-shimmer" />
                  </div>
                ) : resenasPorBarbero[b.id].length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aún no tiene reseñas.</p>
                ) : (
                  <div className="space-y-3">
                    {resenasPorBarbero[b.id].map((r) => (
                      <div key={r.id} className="border-b dark:border-gray-700 pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{r.cliente_nombre}</span>
                          <Estrellas valor={r.calificacion} tamano={12} />
                        </div>
                        {r.comentario && <p className="text-sm text-gray-600 dark:text-gray-400">{r.comentario}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminBarberos
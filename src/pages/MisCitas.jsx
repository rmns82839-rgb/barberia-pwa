import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarX2, Scissors } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'

function MisCitas() {
  const { cliente, cargando: cargandoAuth } = useAuth()
  const navigate = useNavigate()
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [aCancelar, setACancelar] = useState(null)
  const [cancelando, setCancelando] = useState(false)

  useEffect(() => {
    if (cargandoAuth) return
    if (!cliente) {
      navigate('/login')
    }
  }, [cliente, cargandoAuth, navigate])

  const cargarCitas = () => {
    setCargando(true)
    fetch('/api/citas?accion=mis-citas')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setCitas(data.citas || [])
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }

  useEffect(() => {
    if (cliente) cargarCitas()
  }, [cliente])

  const cancelarCita = async () => {
    if (!aCancelar) return
    setCancelando(true)
    try {
      const res = await fetch('/api/citas?accion=cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cita_id: aCancelar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Cita cancelada')
      setACancelar(null)
      cargarCitas()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCancelando(false)
    }
  }

  const formatoFecha = (fechaISO) => {
    const [a, m, d] = String(fechaISO).split('T')[0].split('-')
    return `${d}/${m}/${a}`
  }

  if (cargandoAuth || !cliente) return null

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Mis citas</h1>

      {cargando && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="h-4 w-24 rounded skeleton-shimmer mb-2" />
              <div className="h-3 w-32 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      )}

      {!cargando && citas.length === 0 && (
        <div className="text-center py-10">
          <Scissors size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No tienes citas próximas.</p>
          <button
            onClick={() => navigate('/citas')}
            className="mt-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-4 py-2 text-sm font-medium transition active:scale-95"
          >
            Agendar una cita
          </button>
        </div>
      )}

      {!cargando && citas.length > 0 && (
        <div className="space-y-3">
          {citas.map((c) => (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold">{formatoFecha(c.fecha)} — {c.hora}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Con {c.barbero_alias || c.barbero_nombre}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                  {c.tipo === 'walk_in' ? 'Sin cita' : 'Agendada'}
                </span>
              </div>
              <button
                onClick={() => setACancelar(c.id)}
                className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium"
              >
                <CalendarX2 size={14} />
                Cancelar cita
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={aCancelar != null} onClose={() => setACancelar(null)} title="Cancelar cita">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ¿Seguro que quieres cancelar esta cita? Esta acción no se puede deshacer.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={cancelarCita}
            disabled={cancelando}
            className="flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {cancelando ? <CargandoTijera texto="Cancelando..." size={14} className="text-white" /> : 'Sí, cancelar'}
          </button>
          <button
            onClick={() => setACancelar(null)}
            className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition active:scale-95"
          >
            Volver
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default MisCitas
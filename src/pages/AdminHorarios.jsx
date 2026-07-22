import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarOff, CalendarPlus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'

const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function AdminHorarios() {
  const { admin } = useAuth()
  const navigate = useNavigate()

  const [horario, setHorario] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardandoDia, setGuardandoDia] = useState(null)

  const [excepciones, setExcepciones] = useState([])
  const [cargandoExcepciones, setCargandoExcepciones] = useState(true)
  const [modalExcepcion, setModalExcepcion] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevoCerrado, setNuevoCerrado] = useState(true)
  const [nuevoAbre, setNuevoAbre] = useState('09:00')
  const [nuevoCierra, setNuevoCierra] = useState('20:00')
  const [guardandoExcepcion, setGuardandoExcepcion] = useState(false)
  const [aBorrar, setABorrar] = useState(null)

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login')
    }
  }, [admin, navigate])

  const cargarHorario = () => {
    fetch('/api/admin?action=horario-semanal')
      .then((res) => res.json())
      .then((data) => {
        const dias = [0, 1, 2, 3, 4, 5, 6].map((d) => {
          const existente = (data.horario || []).find((h) => h.dia_semana === d)
          return existente || { dia_semana: d, abre: '09:00', cierra: '20:00', activo: d !== 0 }
        })
        setHorario(dias)
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }

  const cargarExcepciones = () => {
    fetch('/api/admin?action=horario-excepciones')
      .then((res) => res.json())
      .then((data) => {
        setExcepciones(data.excepciones || [])
        setCargandoExcepciones(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargandoExcepciones(false)
      })
  }

  useEffect(() => {
    if (admin) {
      cargarHorario()
      cargarExcepciones()
    }
  }, [admin])

  const actualizarDia = (dia, cambios) => {
    setHorario((prev) => prev.map((d) => (d.dia_semana === dia.dia_semana ? { ...d, ...cambios } : d)))
  }

  const guardarDia = async (dia) => {
    setGuardandoDia(dia.dia_semana)
    try {
      const res = await fetch('/api/admin?action=horario-semanal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dia),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${NOMBRES_DIA[dia.dia_semana]} actualizado`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardandoDia(null)
    }
  }

  const crearExcepcion = async () => {
    if (!nuevaFecha) {
      toast.error('Elige una fecha')
      return
    }
    setGuardandoExcepcion(true)
    try {
      const res = await fetch('/api/admin?action=horario-excepciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: nuevaFecha,
          cerrado: nuevoCerrado,
          abre: nuevoAbre,
          cierra: nuevoCierra,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Excepción guardada')
      setModalExcepcion(false)
      setNuevaFecha('')
      setNuevoCerrado(true)
      cargarExcepciones()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardandoExcepcion(false)
    }
  }

  const borrarExcepcion = async () => {
    if (!aBorrar) return
    try {
      const res = await fetch('/api/admin?action=horario-excepciones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: aBorrar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Excepción eliminada')
      setABorrar(null)
      cargarExcepciones()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const formatoFecha = (fechaISO) => {
    const [a, m, d] = String(fechaISO).split('T')[0].split('-')
    return `${d}/${m}/${a}`
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Horarios de atención</h1>
        <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 dark:text-gray-400 underline">
          Volver al panel
        </button>
      </div>

      {/* ---- Horario semanal ---- */}
      <h2 className="text-sm font-semibold mb-1">Horario semanal</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Define a qué hora abres y cierras cada día. Si un día no atiendes, desactívalo.
      </p>

      {cargando && (
        <div className="space-y-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      )}

      {!cargando && (
        <div className="space-y-2 mb-8">
          {horario.map((dia) => (
            <div key={dia.dia_semana} className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 w-28 shrink-0">
                <input
                  type="checkbox"
                  checked={dia.activo}
                  onChange={(e) => actualizarDia(dia, { activo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">{NOMBRES_DIA[dia.dia_semana]}</span>
              </label>

              {dia.activo ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={dia.abre || '09:00'}
                    onChange={(e) => actualizarDia(dia, { abre: e.target.value })}
                    className="border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-400">a</span>
                  <input
                    type="time"
                    value={dia.cierra || '20:00'}
                    onChange={(e) => actualizarDia(dia, { cierra: e.target.value })}
                    className="border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2 py-1 text-sm"
                  />
                </div>
              ) : (
                <span className="flex-1 text-xs text-gray-400 dark:text-gray-500">Cerrado</span>
              )}

              <button
                onClick={() => guardarDia(dia)}
                disabled={guardandoDia === dia.dia_semana}
                className="flex items-center justify-center gap-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-1.5 text-xs font-medium transition active:scale-95 disabled:opacity-50"
              >
                {guardandoDia === dia.dia_semana ? (
                  <CargandoTijera texto={null} size={12} className="text-white dark:text-gray-900" />
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---- Excepciones ---- */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold">Días especiales</h2>
        <button
          onClick={() => setModalExcepcion(true)}
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium"
        >
          <CalendarPlus size={14} />
          Agregar
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Para festivos, cierres puntuales, o un horario distinto en una fecha específica (tiene prioridad sobre el horario semanal).
      </p>

      {cargandoExcepciones && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      )}

      {!cargandoExcepciones && excepciones.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No tienes días especiales próximos configurados.</p>
      )}

      {!cargandoExcepciones && excepciones.length > 0 && (
        <div className="space-y-2">
          {excepciones.map((e) => (
            <div key={e.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">{formatoFecha(e.fecha)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {e.cerrado ? 'Cerrado todo el día' : `Horario especial: ${e.abre} - ${e.cierra}`}
                </div>
              </div>
              <button
                onClick={() => setABorrar(e.id)}
                aria-label="Eliminar"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-700 transition active:scale-95"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalExcepcion} onClose={() => setModalExcepcion(false)} title="Nuevo día especial">
        <div className="space-y-3">
          <input
            type="date"
            value={nuevaFecha}
            onChange={(e) => setNuevaFecha(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setNuevoCerrado(true)}
              className={`flex items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium transition ${
                nuevoCerrado ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <CalendarOff size={14} /> Cerrado
            </button>
            <button
              type="button"
              onClick={() => setNuevoCerrado(false)}
              className={`flex items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium transition ${
                !nuevoCerrado ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <CalendarPlus size={14} /> Horario especial
            </button>
          </div>

          {!nuevoCerrado && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={nuevoAbre}
                onChange={(e) => setNuevoAbre(e.target.value)}
                className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2 py-2 text-sm"
              />
              <span className="text-xs text-gray-400">a</span>
              <input
                type="time"
                value={nuevoCierra}
                onChange={(e) => setNuevoCierra(e.target.value)}
                className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2 py-2 text-sm"
              />
            </div>
          )}

          <button
            onClick={crearExcepcion}
            disabled={guardandoExcepcion}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {guardandoExcepcion ? (
              <CargandoTijera texto="Guardando..." size={14} className="text-white dark:text-gray-900" />
            ) : (
              'Guardar día especial'
            )}
          </button>
        </div>
      </Modal>

      <Modal open={aBorrar != null} onClose={() => setABorrar(null)} title="Eliminar día especial">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ¿Seguro que quieres eliminar esta excepción? Ese día volverá al horario semanal normal.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={borrarExcepcion}
            className="bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95"
          >
            Sí, eliminar
          </button>
          <button
            onClick={() => setABorrar(null)}
            className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminHorarios
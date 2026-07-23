import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Star, ChevronDown, CheckCircle2, UserPlus, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'

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

  const [modalNuevo, setModalNuevo] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoUsuario, setNuevoUsuario] = useState('')
  const [nuevoPassword, setNuevoPassword] = useState('')
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState('')
  const [creando, setCreando] = useState(false)

  const [modalReset, setModalReset] = useState(null)
  const [passwordReset, setPasswordReset] = useState('')
  const [reseteando, setReseteando] = useState(false)

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login')
    }
  }, [admin, navigate])

  const cargarBarberos = () => {
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
  }

  useEffect(() => {
    if (admin) cargarBarberos()
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

  const crearBarbero = async () => {
    if (!nuevoNombre.trim() || !nuevoUsuario.trim() || !nuevoPassword) {
      toast.error('Nombre, usuario y contraseña son obligatorios')
      return
    }
    if (nuevoPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setCreando(true)
    try {
      const res = await fetch('/api/admin?action=crear-barbero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoNombre.trim(),
          usuario: nuevoUsuario.trim(),
          password: nuevoPassword,
          especialidad: nuevaEspecialidad.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Barbero "${data.barbero.nombre}" creado`)
      setModalNuevo(false)
      setNuevoNombre('')
      setNuevoUsuario('')
      setNuevoPassword('')
      setNuevaEspecialidad('')
      cargarBarberos()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreando(false)
    }
  }

  const resetearPassword = async () => {
    if (!passwordReset || passwordReset.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    setReseteando(true)
    try {
      const res = await fetch('/api/admin?action=resetear-password-barbero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barbero_id: modalReset, passwordNueva: passwordReset }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Contraseña actualizada')
      setModalReset(null)
      setPasswordReset('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setReseteando(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-xl font-bold">Desempeño de barberos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setModalNuevo(true)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 transition active:scale-95"
          >
            <UserPlus size={14} />
            Nuevo barbero
          </button>
          <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 dark:text-gray-400 underline">
            Volver al panel
          </button>
        </div>
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
            <div className="flex items-center justify-between p-4">
              <button onClick={() => alternarExpandido(b.id)} className="flex-1 text-left">
                <div className="font-semibold text-sm">{b.alias || b.nombre}</div>
                {b.usuario && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">usuario: {b.usuario}</div>
                )}
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
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setModalReset(b.id)}
                  aria-label="Resetear contraseña"
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition active:scale-95"
                >
                  <KeyRound size={14} />
                </button>
                <button onClick={() => alternarExpandido(b.id)}>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform ${expandido === b.id ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

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

      <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} title="Nuevo barbero">
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nombre completo"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Usuario para iniciar sesión (ej: barbero3)"
            value={nuevoUsuario}
            onChange={(e) => setNuevoUsuario(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={nuevoPassword}
            onChange={(e) => setNuevoPassword(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Especialidad (opcional)"
            value={nuevaEspecialidad}
            onChange={(e) => setNuevaEspecialidad(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={crearBarbero}
            disabled={creando}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {creando ? <CargandoTijera texto="Creando..." size={14} className="text-white dark:text-gray-900" /> : 'Crear barbero'}
          </button>
        </div>
      </Modal>

      <Modal open={modalReset != null} onClose={() => setModalReset(null)} title="Resetear contraseña">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Define una nueva contraseña para este barbero (no necesitas saber la anterior).
        </p>
        <div className="space-y-2">
          <input
            type="password"
            placeholder="Nueva contraseña (mín. 6 caracteres)"
            value={passwordReset}
            onChange={(e) => setPasswordReset(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={resetearPassword}
            disabled={reseteando}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {reseteando ? <CargandoTijera texto="Guardando..." size={14} className="text-white dark:text-gray-900" /> : 'Actualizar contraseña'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminBarberos
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Package, Users, KeyRound, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'

const chip =
  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95'

function Admin() {
  const { admin, logoutAdmin } = useAuth()
  const [fecha, setFecha] = useState('')
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [modalCredenciales, setModalCredenciales] = useState(false)
  const [passwordActual, setPasswordActual] = useState('')
  const [usuarioNuevo, setUsuarioNuevo] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [guardandoCredenciales, setGuardandoCredenciales] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login')
      return
    }
    const hoy = new Date().toLocaleDateString('en-CA')
    setFecha(hoy)
  }, [admin, navigate])

  const cargarCitas = () => {
    if (!fecha) return
    setCargando(true)
    fetch(`/api/citas?accion=dia&fecha=${fecha}`)
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
    if (admin) cargarCitas()
  }, [admin, fecha])

  const cerrarSesion = () => {
    logoutAdmin()
    navigate('/admin-login')
  }

  const guardarCredenciales = async () => {
    if (!passwordActual) {
      toast.error('Ingresa tu contraseña actual')
      return
    }
    setGuardandoCredenciales(true)
    try {
      const res = await fetch('/api/auth?action=admin-cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordActual,
          usuarioNuevo: usuarioNuevo.trim() || undefined,
          passwordNueva: passwordNueva || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Credenciales actualizadas')
      setModalCredenciales(false)
      setPasswordActual('')
      setUsuarioNuevo('')
      setPasswordNueva('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardandoCredenciales(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-xl font-bold">Panel de administración</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/admin-productos')}
            className={`${chip} bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300`}
          >
            <Package size={14} />
            Productos
          </button>
          <button
            onClick={() => navigate('/admin-clientes')}
            className={`${chip} bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300`}
          >
            <Users size={14} />
            Clientes
          </button>
          <button
            onClick={() => setModalCredenciales(true)}
            className={`${chip} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`}
          >
            <KeyRound size={14} />
            Credenciales
          </button>
          <button
            onClick={cerrarSesion}
            className={`${chip} bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300`}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </div>

      <label className="block text-sm font-medium mb-2">Ver citas del día (todos los barberos)</label>
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 mb-5"
      />

      {cargando && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="h-4 w-16 rounded skeleton-shimmer mb-2" />
              <div className="h-3 w-32 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      )}

      {!cargando && citas.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No hay citas para este día.</p>
      )}

      <div className="space-y-3">
        {citas.map((cita) => (
          <div
            key={cita.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-semibold text-lg">{cita.hora}</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {cita.cliente_nombre || 'Sin registro'}
                {cita.cliente_telefono && (
                  <span className="text-gray-400 dark:text-gray-500"> · {cita.cliente_telefono}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Con {cita.barbero_nombre}</div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                cita.tipo === 'walk_in'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {cita.tipo === 'walk_in' ? 'Sin cita' : 'Agendada'}
            </span>
          </div>
        ))}
      </div>

      <Modal
        open={modalCredenciales}
        onClose={() => setModalCredenciales(false)}
        title="Cambiar credenciales"
      >
        <div className="space-y-2">
          <input
            type="password"
            placeholder="Contraseña actual"
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Nuevo usuario (opcional)"
            value={usuarioNuevo}
            onChange={(e) => setUsuarioNuevo(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Nueva contraseña (opcional, mín. 6 caracteres)"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={guardarCredenciales}
            disabled={guardandoCredenciales}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {guardandoCredenciales ? (
              <CargandoTijera texto="Guardando..." size={14} className="text-white dark:text-gray-900" />
            ) : (
              'Guardar cambios'
            )}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Admin
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Power, UserPlus, ClipboardPlus, Bell, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { hoyColombia } from '../lib/fechas.js'
import Modal from '../components/Modal.jsx'

const chipBase =
  'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition active:scale-95 disabled:opacity-50 disabled:active:scale-100'

function Admin() {
  const { admin, logoutAdmin } = useAuth()
  const [fecha, setFecha] = useState(hoyColombia())
  const [citas, setCitas] = useState([])
  const [barberos, setBarberos] = useState([])
  const [cargando, setCargando] = useState(false)

  const [actualizando, setActualizando] = useState(null)
  const [modalWalkIn, setModalWalkIn] = useState(null)
  const [walkInNombre, setWalkInNombre] = useState('')
  const [walkInTelefono, setWalkInTelefono] = useState('')
  const [guardandoWalkIn, setGuardandoWalkIn] = useState(null)
  const [avisando, setAvisando] = useState(null)
  const [avisoResultado, setAvisoResultado] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login')
    }
  }, [admin, navigate])

  const cargarCitas = () => {
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

  const cargarBarberos = () => {
    fetch('/api/barberos')
      .then((res) => res.json())
      .then((data) => setBarberos(data))
      .catch(() => {})
  }

  useEffect(() => {
    if (admin) cargarBarberos()
  }, [admin])

  useEffect(() => {
    if (!avisoResultado || !avisoResultado.notificacion_id) return
    if (avisoResultado.respuesta) return

    const revisar = () => {
      fetch(`/api/admin?action=estado-aviso&notificacion_id=${avisoResultado.notificacion_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.respuesta) {
            setAvisoResultado((prev) =>
              prev ? { ...prev, respuesta: data.respuesta } : prev
            )
            toast[data.respuesta === 'confirmado' ? 'success' : 'warning'](
              data.respuesta === 'confirmado' ? 'Cliente confirmó, va en camino' : 'El cliente no puede venir'
            )
          }
        })
        .catch(() => {})
    }

    const intervalo = setInterval(revisar, 5000)
    return () => clearInterval(intervalo)
  }, [avisoResultado])

  const cambiarEstado = async (barbero_id, estadoActual) => {
    const nuevoEstado = estadoActual === 'disponible' ? 'ocupado' : 'disponible'
    setActualizando(barbero_id)
    setBarberos((prev) =>
      prev.map((b) => (b.id === barbero_id ? { ...b, estado: nuevoEstado } : b))
    )
    try {
      const res = await fetch('/api/barbero-estado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barbero_id, estado: nuevoEstado }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
    } catch (err) {
      toast.error(err.message)
      cargarBarberos()
    } finally {
      setActualizando(null)
    }
  }

  const horaActual = () => {
    return new Date().toLocaleTimeString('es-CO', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const registrarWalkIn = async (barbero_id, conNombre) => {
    setGuardandoWalkIn(barbero_id)
    setBarberos((prev) =>
      prev.map((b) => (b.id === barbero_id ? { ...b, estado: 'ocupado' } : b))
    )
    try {
      const body = {
        barbero_id,
        fecha: hoyColombia(),
        hora: horaActual(),
      }
      if (conNombre) {
        body.nombre = walkInNombre.trim()
        body.telefono = walkInTelefono.trim()
      }
      const res = await fetch('/api/citas?accion=walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Walk-in registrado')
      setModalWalkIn(null)
      setWalkInNombre('')
      setWalkInTelefono('')
      cargarBarberos()
      cargarCitas()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardandoWalkIn(null)
    }
  }

  const avisarSiguiente = async (barbero_id) => {
    setAvisando(barbero_id)
    setAvisoResultado(null)
    try {
      const res = await fetch('/api/admin?action=avisos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barbero_id, fecha: hoyColombia() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.mensaje) {
        toast.info(data.mensaje)
        setAvisoResultado({ barbero_id, mensaje: data.mensaje })
      } else {
        const tel = data.cita.cliente_telefono.replace(/\D/g, '')
        const texto = encodeURIComponent(
          `✂️ ¡Hola ${data.cita.cliente_nombre}! 👋 Tu turno en la barbería está por comenzar a las ${data.cita.hora} ⏰. ¿Confirmas que llegas en los próximos 10-15 minutos? 🙌`
        )
        const link = `https://wa.me/57${tel}?text=${texto}`
        setAvisoResultado({
          barbero_id,
          cita: data.cita,
          link,
          notificacion_id: data.notificacion_id,
          respuesta: null,
        })
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAvisando(null)
    }
  }

  const cerrarSesion = () => {
    logoutAdmin()
    navigate('/admin-login')
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Panel de administración</h1>
        <div className="flex gap-3">
          <button onClick={() => navigate('/admin-productos')} className="text-sm text-blue-600 underline">
            Productos
          </button>
          <button onClick={() => navigate('/admin-clientes')} className="text-sm text-blue-600 underline">
            Clientes
          </button>
          <button onClick={cerrarSesion} className="text-sm text-gray-500 underline">
            Cerrar sesión
          </button>
        </div>
      </div>

      <h2 className="text-sm font-medium mb-2">Estado de barberos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {barberos.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-xl shadow p-4 flex flex-col items-center text-center"
          >
            <div className="font-medium text-sm mb-2">{b.nombre}</div>
            <span
              className={`text-xs px-2 py-1 rounded-full mb-3 ${
                b.estado === 'disponible'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {b.estado === 'disponible' ? 'Disponible' : 'Ocupado'}
            </span>

            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                onClick={() => cambiarEstado(b.id, b.estado)}
                disabled={actualizando === b.id}
                className={`${chipBase} bg-gray-900 text-white`}
              >
                {actualizando === b.id ? <Loader2 size={18} className="animate-spin" /> : <Power size={18} />}
                <span>{b.estado === 'disponible' ? 'Marcar ocupado' : 'Marcar disponible'}</span>
              </button>

              <button
                onClick={() => registrarWalkIn(b.id, false)}
                disabled={guardandoWalkIn === b.id}
                className={`${chipBase} bg-blue-600 text-white`}
              >
                {guardandoWalkIn === b.id ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                <span>Walk-in rápido</span>
              </button>

              <button
                onClick={() => setModalWalkIn(b.id)}
                className={`${chipBase} border border-blue-600 text-blue-600`}
              >
                <ClipboardPlus size={18} />
                <span>Con nombre</span>
              </button>

              <button
                onClick={() => avisarSiguiente(b.id)}
                disabled={avisando === b.id}
                className={`${chipBase} bg-amber-500 text-white`}
              >
                {avisando === b.id ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                <span>Avisar siguiente</span>
              </button>
            </div>

            {avisoResultado && avisoResultado.barbero_id === b.id && !avisoResultado.mensaje && (
              <div className="w-full mt-3 text-xs bg-amber-50 rounded-lg p-3">
                <p className="mb-2">
                  Siguiente: <strong>{avisoResultado.cita.cliente_nombre}</strong> ({avisoResultado.cita.hora})
                </p>
                <a
                  href={avisoResultado.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-green-600 text-white text-center rounded-lg px-2 py-2 mb-2 font-medium"
                >
                  Enviar WhatsApp
                </a>
                {avisoResultado.respuesta === 'confirmado' && (
                  <p className="bg-green-100 text-green-700 rounded-lg px-2 py-1 text-center font-medium">
                    ✅ Confirmó, va en camino
                  </p>
                )}
                {avisoResultado.respuesta === 'cancelado' && (
                  <p className="bg-red-100 text-red-700 rounded-lg px-2 py-1 text-center font-medium">
                    ❌ No puede venir
                  </p>
                )}
                {!avisoResultado.respuesta && (
                  <p className="text-gray-400 text-center">Esperando respuesta...</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={modalWalkIn != null}
        onClose={() => setModalWalkIn(null)}
        title="Registrar walk-in con nombre"
      >
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nombre"
            value={walkInNombre}
            onChange={(e) => setWalkInNombre(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="tel"
            placeholder="Teléfono (opcional)"
            value={walkInTelefono}
            onChange={(e) => setWalkInTelefono(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => registrarWalkIn(modalWalkIn, true)}
            disabled={guardandoWalkIn === modalWalkIn || !walkInNombre.trim()}
            className="w-full bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {guardandoWalkIn === modalWalkIn ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </Modal>

      <label className="block text-sm font-medium mb-2">Ver citas del día</label>
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-5"
      />

      {cargando && (
        <div className="space-y-3 mb-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
              <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {!cargando && citas.length === 0 && (
        <p className="text-gray-500 text-sm">No hay citas para este día.</p>
      )}

      <div className="space-y-3">
        {citas.map((cita) => (
          <div
            key={cita.id}
            className="bg-white rounded-xl shadow p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-semibold text-lg">{cita.hora}</div>
              <div className="text-sm text-gray-700">
                {cita.cliente_nombre || 'Sin registro'}
                {cita.cliente_telefono && (
                  <span className="text-gray-400"> · {cita.cliente_telefono}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">Con {cita.barbero_nombre}</div>
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
    </div>
  )
}

export default Admin
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hoyColombia } from '../lib/fechas.js'

function Admin() {
  const { admin, logoutAdmin } = useAuth()
  const [fecha, setFecha] = useState(hoyColombia())
  const [citas, setCitas] = useState([])
  const [barberos, setBarberos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const [actualizando, setActualizando] = useState(null)
  const [walkInAbierto, setWalkInAbierto] = useState(null)
  const [walkInNombre, setWalkInNombre] = useState('')
  const [walkInTelefono, setWalkInTelefono] = useState('')
  const [guardandoWalkIn, setGuardandoWalkIn] = useState(null)
  const [avisando, setAvisando] = useState(null)
  const [avisoResultado, setAvisoResultado] = useState(null)

  const navigate = useNavigate()

  // Verificar autenticación
  useEffect(() => {
    if (!admin) {
      navigate('/admin-login')
    }
  }, [admin, navigate])

  const cargarCitas = () => {
    setCargando(true)
    setError(null)
    fetch(`/api/citas?accion=dia&fecha=${fecha}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setCitas(data.citas || [])
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
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

  // Consultar respuesta del cliente al aviso (polling mientras esté pendiente)
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
      setError(err.message)
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
    setError(null)
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
      setWalkInAbierto(null)
      setWalkInNombre('')
      setWalkInTelefono('')
      cargarBarberos()
      cargarCitas()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardandoWalkIn(null)
    }
  }

  const avisarSiguiente = async (barbero_id) => {
    setAvisando(barbero_id)
    setError(null)
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
        setAvisoResultado({ barbero_id, mensaje: data.mensaje })
      } else {
        const tel = data.cita.cliente_telefono.replace(/\D/g, '')
        const texto = encodeURIComponent(
          `Hola ${data.cita.cliente_nombre}, tu turno en la barbería está por comenzar (${data.cita.hora}). ¿Confirmas que llegas en los próximos 10-15 minutos?`
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
      setError(err.message)
    } finally {
      setAvisando(null)
    }
  }

  const cerrarSesion = () => {
    logoutAdmin()
    navigate('/admin-login')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
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
      <div className="grid grid-cols-2 gap-3 mb-6">
        {barberos.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-lg shadow p-3 flex flex-col items-center text-center"
          >
            <div className="font-medium text-sm mb-2">{b.nombre}</div>
            <span
              className={`text-xs px-2 py-1 rounded-full mb-2 ${
                b.estado === 'disponible'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {b.estado === 'disponible' ? 'Disponible' : 'Ocupado'}
            </span>

            <button
              onClick={() => cambiarEstado(b.id, b.estado)}
              disabled={actualizando === b.id}
              className="text-xs w-full bg-gray-900 text-white rounded px-2 py-1 disabled:opacity-50"
            >
              {actualizando === b.id
                ? 'Actualizando...'
                : b.estado === 'disponible'
                ? 'Marcar ocupado'
                : 'Marcar disponible'}
            </button>

            <div className="w-full mt-2 space-y-1">
              <button
                onClick={() => registrarWalkIn(b.id, false)}
                disabled={guardandoWalkIn === b.id}
                className="text-xs w-full bg-blue-600 text-white rounded px-2 py-1 disabled:opacity-50"
              >
                {guardandoWalkIn === b.id ? 'Registrando...' : 'Walk-in rápido'}
              </button>
              <button
                onClick={() => setWalkInAbierto(walkInAbierto === b.id ? null : b.id)}
                className="text-xs w-full border border-blue-600 text-blue-600 rounded px-2 py-1"
              >
                Walk-in con nombre
              </button>

              {walkInAbierto === b.id && (
                <div className="mt-2 space-y-1">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={walkInNombre}
                    onChange={(e) => setWalkInNombre(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono (opcional)"
                    value={walkInTelefono}
                    onChange={(e) => setWalkInTelefono(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => registrarWalkIn(b.id, true)}
                    disabled={guardandoWalkIn === b.id || !walkInNombre.trim()}
                    className="text-xs w-full bg-blue-600 text-white rounded px-2 py-1 disabled:opacity-50"
                  >
                    {guardandoWalkIn === b.id ? 'Guardando...' : 'Registrar'}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => avisarSiguiente(b.id)}
              disabled={avisando === b.id}
              className="text-xs w-full mt-2 bg-amber-500 text-white rounded px-2 py-1 disabled:opacity-50"
            >
              {avisando === b.id ? 'Buscando...' : '🔔 Avisar al siguiente'}
            </button>

            {avisoResultado && avisoResultado.barbero_id === b.id && (
              <div className="w-full mt-2 text-xs">
                {avisoResultado.mensaje ? (
                  <p className="text-gray-500">{avisoResultado.mensaje}</p>
                ) : (
                  <div className="bg-amber-50 rounded p-2">
                    <p className="mb-1">
                      Siguiente: <strong>{avisoResultado.cita.cliente_nombre}</strong> ({avisoResultado.cita.hora})
                    </p>
                    <a
                      href={avisoResultado.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-green-600 text-white text-center rounded px-2 py-1 mb-2"
                    >
                      Enviar WhatsApp
                    </a>
                    {avisoResultado.respuesta === 'confirmado' && (
                      <p className="bg-green-100 text-green-700 rounded px-2 py-1 text-center font-medium">
                        ✅ Confirmó, va en camino
                      </p>
                    )}
                    {avisoResultado.respuesta === 'cancelado' && (
                      <p className="bg-red-100 text-red-700 rounded px-2 py-1 text-center font-medium">
                        ❌ No puede venir
                      </p>
                    )}
                    {!avisoResultado.respuesta && (
                      <p className="text-gray-400 text-center">Esperando respuesta...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <label className="block text-sm font-medium mb-2">Ver citas del día</label>
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-5"
      />

      {cargando && <p className="text-gray-500 text-sm">Cargando citas...</p>}
      {error && <p className="text-red-500 text-sm">Error: {error}</p>}

      {!cargando && citas.length === 0 && (
        <p className="text-gray-500 text-sm">No hay citas para este día.</p>
      )}

      <div className="space-y-3">
        {citas.map((cita) => (
          <div
            key={cita.id}
            className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
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
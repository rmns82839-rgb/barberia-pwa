import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { hoyColombia } from '../lib/fechas.js'

function Admin() {
  const [admin, setAdmin] = useState(null)
  const [fecha, setFecha] = useState(hoyColombia())
  const [citas, setCitas] = useState([])
  const [barberos, setBarberos] = useState([])
  const [actualizando, setActualizando] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Verificar sesión de admin
  useEffect(() => {
    const guardado = localStorage.getItem('admin')
    if (!guardado) {
      navigate('/admin-login')
      return
    }
    setAdmin(JSON.parse(guardado))
  }, [navigate])

  // Cargar citas del día
  const cargarCitas = () => {
    setCargando(true)
    setError(null)
    fetch(`/api/citas-dia?fecha=${fecha}`)
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

  const cambiarEstado = async (barbero_id, estadoActual) => {
    const nuevoEstado = estadoActual === 'disponible' ? 'ocupado' : 'disponible'
    setActualizando(barbero_id)

    // Actualización optimista: cambiamos el estado en pantalla de inmediato
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
      cargarBarberos() // si falla, recargamos el estado real
    } finally {
      setActualizando(null)
    }
  }

  const cerrarSesion = () => {
    localStorage.removeItem('admin')
    navigate('/admin-login')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Panel de administración</h1>
        <button
          onClick={cerrarSesion}
          className="text-sm text-gray-500 underline"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Estado de barberos en tiempo real */}
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
              <div className="text-xs text-gray-500 mt-1">
                Con {cita.barbero_nombre}
              </div>
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
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { hoyColombia } from '../lib/fechas.js'

function Citas() {
  const [cliente, setCliente] = useState(null)
  const [barberos, setBarberos] = useState([])
  const [barberoSel, setBarberoSel] = useState(null)
  const [fecha, setFecha] = useState('')
  const [horarios, setHorarios] = useState([])
  const [horaSel, setHoraSel] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [confirmada, setConfirmada] = useState(null)
  const navigate = useNavigate()

  // Verificar que haya un cliente logueado
  useEffect(() => {
    const guardado = localStorage.getItem('cliente')
    if (!guardado) {
      navigate('/login')
      return
    }
    setCliente(JSON.parse(guardado))
  }, [navigate])

  // Cargar barberos
  useEffect(() => {
    fetch('/api/barberos')
      .then((res) => res.json())
      .then((data) => setBarberos(data))
      .catch(() => setMensaje('No se pudieron cargar los barberos'))
  }, [])

  // Cuando cambia barbero o fecha, buscar horarios disponibles
  useEffect(() => {
    if (!barberoSel || !fecha) {
      setHorarios([])
      return
    }
    setCargando(true)
    setHoraSel(null)
    fetch(`/api/disponibilidad?barbero_id=${barberoSel}&fecha=${fecha}`)
      .then((res) => res.json())
      .then((data) => {
        setHorarios(data.disponibles || [])
        setMensaje(data.mensaje || '')
        setCargando(false)
      })
      .catch(() => {
        setMensaje('Error al cargar horarios')
        setCargando(false)
      })
  }, [barberoSel, fecha])

  const confirmarCita = async () => {
    if (!barberoSel || !fecha || !horaSel) return
    setCargando(true)
    setMensaje('')
    try {
      const res = await fetch('/api/crear-cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbero_id: barberoSel,
          cliente_id: cliente.id,
          fecha,
          hora: horaSel,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al agendar')
      setConfirmada(data.cita)
    } catch (err) {
      setMensaje(err.message)
    } finally {
      setCargando(false)
    }
  }

  // Fecha mínima = hoy
  const hoy = hoyColombia()

  if (confirmada) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold mb-2">¡Cita confirmada!</h1>
        <p className="text-gray-600">
          Te esperamos el {confirmada.fecha} a las {confirmada.hora}.
        </p>
        <button
          onClick={() => {
            setConfirmada(null)
            setBarberoSel(null)
            setFecha('')
            setHoraSel(null)
          }}
          className="mt-6 bg-gray-900 text-white rounded px-4 py-2"
        >
          Agendar otra cita
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Aparta tu cita</h1>

      {/* Paso 1: elegir barbero */}
      <label className="block text-sm font-medium mb-2">1. Elige tu barbero</label>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {barberos.map((b) => (
          <button
            key={b.id}
            onClick={() => setBarberoSel(b.id)}
            className={`rounded-lg border p-3 text-center ${
              barberoSel === b.id
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white'
            }`}
          >
            <div className="text-2xl mb-1">✂️</div>
            <div className="text-sm font-medium">{b.nombre}</div>
          </button>
        ))}
      </div>

      {/* Paso 2: elegir fecha */}
      <label className="block text-sm font-medium mb-2">2. Elige la fecha</label>
      <input
        type="date"
        min={hoy}
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-5"
      />

      {/* Paso 3: elegir hora */}
      {barberoSel && fecha && (
        <>
          <label className="block text-sm font-medium mb-2">3. Elige la hora</label>
          {cargando && <p className="text-gray-500 text-sm">Cargando horarios...</p>}
          {!cargando && horarios.length === 0 && (
            <p className="text-gray-500 text-sm">{mensaje || 'No hay horarios disponibles'}</p>
          )}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {horarios.map((h) => (
              <button
                key={h}
                onClick={() => setHoraSel(h)}
                className={`rounded border py-2 text-sm ${
                  horaSel === h
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </>
      )}

      {mensaje && !cargando && horarios.length > 0 && (
        <p className="text-red-500 text-sm mb-3">{mensaje}</p>
      )}

      {/* Botón confirmar */}
      {horaSel && (
        <button
          onClick={confirmarCita}
          disabled={cargando}
          className="w-full bg-gray-900 text-white rounded px-3 py-3 font-medium disabled:opacity-50"
        >
          {cargando ? 'Agendando...' : `Confirmar cita a las ${horaSel}`}
        </button>
      )}
    </div>
  )
}

export default Citas
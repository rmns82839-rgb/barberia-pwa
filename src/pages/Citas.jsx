import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Scissors } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { hoyColombia } from '../lib/fechas.js'
import { pedirPermisoNotificaciones, mostrarNotificacion } from '../lib/notificaciones.js'
import CargandoTijera from '../components/CargandoTijera.jsx'

function Citas() {
  const { cliente, cargando: cargandoAuth } = useAuth()
  const [barberos, setBarberos] = useState([])
  const [barberoSel, setBarberoSel] = useState(null)
  const [fecha, setFecha] = useState('')
  const [horarios, setHorarios] = useState([])
  const [horaSel, setHoraSel] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [sinDisponibilidad, setSinDisponibilidad] = useState('')
  const [confirmada, setConfirmada] = useState(null)

  const [aviso, setAviso] = useState(null)
  const [avisoRespondido, setAvisoRespondido] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    if (cargandoAuth) return
    if (!cliente) {
      navigate('/login')
    }
  }, [cliente, cargandoAuth, navigate])

  useEffect(() => {
    fetch('/api/barberos')
      .then((res) => res.json())
      .then((data) => setBarberos(data))
      .catch(() => toast.error('No se pudieron cargar los barberos'))
  }, [])

  useEffect(() => {
    if (!barberoSel || !fecha) {
      setHorarios([])
      return
    }
    setCargando(true)
    setHoraSel(null)
    setSinDisponibilidad('')
    fetch(`/api/citas?accion=disponibilidad&barbero_id=${barberoSel}&fecha=${fecha}`)
      .then((res) => res.json())
      .then((data) => {
        setHorarios(data.disponibles || [])
        setSinDisponibilidad(data.mensaje || '')
        setCargando(false)
      })
      .catch(() => {
        toast.error('Error al cargar horarios')
        setCargando(false)
      })
  }, [barberoSel, fecha])

  useEffect(() => {
    if (!cliente) return

    const revisarAviso = () => {
      const hoy = hoyColombia()
      fetch(`/api/citas?accion=mi-aviso&cliente_id=${cliente.id}&fecha=${hoy}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.aviso && (!aviso || aviso.notificacion_id !== data.aviso.notificacion_id)) {
            setAviso(data.aviso)
            setAvisoRespondido(false)
            mostrarNotificacion(
              'Tu turno está por comenzar',
              `${data.aviso.barbero_nombre} te espera (${data.aviso.hora}). ¿Confirmas que llegas pronto?`
            )
          }
        })
        .catch(() => {})
    }

    revisarAviso()
    const intervalo = setInterval(revisarAviso, 20000)
    return () => clearInterval(intervalo)
  }, [cliente, aviso])

  const responderAviso = async (respuesta) => {
    if (!aviso) return
    try {
      await fetch('/api/citas?accion=responder-aviso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificacion_id: aviso.notificacion_id, respuesta }),
      })
      toast.success('Respuesta enviada')
      setAvisoRespondido(true)
      setTimeout(() => {
        setAviso(null)
        setAvisoRespondido(false)
      }, 3000)
    } catch {
      toast.error('No se pudo enviar la respuesta')
    }
  }

  const confirmarCita = async () => {
    if (!barberoSel || !fecha || !horaSel) return
    setCargando(true)
    try {
      const res = await fetch('/api/citas?accion=crear', {
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
      toast.success('¡Cita agendada!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCargando(false)
    }
  }

  const hoy = hoyColombia()

  const bannerAviso = aviso && (
    <div className="fixed inset-x-0 top-0 z-50 bg-amber-500 text-white p-4 shadow-lg">
      <div className="max-w-md mx-auto text-center">
        {avisoRespondido ? (
          <p className="font-medium">¡Gracias! Tu respuesta fue enviada.</p>
        ) : (
          <>
            <p className="font-medium mb-1">🔔 Tu turno está por comenzar</p>
            <p className="text-sm mb-3">
              {aviso.barbero_nombre} te espera ({aviso.hora}). ¿Llegas en 10-15 min?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => responderAviso('confirmado')}
                className="bg-white text-amber-600 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95"
              >
                Sí, voy en camino
              </button>
              <button
                onClick={() => responderAviso('cancelado')}
                className="bg-amber-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95"
              >
                No puedo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  if (cargandoAuth || !cliente) {
    return null
  }

  if (confirmada) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        {bannerAviso}
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold mb-2">¡Cita confirmada!</h1>
        <p className="text-gray-600">
          Te esperamos el {String(confirmada.fecha).split('T')[0].split('-').reverse().join('/')} a las {confirmada.hora}.
        </p>
        <button
          onClick={() => {
            setConfirmada(null)
            setBarberoSel(null)
            setFecha('')
            setHoraSel(null)
          }}
          className="mt-6 bg-gray-900 text-white rounded-lg px-4 py-2 transition active:scale-95"
        >
          Agendar otra cita
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto">
      {bannerAviso}

      <h1 className="text-xl font-bold mb-4">Aparta tu cita</h1>

      <button
        onClick={async () => {
          const permiso = await pedirPermisoNotificaciones()
          if (permiso === 'granted') {
            toast.success('¡Notificaciones activadas!')
          } else {
            toast.info('Permiso de notificaciones: ' + permiso)
          }
        }}
        className="w-full mb-4 bg-amber-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95"
      >
        🔔 Activar notificaciones
      </button>

      <label className="block text-sm font-medium mb-2">1. Elige tu barbero</label>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {barberos.map((b) => (
          <button
            key={b.id}
            onClick={() => setBarberoSel(b.id)}
            className={`rounded-xl border p-3 text-center transition active:scale-95 ${
              barberoSel === b.id
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
            }`}
          >
            <Scissors size={22} className="mx-auto mb-1" />
            <div className="text-sm font-medium">{b.nombre}</div>
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium mb-2">2. Elige la fecha</label>
      <input
        type="date"
        min={hoy}
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-5 bg-white text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900"
      />

      {barberoSel && fecha && (
        <>
          <label className="block text-sm font-medium mb-2">3. Elige la hora</label>
          {cargando && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-9 rounded-lg skeleton-shimmer" />
              ))}
            </div>
          )}
          {!cargando && horarios.length === 0 && (
            <p className="text-gray-500 text-sm mb-5">{sinDisponibilidad || 'No hay horarios disponibles'}</p>
          )}
          {!cargando && horarios.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              {horarios.map((h) => (
                <button
                  key={h}
                  onClick={() => setHoraSel(h)}
                  className={`rounded-lg border py-2 text-sm transition active:scale-95 ${
                    horaSel === h
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {horaSel && (
        <button
          onClick={confirmarCita}
          disabled={cargando}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-3 py-3 font-medium transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {cargando ? <CargandoTijera texto="Agendando..." size={16} className="text-white" /> : `Confirmar cita a las ${horaSel}`}
        </button>
      )}
    </div>
  )
}

export default Citas
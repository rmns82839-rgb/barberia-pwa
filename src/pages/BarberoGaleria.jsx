import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Trash2, ImagePlus, KeyRound, Star, LogOut,
  Power, UserPlus, ClipboardPlus, Bell, Check,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { hoyColombia } from '../lib/fechas.js'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'

const chip =
  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95'

const chipGrande =
  'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition active:scale-95 disabled:opacity-50 disabled:active:scale-100'

function BarberoGaleria() {
  const { barbero, logoutBarbero, cargando: cargandoAuth } = useAuth()
  const navigate = useNavigate()

  // ---- Perfil ----
  const [fotos, setFotos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [aBorrar, setABorrar] = useState(null)
  const [resenas, setResenas] = useState([])
  const [promedio, setPromedio] = useState(null)
  const [fotoPerfil, setFotoPerfil] = useState(null)
  const [modalPassword, setModalPassword] = useState(false)
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [cambiando, setCambiando] = useState(false)

  // ---- Operativo: estado, walk-ins, avisos, citas de hoy ----
  const [estado, setEstado] = useState(null)
  const [actualizandoEstado, setActualizandoEstado] = useState(false)
  const [modalWalkIn, setModalWalkIn] = useState(false)
  const [walkInNombre, setWalkInNombre] = useState('')
  const [walkInTelefono, setWalkInTelefono] = useState('')
  const [guardandoWalkIn, setGuardandoWalkIn] = useState(false)
  const [avisando, setAvisando] = useState(false)
  const [avisoResultado, setAvisoResultado] = useState(null)
  const [citasHoy, setCitasHoy] = useState([])
  const [cargandoCitas, setCargandoCitas] = useState(true)
  const [marcandoId, setMarcandoId] = useState(null)

  useEffect(() => {
    if (cargandoAuth) return
    if (!barbero) {
      navigate('/barbero-login')
    }
  }, [barbero, cargandoAuth, navigate])

  const cargarFotos = () => {
    if (!barbero) return
    fetch(`/api/galeria?barbero_id=${barbero.id}`)
      .then((res) => res.json())
      .then((data) => {
        setFotos(data.fotos || [])
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }

  useEffect(() => {
    if (!barbero) return
    fetch('/api/barberos')
      .then((res) => res.json())
      .then((data) => {
        const yo = data.find((b) => b.id === barbero.id)
        if (yo) {
          setFotoPerfil(yo.foto || null)
          setEstado(yo.estado || 'disponible')
        }
      })
      .catch(() => {})
  }, [barbero])

  useEffect(() => {
    if (!barbero) return
    fetch(`/api/resenas?barbero_id=${barbero.id}`)
      .then((res) => res.json())
      .then((data) => {
        setResenas(data.resenas || [])
        setPromedio(data.promedio)
      })
      .catch(() => {})
  }, [barbero])

  useEffect(() => {
    cargarFotos()
  }, [barbero])

  const cargarCitasHoy = () => {
    if (!barbero) return
    setCargandoCitas(true)
    fetch(`/api/citas?accion=dia&fecha=${hoyColombia()}`)
      .then((res) => res.json())
      .then((data) => {
        const mias = (data.citas || []).filter((c) => c.barbero_id === barbero.id)
        setCitasHoy(mias)
        setCargandoCitas(false)
      })
      .catch(() => setCargandoCitas(false))
  }

  useEffect(() => {
    cargarCitasHoy()
  }, [barbero])

  const marcarAtendida = async (cita_id) => {
    setMarcandoId(cita_id)
    try {
      const res = await fetch('/api/citas?accion=marcar-atendida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cita_id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCitasHoy((prev) => prev.map((c) => (c.id === cita_id ? { ...c, estado: 'atendida' } : c)))
      toast.success('Cita marcada como atendida')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setMarcandoId(null)
    }
  }

  // Polling de la respuesta del cliente al aviso
  useEffect(() => {
    if (!avisoResultado || !avisoResultado.notificacion_id || avisoResultado.respuesta) return
    const intervalo = setInterval(() => {
      fetch(`/api/citas?accion=estado-aviso&notificacion_id=${avisoResultado.notificacion_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.respuesta) {
            setAvisoResultado((prev) => (prev ? { ...prev, respuesta: data.respuesta } : prev))
            toast[data.respuesta === 'confirmado' ? 'success' : 'warning'](
              data.respuesta === 'confirmado' ? 'Cliente confirmó, va en camino' : 'El cliente no puede venir'
            )
          }
        })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(intervalo)
  }, [avisoResultado])

  const cambiarEstado = async () => {
    const nuevoEstado = estado === 'disponible' ? 'ocupado' : 'disponible'
    setActualizandoEstado(true)
    setEstado(nuevoEstado)
    try {
      const res = await fetch('/api/barbero-estado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
    } catch (err) {
      toast.error(err.message)
      setEstado(estado)
    } finally {
      setActualizandoEstado(false)
    }
  }

  const horaActual = () =>
    new Date().toLocaleTimeString('es-CO', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

  const registrarWalkIn = async (conNombre) => {
    setGuardandoWalkIn(true)
    try {
      const body = { fecha: hoyColombia(), hora: horaActual() }
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
      setEstado('ocupado')
      setModalWalkIn(false)
      setWalkInNombre('')
      setWalkInTelefono('')
      cargarCitasHoy()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardandoWalkIn(false)
    }
  }

  const avisarSiguiente = async () => {
    setAvisando(true)
    setAvisoResultado(null)
    try {
      const res = await fetch('/api/citas?accion=avisar-siguiente', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.mensaje) {
        toast.info(data.mensaje)
        setAvisoResultado({ mensaje: data.mensaje })
      } else {
        const tel = data.cita.cliente_telefono.replace(/\D/g, '')
        const texto = encodeURIComponent(
          `✂️ ¡Hola ${data.cita.cliente_nombre}! 👋 Tu turno en la barbería está por comenzar a las ${data.cita.hora} ⏰. ¿Confirmas que llegas en los próximos 10-15 minutos? 🙌`
        )
        const link = `https://wa.me/57${tel}?text=${texto}`
        setAvisoResultado({
          cita: data.cita,
          link,
          notificacion_id: data.notificacion_id,
          respuesta: null,
        })
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAvisando(false)
    }
  }

  const subirFoto = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setSubiendo(true)
    try {
      const resSubida = await fetch(
        `/api/subir-imagen?filename=${encodeURIComponent(archivo.name)}`,
        { method: 'POST', body: archivo }
      )
      const dataSubida = await resSubida.json()
      if (!resSubida.ok) throw new Error(dataSubida.error)

      const res = await fetch('/api/galeria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen_url: dataSubida.url, descripcion: descripcion.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success('Foto agregada a tu galería')
      setDescripcion('')
      cargarFotos()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubiendo(false)
      e.target.value = ''
    }
  }

  const borrarFoto = async () => {
    if (!aBorrar) return
    try {
      const res = await fetch('/api/galeria', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: aBorrar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Foto eliminada')
      setABorrar(null)
      cargarFotos()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const cambiarPassword = async () => {
    if (!passwordActual || !passwordNueva) {
      toast.error('Completa ambos campos')
      return
    }
    if (passwordNueva.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    setCambiando(true)
    try {
      const res = await fetch('/api/auth?action=barbero-cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordActual, passwordNueva }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Contraseña actualizada')
      setModalPassword(false)
      setPasswordActual('')
      setPasswordNueva('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCambiando(false)
    }
  }

  if (cargandoAuth || !barbero) return null

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-xl font-bold">Mi panel</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setModalPassword(true)}
            className={`${chip} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`}
          >
            <KeyRound size={14} />
            Contraseña
          </button>
          <button
            onClick={() => { logoutBarbero(); navigate('/barbero-login') }}
            className={`${chip} bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300`}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* ---- Estado y acciones del día ---- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium">Tu estado</h2>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              estado === 'disponible'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {estado === 'disponible' ? 'Disponible' : 'Ocupado'}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Marca tu estado, registra clientes sin cita (walk-in), y avisa al siguiente cuando estés por desocuparte.
        </p>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={cambiarEstado}
            disabled={actualizandoEstado}
            className={`${chipGrande} bg-gray-900 dark:bg-gray-700 text-white`}
          >
            {actualizandoEstado ? (
              <CargandoTijera texto={null} size={18} className="text-white" />
            ) : (
              <Power size={18} />
            )}
            <span>{estado === 'disponible' ? 'Marcar ocupado' : 'Marcar disponible'}</span>
          </button>

          <button
            onClick={() => registrarWalkIn(false)}
            disabled={guardandoWalkIn}
            className={`${chipGrande} bg-blue-600 text-white`}
          >
            {guardandoWalkIn ? (
              <CargandoTijera texto={null} size={18} className="text-white" />
            ) : (
              <UserPlus size={18} />
            )}
            <span>Walk-in rápido</span>
          </button>

          <button
            onClick={() => setModalWalkIn(true)}
            className={`${chipGrande} border border-blue-600 text-blue-600 dark:text-blue-400`}
          >
            <ClipboardPlus size={18} />
            <span>Con nombre</span>
          </button>
        </div>

        {(() => {
          const siguiente = citasHoy.find((c) => c.tipo === 'agendada' && c.estado !== 'atendida')
          return siguiente ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              Siguiente en la fila: <strong>{siguiente.cliente_nombre}</strong> (cita de las {siguiente.hora})
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
              No tienes más citas agendadas hoy
            </p>
          )
        })()}

        <button
          onClick={avisarSiguiente}
          disabled={avisando}
          className={`${chipGrande} w-full mt-2 bg-amber-500 text-white`}
        >
          {avisando ? (
            <CargandoTijera texto={null} size={18} className="text-white" />
          ) : (
            <Bell size={18} />
          )}
          <span>Avisar siguiente</span>
        </button>

        {avisoResultado && !avisoResultado.mensaje && (
          <div className="mt-3 text-xs bg-amber-50 dark:bg-amber-950/40 rounded-lg p-3">
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
              <p className="text-gray-400 dark:text-gray-500 text-center">Esperando respuesta...</p>
            )}
          </div>
        )}
      </div>

      {/* ---- Citas de hoy (solo las mías) ---- */}
      <h2 className="text-sm font-medium mb-2">Tus citas de hoy</h2>
      {cargandoCitas && (
        <div className="space-y-2 mb-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow p-3">
              <div className="h-3 w-16 rounded skeleton-shimmer mb-2" />
              <div className="h-3 w-32 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      )}
      {!cargandoCitas && citasHoy.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">No tienes citas para hoy.</p>
      )}
      {!cargandoCitas && citasHoy.length > 0 && (
        <div className="space-y-2 mb-6">
          {citasHoy.map((c) => (
            <div key={c.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex justify-between items-center ${c.estado === 'atendida' ? 'opacity-50' : ''}`}>
              <div>
                <div className="font-semibold text-sm">{c.hora}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {c.cliente_nombre || 'Sin registro'}
                  {c.cliente_telefono && <span className="text-gray-400 dark:text-gray-500"> · {c.cliente_telefono}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${c.tipo === 'walk_in' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {c.tipo === 'walk_in' ? 'Sin cita' : 'Agendada'}
                </span>
                {c.estado === 'atendida' ? (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    <Check size={12} /> Atendida
                  </span>
                ) : (
                  <button
                    onClick={() => marcarAtendida(c.id)}
                    disabled={marcandoId === c.id}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 transition active:scale-95 disabled:opacity-50"
                  >
                    {marcandoId === c.id ? (
                      <CargandoTijera texto={null} size={12} className="text-white dark:text-gray-900" />
                    ) : (
                      <Check size={12} />
                    )}
                    Atendida
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Perfil (resumen) ---- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
          {fotoPerfil ? (
            <img src={fotoPerfil} alt="Tu foto de perfil" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-gray-400 dark:text-gray-500" />
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">
          Foto, nombre, alias, especialidad y WhatsApp de contacto.
        </p>
        <button
          onClick={() => navigate('/barbero-perfil')}
          className={`${chip} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0`}
        >
          Editar perfil
        </button>
      </div>

      {/* ---- Galería de trabajos ---- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <h2 className="text-sm font-semibold mb-1">Tu portafolio de trabajos</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Sube fotos de los cortes que has hecho. Los clientes las ven en Inicio antes de agendar —
          es tu vitrina para mostrar tu estilo y atraer más citas.
        </p>
        <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <ImagePlus size={14} /> Agregar nueva foto
        </label>
        <input
          type="text"
          placeholder="Descripción (opcional, ej: Corte fade)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mb-2"
        />
        <input
          type="file"
          accept="image/*"
          onChange={subirFoto}
          disabled={subiendo}
          className="text-xs w-full"
        />
        {subiendo && (
          <div className="mt-1">
            <CargandoTijera texto="Subiendo foto..." size={12} />
          </div>
        )}
      </div>

      {cargando && (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-lg skeleton-shimmer" />
          ))}
        </div>
      )}

      {!cargando && fotos.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no has subido fotos.</p>
      )}

      {!cargando && fotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {fotos.map((f) => (
            <div key={f.id} className="group">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <img src={f.imagen_url} alt={f.descripcion || 'Trabajo'} className="w-full h-full object-cover" />
                <button
                  onClick={() => setABorrar(f.id)}
                  aria-label="Eliminar"
                  className="absolute top-1 right-1 flex items-center justify-center w-7 h-7 rounded-lg bg-black/60 text-white transition active:scale-95"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {f.descripcion && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate" title={f.descripcion}>
                  {f.descripcion}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---- Reseñas ---- */}
      <h2 className="text-sm font-medium mb-2">
        Tus reseñas {promedio && `— ${promedio} ⭐ (${resenas.length})`}
      </h2>
      {resenas.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no tienes reseñas.</p>
      ) : (
        <div className="space-y-3">
          {resenas.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{r.cliente_nombre}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={13}
                      className={n <= r.calificacion ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}
                    />
                  ))}
                </div>
              </div>
              {r.comentario && <p className="text-sm text-gray-600 dark:text-gray-400">{r.comentario}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ---- Modales ---- */}
      <Modal open={modalWalkIn} onClose={() => setModalWalkIn(false)} title="Registrar walk-in con nombre">
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nombre"
            value={walkInNombre}
            onChange={(e) => setWalkInNombre(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="tel"
            placeholder="Teléfono (opcional)"
            value={walkInTelefono}
            onChange={(e) => setWalkInTelefono(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => registrarWalkIn(true)}
            disabled={guardandoWalkIn || !walkInNombre.trim()}
            className="w-full bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {guardandoWalkIn ? <CargandoTijera texto="Guardando..." size={14} className="text-white" /> : 'Registrar'}
          </button>
        </div>
      </Modal>

      <Modal open={aBorrar != null} onClose={() => setABorrar(null)} title="Eliminar foto">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">¿Seguro que quieres eliminar esta foto?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={borrarFoto}
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

      <Modal open={modalPassword} onClose={() => setModalPassword(false)} title="Cambiar contraseña">
        <div className="space-y-2">
          <input
            type="password"
            placeholder="Contraseña actual"
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Nueva contraseña (mín. 6 caracteres)"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={cambiarPassword}
            disabled={cambiando}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {cambiando ? (
              <CargandoTijera texto="Guardando..." size={14} className="text-white dark:text-gray-900" />
            ) : (
              'Actualizar contraseña'
            )}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default BarberoGaleria
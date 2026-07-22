import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Trash2, ImagePlus, KeyRound, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'

function BarberoGaleria() {
  const { barbero, logoutBarbero } = useAuth()
  const navigate = useNavigate()
  const [fotos, setFotos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [aBorrar, setABorrar] = useState(null)
  const [modalPassword, setModalPassword] = useState(false)
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [cambiando, setCambiando] = useState(false)
  const [resenas, setResenas] = useState([])
  const [promedio, setPromedio] = useState(null)
  const [subiendoPerfil, setSubiendoPerfil] = useState(false)
  const [fotoPerfil, setFotoPerfil] = useState(null)
  const [nombre, setNombre] = useState('')
  const [alias, setAlias] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)

  useEffect(() => {
    if (!barbero) {
      navigate('/barbero-login')
      return
    }
  }, [barbero, navigate])

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
          setNombre(yo.nombre || '')
          setAlias(yo.alias || '')
          setEspecialidad(yo.especialidad || '')
        }
      })
      .catch(() => {})
  }, [barbero])

  useEffect(() => {
    cargarFotos()
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

  const guardarPerfil = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre no puede quedar vacío')
      return
    }
    setGuardandoPerfil(true)
    try {
      const res = await fetch('/api/galeria?accion=perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          alias: alias.trim(),
          especialidad: especialidad.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Perfil actualizado')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardandoPerfil(false)
    }
  }

  const subirFotoPerfil = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setSubiendoPerfil(true)
    try {
      const resSubida = await fetch(
        `/api/subir-imagen?filename=${encodeURIComponent(archivo.name)}`,
        { method: 'POST', body: archivo }
      )
      const dataSubida = await resSubida.json()
      if (!resSubida.ok) throw new Error(dataSubida.error)

      const res = await fetch('/api/galeria?accion=perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen_url: dataSubida.url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setFotoPerfil(data.foto)
      toast.success('Foto de perfil actualizada')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubiendoPerfil(false)
      e.target.value = ''
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

  if (!barbero) return null

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Mi galería de trabajos</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setModalPassword(true)}
            className="flex items-center gap-1 text-sm text-blue-600 underline"
          >
            <KeyRound size={14} />
            Cambiar contraseña
          </button>
          <button
            onClick={() => { logoutBarbero(); navigate('/barbero-login') }}
            className="text-sm text-gray-500 dark:text-gray-400 underline"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Tu foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus size={22} className="text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Foto de perfil (la que ven tus clientes en Inicio)</p>
            <input
              type="file"
              accept="image/*"
              onChange={subirFotoPerfil}
              disabled={subiendoPerfil}
              className="text-xs w-full"
            />
            {subiendoPerfil && (
              <div className="mt-1">
                <CargandoTijera texto="Subiendo foto..." />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Alias (opcional, se muestra en vez del nombre si lo llenas)</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: El Maestro"
              className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Especialidad / descripción</label>
            <textarea
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              rows={2}
              placeholder="Ej: Especialista en fade y diseños"
              className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
          <button
            onClick={guardarPerfil}
            disabled={guardandoPerfil}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {guardandoPerfil ? <CargandoTijera texto="Guardando..." size={14} className="text-white" /> : 'Guardar perfil'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
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
            <CargandoTijera texto="Subiendo foto..." />
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
        <div className="grid grid-cols-3 gap-2">
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

      <h2 className="text-sm font-medium mb-2 mt-8">
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
                      className={n <= r.calificacion ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
              </div>
              {r.comentario && <p className="text-sm text-gray-600 dark:text-gray-400">{r.comentario}</p>}
            </div>
          ))}
        </div>
      )}

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
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition active:scale-95"
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
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {cambiando ? <CargandoTijera texto="Guardando..." size={14} className="text-white" /> : 'Actualizar contraseña'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default BarberoGaleria
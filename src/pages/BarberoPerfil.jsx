import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ImagePlus, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CargandoTijera from '../components/CargandoTijera.jsx'

function BarberoPerfil() {
  const { barbero, cargando: cargandoAuth } = useAuth()
  const navigate = useNavigate()

  const [fotoPerfil, setFotoPerfil] = useState(null)
  const [nombre, setNombre] = useState('')
  const [alias, setAlias] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [subiendoPerfil, setSubiendoPerfil] = useState(false)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)

  useEffect(() => {
    if (cargandoAuth) return
    if (!barbero) {
      navigate('/barbero-login')
    }
  }, [barbero, cargandoAuth, navigate])

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
          setWhatsapp(yo.whatsapp || '')
        }
      })
      .catch(() => {})
  }, [barbero])

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

      setFotoPerfil(data.perfil.foto)
      toast.success('Foto de perfil actualizada')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubiendoPerfil(false)
      e.target.value = ''
    }
  }

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
          whatsapp: whatsapp.replace(/\D/g, ''),
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

  if (cargandoAuth || !barbero) return null

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto">
      <button
        onClick={() => navigate('/barbero-galeria')}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4"
      >
        <ArrowLeft size={14} />
        Volver a mi panel
      </button>

      <h1 className="text-xl font-bold mb-4">Editar perfil</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
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
                <CargandoTijera texto="Subiendo foto..." size={12} />
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
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              WhatsApp de contacto (opcional — tus clientes podrán escribirte directo)
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ej: 3001234567"
              className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={guardarPerfil}
            disabled={guardandoPerfil}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {guardandoPerfil ? (
              <CargandoTijera texto="Guardando..." size={14} className="text-white dark:text-gray-900" />
            ) : (
              'Guardar perfil'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BarberoPerfil
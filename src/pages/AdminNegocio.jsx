import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ImagePlus, MapPin } from 'lucide-react'
import { IconoWhatsApp, IconoInstagram, IconoFacebook, IconoYouTube } from '../components/IconosRedes.jsx'
import { useAuth } from '../context/AuthContext'
import CargandoTijera from '../components/CargandoTijera.jsx'

function AdminNegocio() {
  const { admin } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [eslogan, setEslogan] = useState('')
  const [direccion, setDireccion] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [fotoUbicacionUrl, setFotoUbicacionUrl] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [mapaUrl, setMapaUrl] = useState('')
  const [whatsappNegocio, setWhatsappNegocio] = useState('')
  const [youtube, setYoutube] = useState('')

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login')
    }
  }, [admin, navigate])

  useEffect(() => {
    fetch('/api/negocio')
      .then((res) => res.json())
      .then((data) => {
        const n = data.negocio || {}
        setNombre(n.nombre || '')
        setEslogan(n.eslogan || '')
        setDireccion(n.direccion || '')
        setLogoUrl(n.logo_url || '')
        setFotoUbicacionUrl(n.foto_ubicacion_url || '')
        setInstagram(n.instagram || '')
        setFacebook(n.facebook || '')
        setTiktok(n.tiktok || '')
        setMapaUrl(n.mapa_url || '')
        setWhatsappNegocio(n.whatsapp || '')
        setYoutube(n.youtube || '')
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }, [])

  const subirImagen = async (e, setter, setSubiendo) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setSubiendo(true)
    try {
      const res = await fetch(`/api/subir-imagen?filename=${encodeURIComponent(archivo.name)}`, {
        method: 'POST',
        body: archivo,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setter(data.url)
      toast.success('Imagen subida')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubiendo(false)
      e.target.value = ''
    }
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      const res = await fetch('/api/negocio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          eslogan: eslogan.trim(),
          direccion: direccion.trim(),
          logo_url: logoUrl,
          foto_ubicacion_url: fotoUbicacionUrl,
          instagram: instagram.trim(),
          facebook: facebook.trim(),
          tiktok: tiktok.trim(),
          mapa_url: mapaUrl.trim(),
          whatsapp: whatsappNegocio.replace(/\D/g, ''),
          youtube: youtube.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Información del negocio actualizada')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-3">
        <div className="h-24 rounded-xl skeleton-shimmer" />
        <div className="h-24 rounded-xl skeleton-shimmer" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Información del negocio</h1>
        <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 dark:text-gray-400 underline">
          Volver al panel
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold">Identidad</h2>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus size={20} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Logotipo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => subirImagen(e, setLogoUrl, setSubiendoLogo)}
              disabled={subiendoLogo}
              className="text-xs w-full"
            />
            {subiendoLogo && <CargandoTijera texto="Subiendo..." size={12} />}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nombre de la barbería</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Eslogan</label>
          <input
            type="text"
            value={eslogan}
            onChange={(e) => setEslogan(e.target.value)}
            placeholder="Ej: Tu estilo, nuestra pasión"
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-1">
          <MapPin size={14} /> Ubicación
        </h2>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Dirección</label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ej: Calle 10 #5-23, Bogotá"
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
            Link de Google Maps (opcional, botón "Cómo llegar")
          </label>
          <input
            type="text"
            value={mapaUrl}
            onChange={(e) => setMapaUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Foto de referencia del lugar (opcional)</label>
          {fotoUbicacionUrl && (
            <img src={fotoUbicacionUrl} alt="Ubicación" className="w-full h-32 object-cover rounded-lg mb-2" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => subirImagen(e, setFotoUbicacionUrl, setSubiendoFoto)}
            disabled={subiendoFoto}
            className="text-xs w-full"
          />
          {subiendoFoto && <CargandoTijera texto="Subiendo..." size={12} />}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold">Redes sociales</h2>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
            <IconoInstagram size={13} /> Instagram (URL completa)
          </label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/tubarberia"
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
            <IconoFacebook size={13} /> Facebook (URL completa)
          </label>
          <input
            type="text"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="https://facebook.com/tubarberia"
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">TikTok (URL completa)</label>
          <input
            type="text"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="https://tiktok.com/@tubarberia"
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
            <IconoYouTube size={13} /> YouTube (URL completa)
          </label>
          <input
            type="text"
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://youtube.com/@tubarberia"
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
            <IconoWhatsApp size={13} /> WhatsApp general (para consultas, sin barbero asignado)
          </label>
          <input
            type="tel"
            value={whatsappNegocio}
            onChange={(e) => setWhatsappNegocio(e.target.value)}
            placeholder="Ej: 3001234567"
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        onClick={guardar}
        disabled={guardando}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2.5 text-sm font-medium transition active:scale-95 disabled:opacity-50"
      >
        {guardando ? <CargandoTijera texto="Guardando..." size={14} className="text-white dark:text-gray-900" /> : 'Guardar cambios'}
      </button>
    </div>
  )
}

export default AdminNegocio
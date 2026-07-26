import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2, Plus, ImagePlus, X, Scissors } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'
import { convertirSiHeic } from '../lib/imagenes.js'

function BarberoEstilos() {
  const { barbero, cargando: cargandoAuth } = useAuth()
  const navigate = useNavigate()

  const [estilos, setEstilos] = useState([])
  const [cargando, setCargando] = useState(true)

  const [modalEstilo, setModalEstilo] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [portadaUrl, setPortadaUrl] = useState('')
  const [subiendoPortada, setSubiendoPortada] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [aBorrar, setABorrar] = useState(null)

  const [imagenesExtra, setImagenesExtra] = useState([])
  const [subiendoExtra, setSubiendoExtra] = useState(false)

  useEffect(() => {
    if (cargandoAuth) return
    if (!barbero) navigate('/barbero-login')
  }, [barbero, cargandoAuth, navigate])

  const cargarEstilos = () => {
    fetch('/api/galeria?recurso=estilo')
      .then((res) => res.json())
      .then((data) => {
        setEstilos(data.estilos || [])
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }

  useEffect(() => {
    if (barbero) cargarEstilos()
  }, [barbero])

  const abrirNuevo = () => {
    setEditandoId(null)
    setNombre('')
    setDescripcion('')
    setPortadaUrl('')
    setImagenesExtra([])
    setModalEstilo(true)
  }

  const cargarImagenesExtra = (estiloId) => {
    fetch(`/api/galeria?recurso=estilo-imagen&estilo_id=${estiloId}`)
      .then((res) => res.json())
      .then((data) => setImagenesExtra(data.imagenes || []))
      .catch(() => {})
  }

  const abrirEditar = (e) => {
    setEditandoId(e.id)
    setNombre(e.nombre)
    setDescripcion(e.descripcion || '')
    setPortadaUrl(e.portada_url || '')
    cargarImagenesExtra(e.id)
    setModalEstilo(true)
  }

  const subirPortada = async (e) => {
    const archivoOriginal = e.target.files[0]
    if (!archivoOriginal) return
    setSubiendoPortada(true)
    try {
      const archivo = await convertirSiHeic(archivoOriginal)
      const res = await fetch(`/api/subir-imagen?filename=${encodeURIComponent(archivo.name)}`, {
        method: 'POST',
        body: archivo,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPortadaUrl(data.url)
      toast.success('Portada subida')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubiendoPortada(false)
    }
  }

  const subirFotoExtra = async (e) => {
    const archivoOriginal = e.target.files[0]
    if (!archivoOriginal || !editandoId) return
    if (imagenesExtra.length >= 5) {
      toast.error('Ya tiene el máximo de 5 fotos')
      return
    }
    setSubiendoExtra(true)
    try {
      const archivo = await convertirSiHeic(archivoOriginal)
      const resSubida = await fetch(`/api/subir-imagen?filename=${encodeURIComponent(archivo.name)}`, {
        method: 'POST',
        body: archivo,
      })
      const dataSubida = await resSubida.json()
      if (!resSubida.ok) throw new Error(dataSubida.error)

      const res = await fetch('/api/galeria?recurso=estilo-imagen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estilo_id: editandoId, imagen_url: dataSubida.url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Foto agregada')
      cargarImagenesExtra(editandoId)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubiendoExtra(false)
      e.target.value = ''
    }
  }

  const borrarImagenExtra = async (id) => {
    try {
      const res = await fetch('/api/galeria?recurso=estilo-imagen', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImagenesExtra((prev) => prev.filter((img) => img.id !== id))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const guardarEstilo = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setGuardando(true)
    try {
      const esEdicion = editandoId != null
      const res = await fetch('/api/galeria?recurso=estilo', {
        method: esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editandoId,
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          portada_url: portadaUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(esEdicion ? 'Estilo actualizado' : 'Estilo creado')
      setModalEstilo(false)
      cargarEstilos()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const borrarEstilo = async () => {
    if (!aBorrar) return
    try {
      const res = await fetch('/api/galeria?recurso=estilo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: aBorrar.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Estilo eliminado')
      setABorrar(null)
      cargarEstilos()
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (cargandoAuth || !barbero) return null

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/barbero-galeria')}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4"
      >
        <ArrowLeft size={14} />
        Volver a mi panel
      </button>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Mis estilos de corte</h1>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-1 text-xs font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full px-3 py-1.5 transition active:scale-95"
        >
          <Plus size={13} /> Nuevo
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Publica los estilos que sabes hacer — tus clientes los ven en el look-book y pueden agendar directo contigo.
      </p>

      {cargando && (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => <div key={i} className="aspect-square rounded-xl skeleton-shimmer" />)}
        </div>
      )}

      {!cargando && estilos.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500">Aún no has publicado ningún estilo.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {estilos.map((e) => (
          <div key={e.id} className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {e.portada_url ? (
                <img src={e.portada_url} alt={e.nombre} className="w-full h-full object-cover" />
              ) : (
                <Scissors size={28} className="text-gray-400" />
              )}
            </div>
            <div className="p-2">
              <p className="text-sm font-medium truncate">{e.nombre}</p>
              <div className="flex gap-1.5 mt-1.5">
                <button
                  onClick={() => abrirEditar(e)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1.5"
                >
                  <Pencil size={12} /> Editar
                </button>
                <button
                  onClick={() => setABorrar(e)}
                  className="flex items-center justify-center w-8 rounded-lg bg-red-100 text-red-700"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalEstilo} onClose={() => setModalEstilo(false)} title={editandoId ? 'Editar estilo' : 'Nuevo estilo'}>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nombre (ej: Fade bajo)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none"
          />

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Foto de portada</label>
            {portadaUrl && (
              <img src={portadaUrl} alt="Portada" className="w-20 h-20 object-cover rounded-lg mb-2" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={subirPortada}
              disabled={subiendoPortada}
              className="text-xs w-full"
            />
            {subiendoPortada && <CargandoTijera texto="Subiendo..." size={12} />}
          </div>

          {editandoId && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                Fotos adicionales (hasta 5) — {imagenesExtra.length}/5
              </label>
              {imagenesExtra.length > 0 && (
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {imagenesExtra.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded overflow-hidden">
                      <img src={img.imagen_url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => borrarImagenExtra(img.id)}
                        className="absolute top-0.5 right-0.5 flex items-center justify-center w-4 h-4 rounded bg-black/60 text-white"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {imagenesExtra.length < 5 && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={subirFotoExtra}
                    disabled={subiendoExtra}
                    className="text-xs w-full"
                  />
                  {subiendoExtra && <CargandoTijera texto="Subiendo..." size={12} />}
                </>
              )}
            </div>
          )}

          {!editandoId && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Guarda el estilo primero; luego podrás agregarle hasta 5 fotos adicionales.
            </p>
          )}

          <button
            onClick={guardarEstilo}
            disabled={guardando}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {guardando ? <CargandoTijera texto="Guardando..." size={14} className="text-white dark:text-gray-900" /> : editandoId ? 'Guardar cambios' : 'Crear estilo'}
          </button>
        </div>
      </Modal>

      <Modal open={aBorrar != null} onClose={() => setABorrar(null)} title="Eliminar estilo">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ¿Eliminar <strong>{aBorrar?.nombre}</strong> y todas sus fotos?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={borrarEstilo} className="bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95">
            Sí, eliminar
          </button>
          <button onClick={() => setABorrar(null)} className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition active:scale-95">
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default BarberoEstilos
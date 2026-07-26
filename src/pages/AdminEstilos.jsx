import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Scissors, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'

function AdminEstilos() {
  const { admin } = useAuth()
  const navigate = useNavigate()

  const [estilos, setEstilos] = useState([])
  const [barberos, setBarberos] = useState([])
  const [cargando, setCargando] = useState(true)

  const [modalEstilo, setModalEstilo] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [portadaUrl, setPortadaUrl] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [aBorrar, setABorrar] = useState(null)

  const [modalBarberos, setModalBarberos] = useState(null)

  useEffect(() => {
    if (!admin) navigate('/admin-login')
  }, [admin, navigate])

  const cargarTodo = () => {
    Promise.all([
      fetch('/api/admin?action=estilos').then((r) => r.json()),
      fetch('/api/barberos').then((r) => r.json()),
    ])
      .then(([dataEstilos, dataBarberos]) => {
        setEstilos(dataEstilos.estilos || [])
        setBarberos(dataBarberos || [])
        setCargando(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargando(false)
      })
  }

  useEffect(() => {
    if (admin) cargarTodo()
  }, [admin])

  const abrirNuevo = () => {
    setEditandoId(null)
    setNombre('')
    setDescripcion('')
    setPortadaUrl('')
    setModalEstilo(true)
  }

  const abrirEditar = (e) => {
    setEditandoId(e.id)
    setNombre(e.nombre)
    setDescripcion(e.descripcion || '')
    setPortadaUrl(e.portada_url || '')
    setModalEstilo(true)
  }

  const subirPortada = async (e) => {
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
      setPortadaUrl(data.url)
      toast.success('Portada subida')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubiendo(false)
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
      const res = await fetch('/api/admin?action=estilos', {
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
      cargarTodo()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const borrarEstilo = async () => {
    if (!aBorrar) return
    try {
      const res = await fetch('/api/admin?action=estilos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: aBorrar.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Estilo eliminado')
      setABorrar(null)
      cargarTodo()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const toggleBarbero = async (estilo, barberoId, yaAsignado) => {
    try {
      const res = await fetch('/api/admin?action=estilo-asignar-barbero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estilo_id: estilo.id, barbero_id: barberoId, asignar: !yaAsignado }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      cargarTodo()
      setModalBarberos((prev) => prev && { ...prev }) // refresca referencia
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Estilos de corte (todos)</h1>
        <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 dark:text-gray-400 underline">
          Volver al panel
        </button>
      </div>

      <button
        onClick={abrirNuevo}
        className="flex items-center gap-1 text-xs font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full px-3 py-1.5 transition active:scale-95 mb-4"
      >
        <Plus size={13} /> Nuevo estilo
      </button>

      {cargando && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl skeleton-shimmer" />)}
        </div>
      )}

      <div className="space-y-2">
        {estilos.map((e) => (
          <div key={e.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
              {e.portada_url ? (
                <img src={e.portada_url} alt={e.nombre} className="w-full h-full object-cover" />
              ) : (
                <Scissors size={18} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{e.nombre}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {e.barberos?.length > 0 ? e.barberos.map((b) => b.alias || b.nombre).join(', ') : 'Sin barberos asignados'}
                {e.creado_por_barbero_id && ' · creado por barbero'}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => setModalBarberos(e)}
                aria-label="Asignar barberos"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              >
                <Users size={14} />
              </button>
              <button
                onClick={() => abrirEditar(e)}
                aria-label="Editar"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setABorrar(e)}
                aria-label="Eliminar"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-700"
              >
                <Trash2 size={14} />
              </button>
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
            {portadaUrl && <img src={portadaUrl} alt="Portada" className="w-20 h-20 object-cover rounded-lg mb-2" />}
            <input type="file" accept="image/*" onChange={subirPortada} disabled={subiendo} className="text-xs w-full" />
            {subiendo && <CargandoTijera texto="Subiendo..." size={12} />}
          </div>
          <button
            onClick={guardarEstilo}
            disabled={guardando}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {guardando ? <CargandoTijera texto="Guardando..." size={14} className="text-white dark:text-gray-900" /> : editandoId ? 'Guardar cambios' : 'Crear estilo'}
          </button>
        </div>
      </Modal>

      <Modal open={modalBarberos != null} onClose={() => setModalBarberos(null)} title="¿Quién hace este corte?">
        <div className="space-y-2">
          {barberos.map((b) => {
            const estiloActual = estilos.find((e) => e.id === modalBarberos?.id)
            const yaAsignado = estiloActual?.barberos?.some((be) => be.id === b.id)
            return (
              <label key={b.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                <input
                  type="checkbox"
                  checked={!!yaAsignado}
                  onChange={() => toggleBarbero(estiloActual, b.id, yaAsignado)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{b.alias || b.nombre}</span>
              </label>
            )
          })}
        </div>
      </Modal>

      <Modal open={aBorrar != null} onClose={() => setABorrar(null)} title="Eliminar estilo">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">¿Eliminar <strong>{aBorrar?.nombre}</strong>?</p>
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

export default AdminEstilos
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Gift, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal.jsx'
import CargandoTijera from '../components/CargandoTijera.jsx'

function AdminPremios() {
  const { admin } = useAuth()
  const navigate = useNavigate()

  const [premios, setPremios] = useState([])
  const [cargandoPremios, setCargandoPremios] = useState(true)
  const [clientes, setClientes] = useState([])
  const [cargandoClientes, setCargandoClientes] = useState(true)

  const [modalPremio, setModalPremio] = useState(false)
  const [premioEditandoId, setPremioEditandoId] = useState(null)
  const [cortesRequeridos, setCortesRequeridos] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [premioABorrar, setPremioABorrar] = useState(null)

  const [entregandoId, setEntregandoId] = useState(null)

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login')
    }
  }, [admin, navigate])

  const cargarPremios = () => {
    fetch('/api/admin?action=premios')
      .then((res) => res.json())
      .then((data) => {
        setPremios(data.premios || [])
        setCargandoPremios(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargandoPremios(false)
      })
  }

  const cargarClientes = () => {
    fetch('/api/admin?action=clientes')
      .then((res) => res.json())
      .then((data) => {
        const ordenados = (data.clientes || []).sort((a, b) => b.cortes_contador - a.cortes_contador)
        setClientes(ordenados)
        setCargandoClientes(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setCargandoClientes(false)
      })
  }

  useEffect(() => {
    if (admin) {
      cargarPremios()
      cargarClientes()
    }
  }, [admin])

  const maximoRequerido = (contador) => {
    const elegibles = premios.filter((p) => p.activo && contador >= p.cortes_requeridos)
    if (elegibles.length === 0) return null
    return elegibles.reduce((max, p) => (p.cortes_requeridos > max.cortes_requeridos ? p : max))
  }

  const abrirNuevoPremio = () => {
    setPremioEditandoId(null)
    setCortesRequeridos('')
    setDescripcion('')
    setModalPremio(true)
  }

  const abrirEditarPremio = (p) => {
    setPremioEditandoId(p.id)
    setCortesRequeridos(String(p.cortes_requeridos))
    setDescripcion(p.descripcion)
    setModalPremio(true)
  }

  const guardarPremio = async () => {
    if (!cortesRequeridos || !descripcion.trim()) {
      toast.error('Completa cortes requeridos y descripción')
      return
    }
    setGuardando(true)
    try {
      const esEdicion = premioEditandoId != null
      const res = await fetch('/api/admin?action=premios', {
        method: esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: premioEditandoId,
          cortes_requeridos: Number(cortesRequeridos),
          descripcion: descripcion.trim(),
          activo: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(esEdicion ? 'Premio actualizado' : 'Premio creado')
      setModalPremio(false)
      cargarPremios()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const borrarPremio = async () => {
    if (!premioABorrar) return
    try {
      const res = await fetch('/api/admin?action=premios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: premioABorrar.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Premio eliminado')
      setPremioABorrar(null)
      cargarPremios()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const entregarPremio = async (cliente) => {
    setEntregandoId(cliente.id)
    try {
      const res = await fetch('/api/admin?action=premio-entregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: cliente.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Premio entregado a ${cliente.nombre}, contador reiniciado`)
      cargarClientes()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEntregandoId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Programa de premios</h1>
        <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 dark:text-gray-400 underline">
          Volver al panel
        </button>
      </div>

      {/* ---- Niveles de premio ---- */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold flex items-center gap-1">
          <Gift size={14} /> Niveles de premio
        </h2>
        <button
          onClick={abrirNuevoPremio}
          className="flex items-center gap-1 text-xs font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full px-3 py-1.5 transition active:scale-95"
        >
          <Plus size={13} /> Nuevo
        </button>
      </div>

      {cargandoPremios && (
        <div className="space-y-2 mb-6">
          {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl skeleton-shimmer" />)}
        </div>
      )}

      {!cargandoPremios && premios.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Aún no has creado ningún premio.</p>
      )}

      <div className="space-y-2 mb-8">
        {premios.map((p) => (
          <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">{p.descripcion}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Cada {p.cortes_requeridos} cortes</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => abrirEditarPremio(p)}
                aria-label="Editar"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition active:scale-95"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setPremioABorrar(p)}
                aria-label="Eliminar"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-700 transition active:scale-95"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ---- Progreso de clientes ---- */}
      <h2 className="text-sm font-semibold mb-2">Progreso de clientes</h2>

      {cargandoClientes && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl skeleton-shimmer" />)}
        </div>
      )}

      {!cargandoClientes && clientes.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500">Aún no hay clientes registrados.</p>
      )}

      <div className="space-y-2">
        {clientes.map((c) => {
          const premioListo = maximoRequerido(c.cortes_contador || 0)
          return (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">{c.nombre}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {c.cortes_contador || 0} {c.cortes_contador === 1 ? 'corte' : 'cortes'}
                  {premioListo && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                      → {premioListo.descripcion}
                    </span>
                  )}
                </div>
              </div>
              {premioListo && (
                <button
                  onClick={() => entregarPremio(c)}
                  disabled={entregandoId === c.id}
                  className="flex items-center gap-1 text-xs font-medium bg-green-600 text-white rounded-full px-3 py-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {entregandoId === c.id ? (
                    <CargandoTijera texto={null} size={13} className="text-white" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Entregar
                </button>
              )}
            </div>
          )
        })}
      </div>

      <Modal
        open={modalPremio}
        onClose={() => setModalPremio(false)}
        title={premioEditandoId ? 'Editar premio' : 'Nuevo premio'}
      >
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Cortes requeridos (ej: 10)"
            value={cortesRequeridos}
            onChange={(e) => setCortesRequeridos(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Descripción (ej: Corte gratis, 30% de descuento...)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={guardarPremio}
            disabled={guardando}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            {guardando ? (
              <CargandoTijera texto="Guardando..." size={14} className="text-white dark:text-gray-900" />
            ) : premioEditandoId ? (
              'Guardar cambios'
            ) : (
              'Crear premio'
            )}
          </button>
        </div>
      </Modal>

      <Modal open={premioABorrar != null} onClose={() => setPremioABorrar(null)} title="Eliminar premio">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ¿Eliminar el premio <strong>{premioABorrar?.descripcion}</strong>?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={borrarPremio}
            className="bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95"
          >
            Sí, eliminar
          </button>
          <button
            onClick={() => setPremioABorrar(null)}
            className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminPremios
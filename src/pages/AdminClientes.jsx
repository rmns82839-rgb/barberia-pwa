import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminClientes() {
  const { admin } = useAuth()
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login')
      return
    }
  }, [admin, navigate])

  useEffect(() => {
    if (!admin) return
    fetch('/api/admin?action=clientes')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setClientes(data.clientes || [])
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }, [admin])

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return ''
    try {
      const soloFecha = String(fechaStr).split('T')[0].split(' ')[0]
      const partes = soloFecha.split('-')
      if (partes.length !== 3) return soloFecha
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    } catch {
      return ''
    }
  }

  const filtrados = clientes.filter((c) => {
    const texto = busqueda.toLowerCase()
    return (
      (c.nombre?.toLowerCase().includes(texto) || false) ||
      (c.telefono?.toLowerCase().includes(texto) || false)
    )
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Clientes</h1>
        <button
          onClick={() => navigate('/admin')}
          className="text-sm text-gray-500 underline"
        >
          Volver al panel
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o teléfono"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4 text-sm"
      />

      {cargando && <p className="text-gray-500 text-sm">Cargando clientes...</p>}
      {error && <p className="text-red-500 text-sm">Error: {error}</p>}

      {!cargando && (
        <p className="text-xs text-gray-400 mb-3">
          {filtrados.length} {filtrados.length === 1 ? 'cliente' : 'clientes'}
        </p>
      )}

      <div className="space-y-2">
        {filtrados.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-lg shadow p-3 flex justify-between items-center"
          >
            <div>
              <div className="font-medium text-sm">{c.nombre || 'Sin nombre'}</div>
              <div className="text-xs text-gray-500">{c.telefono || 'Sin teléfono'}</div>
              <div className="text-xs text-gray-400">
                Desde {formatearFecha(c.creado_en)}
              </div>
            </div>
            <a
              href={`https://wa.me/57${(c.telefono || '').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-green-500 text-white rounded-full px-4 py-2 text-xs font-medium hover:bg-green-600 transition-colors"
            >
              💬 WhatsApp
            </a>
          </div>
        ))}
      </div>

      {!cargando && filtrados.length === 0 && (
        <p className="text-gray-500 text-sm">No hay clientes que coincidan.</p>
      )}
    </div>
  )
}

export default AdminClientes
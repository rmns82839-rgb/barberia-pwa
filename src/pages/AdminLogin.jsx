import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function AdminLogin() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError(null)
    if (!usuario.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña')
      return
    }
    setCargando(true)
    try {
      const res = await fetch('/api/login-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')

      localStorage.setItem('admin', JSON.stringify(data.admin))
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">Acceso administrador</h1>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={cargando}
          className="w-full bg-gray-900 text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {cargando ? 'Entrando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}

export default AdminLogin
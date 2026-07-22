import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import CargandoTijera from '../components/CargandoTijera.jsx'

function StaffLogin() {
  const [rol, setRol] = useState('barbero')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()
  const { loginBarbero, loginAdmin } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!usuario.trim() || !password) {
      toast.error('Ingresa usuario y contraseña')
      return
    }
    setCargando(true)
    try {
      const accion = rol === 'barbero' ? 'barbero-login' : 'admin-login'
      const res = await fetch(`/api/auth?action=${accion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')

      if (rol === 'barbero') {
        loginBarbero(data)
        toast.success(`¡Bienvenido, ${data.barbero.nombre}!`)
        navigate('/barbero-galeria')
      } else {
        loginAdmin(data)
        toast.success(`¡Bienvenido, ${data.admin.usuario}!`)
        navigate('/admin')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-1">Acceso staff</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Para barberos y administración.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setRol('barbero')}
          className={`rounded-lg py-2 text-sm font-medium transition ${
            rol === 'barbero'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Barbero
        </button>
        <button
          type="button"
          onClick={() => setRol('admin')}
          className={`rounded-lg py-2 text-sm font-medium transition ${
            rol === 'admin'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Administrador
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          type="submit"
          disabled={cargando}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2.5 font-medium transition active:scale-95 disabled:opacity-50"
        >
          {cargando ? (
            <CargandoTijera texto="Entrando..." size={16} className="text-white dark:text-gray-900" />
          ) : (
            'Ingresar'
          )}
        </button>
      </form>
    </div>
  )
}

export default StaffLogin
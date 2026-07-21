import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Login() {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()
  const { loginCliente } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!nombre.trim() || !telefono.trim()) {
      toast.error('Por favor ingresa tu nombre y número de WhatsApp')
      return
    }

    setCargando(true)
    try {
      const res = await fetch('/api/auth?action=cliente-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')

      loginCliente(data.cliente)
      toast.success(`¡Bienvenido, ${data.cliente.nombre}!`)
      navigate('/citas')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-2">Bienvenido</h1>
      <p className="text-sm text-gray-500 mb-4">
        Ingresa tus datos para agendar tu cita.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="tel"
          placeholder="Número de WhatsApp"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <button
          type="submit"
          disabled={cargando}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-3 py-2.5 font-medium transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {cargando && <Loader2 size={18} className="animate-spin" />}
          {cargando ? 'Entrando...' : 'Ingresar'}
        </button>
      </form>

      <div className="mt-6 border-t pt-4 text-center">
        <p className="text-sm text-gray-600">
          ¿Primera vez? No te preocupes: solo escribe tu nombre y WhatsApp arriba,
          y quedarás registrado automáticamente al ingresar.
        </p>
      </div>
    </div>
  )
}

export default Login
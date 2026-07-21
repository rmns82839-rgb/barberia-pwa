import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { loginCliente } = useAuth()

  const handleSubmit = async () => {
    setError(null)

    if (!nombre.trim() || !telefono.trim()) {
      setError('Por favor ingresa tu nombre y número de WhatsApp')
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
      navigate('/citas')
    } catch (err) {
      setError(err.message)
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

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="tel"
          placeholder="Número de WhatsApp"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
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
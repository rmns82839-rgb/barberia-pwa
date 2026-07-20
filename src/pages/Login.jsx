import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError(null)

    if (!nombre.trim() || !telefono.trim()) {
      setError('Por favor ingresa tu nombre y número de WhatsApp')
      return
    }

    setCargando(true)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')

      // Guardamos la sesión del cliente localmente
      localStorage.setItem('cliente', JSON.stringify(data.cliente))

      // Redirigimos a la sección de citas
      navigate('/citas')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">Iniciar sesión</h1>
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
          {cargando ? 'Entrando...' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}

export default Login
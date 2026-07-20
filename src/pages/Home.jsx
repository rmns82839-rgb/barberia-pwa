import { useState, useEffect } from 'react'

function Home() {
  const [barberos, setBarberos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/barberos')
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo conectar')
        return res.json()
      })
      .then((data) => {
        setBarberos(data)
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Bienvenido a la Barbería</h1>
      <p className="text-gray-600 mb-6">
        Agenda tu cita, revisa el catálogo de productos y más.
      </p>

      <h2 className="text-lg font-semibold mb-3">Nuestros barberos</h2>

      {cargando && <p className="text-gray-500">Cargando barberos...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="grid grid-cols-2 gap-4">
        {barberos.map((barbero) => (
          <div
            key={barbero.id}
            className="bg-white rounded-lg shadow p-4 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl mb-3">
              ✂️
            </div>
            <h3 className="font-semibold">{barbero.nombre}</h3>
            <span
              className={`mt-2 text-xs px-2 py-1 rounded-full ${
                barbero.estado === 'disponible'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {barbero.estado === 'disponible' ? 'Disponible' : 'Ocupado'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
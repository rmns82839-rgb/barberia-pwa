import { useState, useEffect } from 'react'
import { Gift, Scissors } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function PremiosProgreso() {
  const { cliente } = useAuth()
  const [contador, setContador] = useState(0)
  const [premios, setPremios] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!cliente) {
      setCargando(false)
      return
    }
    fetch('/api/citas?accion=mis-premios')
      .then((res) => res.json())
      .then((data) => {
        setContador(data.contador || 0)
        setPremios(data.premios || [])
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [cliente])

  if (!cliente || cargando || premios.length === 0) return null

  const disponibles = premios.filter((p) => contador >= p.cortes_requeridos)
  const siguiente = premios.find((p) => contador < p.cortes_requeridos)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
      <h2 className="text-sm font-semibold flex items-center gap-1 mb-2">
        <Gift size={14} className="text-amber-600" /> Tus premios
      </h2>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Llevas <strong>{contador}</strong> {contador === 1 ? 'corte' : 'cortes'} desde tu último premio.
      </p>

      {disponibles.length > 0 && (
        <div className="space-y-2 mb-3">
          {disponibles.map((p) => (
            <div key={p.id} className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2.5 flex items-center gap-2">
              <Gift size={16} className="text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>¡Disponible!</strong> {p.descripcion} — pídelo en tu próxima visita.
              </p>
            </div>
          ))}
        </div>
      )}

      {siguiente && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Scissors size={14} />
          Te faltan <strong>{siguiente.cortes_requeridos - contador}</strong> cortes para: {siguiente.descripcion}
        </div>
      )}
    </div>
  )
}
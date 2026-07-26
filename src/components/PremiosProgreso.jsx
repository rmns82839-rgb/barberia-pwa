import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Scissors, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function PremiosProgreso() {
  const { cliente } = useAuth()
  const [contador, setContador] = useState(0)
  const [premios, setPremios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [expandido, setExpandido] = useState(false)

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
  const totalPremios = premios.length
  const progreso = siguiente ? contador / siguiente.cortes_requeridos : 1

  return (
    <div className="relative overflow-hidden rounded-xl shadow p-3 mb-4 bg-gradient-to-br from-blue-900 via-blue-950 to-gray-900">
      {/* Botón principal - siempre visible */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -5, 5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              repeatDelay: 1.5,
              ease: 'easeInOut' 
            }}
            className="shrink-0"
          >
            <Gift size={24} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          </motion.div>
          
          <div className="flex flex-col">
            <h2 className="text-sm font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
              TUS PREMIOS
            </h2>
            <p className="text-[10px] text-blue-200/80">
              Llevas <span className="text-amber-300 font-bold">{contador}</span> {contador === 1 ? 'corte' : 'cortes'} desde tu último premio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Barra de progreso mini */}
          <div className="w-16 h-1.5 bg-blue-800/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progreso * 100, 100)}%` }}
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"
            />
          </div>
          
          <span className="text-[10px] font-medium text-amber-300 min-w-[24px]">
            {siguiente ? `${contador}/${siguiente.cortes_requeridos}` : '¡Completado!'}
          </span>

          {expandido ? (
            <ChevronUp size={16} className="text-blue-300" />
          ) : (
            <ChevronDown size={16} className="text-blue-300" />
          )}
        </div>
      </button>

      {/* Contenido expandible */}
      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-2 border-t border-blue-800/50 space-y-2.5">
              {/* Premios disponibles */}
              {disponibles.length > 0 && (
                <div className="space-y-1.5">
                  {disponibles.map((p) => (
                    <motion.div
                      key={p.id}
                      animate={{ 
                        boxShadow: ['0 0 0px rgba(251,191,36,0)', '0 0 12px rgba(251,191,36,0.3)', '0 0 0px rgba(251,191,36,0)'] 
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-400/30 rounded-lg p-2 flex items-center gap-2"
                    >
                      <Gift size={14} className="text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-100">
                        <span className="text-amber-300 font-medium">¡Disponible!</span> {p.descripcion}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Próximo premio */}
              {siguiente && (
                <div className="flex items-center justify-between gap-2 text-xs text-blue-200/80 bg-blue-800/20 rounded-lg p-2">
                  <div className="flex items-center gap-1.5">
                    <Scissors size={13} className="text-amber-300" />
                    <span>Próximo premio:</span>
                    <span className="text-amber-300 font-medium">{siguiente.descripcion}</span>
                  </div>
                  <span className="text-amber-300 font-bold">
                    {contador}/{siguiente.cortes_requeridos}
                  </span>
                </div>
              )}

              {/* Lista de todos los premios */}
              <div className="text-[10px] text-blue-300/60 mt-1">
                {premios.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between py-0.5">
                    <span className="flex items-center gap-1.5">
                      {contador >= p.cortes_requeridos ? (
                        <span className="text-amber-400">✓</span>
                      ) : (
                        <span className="text-blue-500">○</span>
                      )}
                      {p.descripcion}
                    </span>
                    <span className="text-blue-400/60">{p.cortes_requeridos} cortes</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
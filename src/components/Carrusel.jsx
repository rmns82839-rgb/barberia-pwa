import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, SprayCan } from 'lucide-react'

export default function Carrusel({ imagenes = [], alt = '' }) {
  const [indice, setIndice] = useState(0)

  if (!imagenes || imagenes.length === 0) {
    return (
      <div className="w-full aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <SprayCan size={40} className="text-gray-400 dark:text-gray-500" />
      </div>
    )
  }

  const anterior = () => setIndice((i) => (i === 0 ? imagenes.length - 1 : i - 1))
  const siguiente = () => setIndice((i) => (i === imagenes.length - 1 ? 0 : i + 1))

  return (
    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
      <AnimatePresence mode="wait">
        <motion.img
          key={indice}
          src={imagenes[indice].imagen_url || imagenes[indice]}
          alt={alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>

      {imagenes.length > 1 && (
        <>
          <button
            onClick={anterior}
            aria-label="Anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-black/50 text-white transition active:scale-95"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={siguiente}
            aria-label="Siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-black/50 text-white transition active:scale-95"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1">
            {imagenes.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === indice ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
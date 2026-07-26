import { useRegisterSW } from 'virtual:pwa-register/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function ActualizacionApp() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      // Revisa cada hora si hay una versión nueva publicada, sin que el usuario tenga que hacer nada
      if (registro) {
        setInterval(() => registro.update(), 60 * 60 * 1000)
      }
    },
  })

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="fixed inset-x-4 bottom-4 z-[60] max-w-sm mx-auto bg-gray-900 border border-amber-500/40 rounded-xl shadow-lg p-4"
        >
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }}
              className="shrink-0"
            >
              <Sparkles size={20} className="text-amber-400" />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">Hay una nueva versión</p>
              <p className="text-xs text-gray-300 mt-0.5">
                Actualiza para ver las últimas mejoras de la app.
              </p>
              <button
                onClick={() => updateServiceWorker(true)}
                className="mt-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95"
              >
                Actualizar ahora
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
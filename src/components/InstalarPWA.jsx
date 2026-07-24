import { Download, X, Share } from 'lucide-react'
import Modal from './Modal.jsx'
import { useInstalarPWA } from '../context/InstalarPWAContext.jsx'

export default function InstalarPWA() {
  const { instalar, mostrarBanner, cerrarBanner, modalIOS, setModalIOS } = useInstalarPWA()

  return (
    <>
      {/* Aviso automático, una sola vez */}
      {mostrarBanner && (
        <div className="fixed inset-x-4 bottom-4 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 max-w-sm mx-auto flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Download size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Instala la app</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Agrégala a tu pantalla de inicio para entrar más rápido, como una app normal.
            </p>
            <button
              onClick={instalar}
              className="mt-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-1.5 text-xs font-medium transition active:scale-95"
            >
              Instalar
            </button>
          </div>
          <button onClick={cerrarBanner} aria-label="Cerrar" className="text-gray-400">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Instrucciones manuales para iPhone (Safari no soporta el aviso automático) */}
      <Modal open={modalIOS} onClose={() => setModalIOS(false)} title="Instalar en iPhone">
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>Safari no deja instalar apps con un solo botón, pero es fácil:</p>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center shrink-0">1</span>
            <span className="flex items-center gap-1">
              Toca el botón de <Share size={14} className="inline" /> "Compartir" (abajo o arriba, según tu iPhone)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <span>Busca y toca "Agregar a pantalla de inicio"</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center shrink-0">3</span>
            <span>Confirma con "Añadir" — listo, ya tienes el icono en tu pantalla</span>
          </div>
        </div>
      </Modal>
    </>
  )
}
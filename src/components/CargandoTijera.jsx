import { motion } from 'framer-motion'
import { Scissors } from 'lucide-react'

export default function CargandoTijera({ texto = 'Cargando...', size = 16, className = 'text-gray-500' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs ${className}`}>
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        className="inline-flex"
      >
        <Scissors size={size} />
      </motion.span>
      {texto && texto}
    </span>
  )
}
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { IconoWhatsApp } from './IconosRedes.jsx'

const CLAVE_POS = 'whatsapp-flotante-pos'
const MARGEN = 16
const TAMANO = 56

export default function WhatsAppFlotante() {
  const [whatsapp, setWhatsapp] = useState(null)
  const [pos, setPos] = useState(null)
  const arrastrando = useRef(false)
  const inicio = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const movimientoTotal = useRef(0)

  useEffect(() => {
    fetch('/api/negocio')
      .then((res) => res.json())
      .then((data) => setWhatsapp(data.negocio?.whatsapp || null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const guardada = JSON.parse(localStorage.getItem(CLAVE_POS) || 'null')
    if (guardada) {
      setPos(guardada)
    } else {
      setPos({ x: window.innerWidth - TAMANO - MARGEN, y: window.innerHeight * 0.65 })
    }
  }, [])

  const clamp = (x, y) => ({
    x: Math.min(Math.max(x, MARGEN), window.innerWidth - TAMANO - MARGEN),
    y: Math.min(Math.max(y, MARGEN), window.innerHeight - TAMANO - MARGEN),
  })

  const alMover = (e) => {
    if (!arrastrando.current) return
    e.preventDefault?.()
    const punto = e.touches ? e.touches[0] : e
    const dx = punto.clientX - inicio.current.px
    const dy = punto.clientY - inicio.current.py
    movimientoTotal.current = Math.abs(dx) + Math.abs(dy)
    setPos(clamp(inicio.current.x + dx, inicio.current.y + dy))
  }

  const alSoltar = () => {
    arrastrando.current = false
    window.removeEventListener('mousemove', alMover)
    window.removeEventListener('mouseup', alSoltar)
    window.removeEventListener('touchmove', alMover)
    window.removeEventListener('touchend', alSoltar)

    setPos((actual) => {
      const mitad = window.innerWidth / 2
      const nuevoX = actual.x + TAMANO / 2 < mitad ? MARGEN : window.innerWidth - TAMANO - MARGEN
      const final = clamp(nuevoX, actual.y)
      localStorage.setItem(CLAVE_POS, JSON.stringify(final))
      return final
    })

    if (movimientoTotal.current < 6 && whatsapp) {
      window.open(`https://wa.me/57${whatsapp}`, '_blank')
    }
  }

  const alPresionar = (e) => {
    arrastrando.current = true
    movimientoTotal.current = 0
    const punto = e.touches ? e.touches[0] : e
    inicio.current = { x: pos.x, y: pos.y, px: punto.clientX, py: punto.clientY }
    window.addEventListener('mousemove', alMover)
    window.addEventListener('mouseup', alSoltar)
    window.addEventListener('touchmove', alMover, { passive: false })
    window.addEventListener('touchend', alSoltar)
  }

  if (!whatsapp || !pos) return null

  return (
    <motion.div
      onMouseDown={alPresionar}
      onTouchStart={alPresionar}
      animate={{ left: pos.x, top: pos.y }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{ position: 'fixed', zIndex: 45, width: TAMANO, height: TAMANO, touchAction: 'none' }}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        animate={{
          boxShadow: [
            '0 0 0px rgba(251,191,36,0.4)',
            '0 0 16px rgba(251,191,36,0.85)',
            '0 0 0px rgba(251,191,36,0.4)',
          ],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-full h-full rounded-full bg-green-600 flex items-center justify-center text-white shadow-lg ring-2 ring-amber-400"
      >
        <IconoWhatsApp size={26} />
      </motion.div>
    </motion.div>
  )
}
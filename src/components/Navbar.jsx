import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, Scissors } from 'lucide-react'
import { obtenerTema, alternarTema } from '../lib/tema.js'

const enlaces = [
  { to: '/', label: 'Inicio' },
  { to: '/citas', label: 'Citas' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/login', label: 'Login' },
]

function Navbar() {
  const location = useLocation()
  const [abierto, setAbierto] = useState(false)
  const [tema, setTema] = useState('claro')

  useEffect(() => {
    setTema(obtenerTema())
  }, [])

  useEffect(() => {
    setAbierto(false)
  }, [location.pathname])

  const toggleTema = () => setTema(alternarTema())

  return (
    <nav className="sticky top-0 z-40 bg-gray-900/90 dark:bg-gray-950/90 backdrop-blur text-white px-4 py-3 shadow-md">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Scissors size={20} />
          Barbería
        </Link>

        {/* Bento de links con indicador que se desliza — solo en pantallas medianas en adelante */}
        <div className="hidden sm:grid grid-cols-4 gap-2 text-sm bg-white/5 rounded-xl p-1">
          {enlaces.map((e) => {
            const activo = location.pathname === e.to
            return (
              <Link
                key={e.to}
                to={e.to}
                className="relative text-center rounded-lg px-3 py-1.5"
              >
                {activo && (
                  <motion.span
                    layoutId="nav-activo"
                    className="absolute inset-0 bg-white rounded-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span
                  className={`relative z-10 transition-colors ${
                    activo ? 'text-gray-900 font-medium' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {e.label}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTema}
            aria-label="Cambiar tema"
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 transition active:scale-95"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={tema}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                {tema === 'oscuro' ? <Sun size={16} /> : <Moon size={16} />}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* Hamburguesa — solo en celular */}
          <button
            onClick={() => setAbierto((v) => !v)}
            aria-label="Abrir menú"
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 transition active:scale-95"
          >
            {abierto ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Menú desplegable de celular */}
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 pt-3 text-sm">
              {enlaces.map((e) => {
                const activo = location.pathname === e.to
                return (
                  <Link
                    key={e.to}
                    to={e.to}
                    className={`text-center rounded-lg px-3 py-2 transition ${
                      activo ? 'bg-white text-gray-900 font-medium' : 'bg-white/5 text-gray-200'
                    }`}
                  >
                    {e.label}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar
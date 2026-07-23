import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Citas from './pages/Citas.jsx'
import Catalogo from './pages/Catalogo.jsx'
import Admin from './pages/Admin.jsx'
import Navbar from './components/Navbar.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminProductos from './pages/AdminProductos.jsx'
import AdminClientes from './pages/AdminClientes.jsx'
import BarberoLogin from './pages/BarberoLogin.jsx'
import BarberoGaleria from './pages/BarberoGaleria.jsx'
import MisCitas from './pages/MisCitas.jsx'
import AdminHorarios from './pages/AdminHorarios.jsx'
import AdminBarberos from './pages/AdminBarberos.jsx'
import { obtenerTema, aplicarTema } from './lib/tema.js'

const variantesPagina = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

function App() {
  const location = useLocation()

  useEffect(() => {
    aplicarTema(obtenerTema())
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 dark:text-gray-100 transition-colors">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PaginaAnimada><Home /></PaginaAnimada>} />
          <Route path="/login" element={<PaginaAnimada><Login /></PaginaAnimada>} />
          <Route path="/citas" element={<PaginaAnimada><Citas /></PaginaAnimada>} />
          <Route path="/catalogo" element={<PaginaAnimada><Catalogo /></PaginaAnimada>} />
          <Route path="/admin" element={<PaginaAnimada><Admin /></PaginaAnimada>} />
          <Route path="/admin-login" element={<PaginaAnimada><AdminLogin /></PaginaAnimada>} />
          <Route path="/admin-productos" element={<PaginaAnimada><AdminProductos /></PaginaAnimada>} />
          <Route path="/admin-clientes" element={<PaginaAnimada><AdminClientes /></PaginaAnimada>} />
          <Route path="/barbero-login" element={<PaginaAnimada><BarberoLogin /></PaginaAnimada>} />
          <Route path="/barbero-galeria" element={<PaginaAnimada><BarberoGaleria /></PaginaAnimada>} />
          <Route path="/mis-citas" element={<PaginaAnimada><MisCitas /></PaginaAnimada>} />
          <Route path="/admin-horarios" element={<PaginaAnimada><AdminHorarios /></PaginaAnimada>} />
          <Route path="/admin-barberos" element={<PaginaAnimada><AdminBarberos /></PaginaAnimada>} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

function PaginaAnimada({ children }) {
  return (
    <motion.div
      variants={variantesPagina}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default App
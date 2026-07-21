import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Citas from './pages/Citas.jsx'
import Catalogo from './pages/Catalogo.jsx'
import Admin from './pages/Admin.jsx'
import Navbar from './components/Navbar.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminProductos from './pages/AdminProductos.jsx'
import AdminClientes from './pages/AdminClientes.jsx'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/citas" element={<Citas />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-productos" element={<AdminProductos />} />
        <Route path="/admin-clientes" element={<AdminClientes />} />
      </Routes>
    </div>
  )
}

export default App
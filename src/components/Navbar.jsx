import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center">
      <span className="font-bold text-lg">Barbería</span>
      <div className="grid grid-cols-4 gap-3 text-sm">
        <Link to="/" className="hover:text-gray-300 text-center">Inicio</Link>
        <Link to="/citas" className="hover:text-gray-300 text-center">Citas</Link>
        <Link to="/catalogo" className="hover:text-gray-300 text-center">Catálogo</Link>
        <Link to="/login" className="hover:text-gray-300 text-center">Login</Link>
      </div>
    </nav>
  )
}

export default Navbar
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, tipo = 'admin' }) {
  const { admin, cliente, cargando } = useAuth()
  if (cargando) return null
  const autenticado = tipo === 'admin' ? admin : cliente
  if (!autenticado) return <Navigate to={tipo === 'admin' ? '/admin-login' : '/login'} replace />
  return children
}
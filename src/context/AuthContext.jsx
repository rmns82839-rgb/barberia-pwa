import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/auth?action=whoami', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setAdmin(data.admin || null)
        setCliente(data.cliente || null)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const loginAdmin = (data) => setAdmin(data.admin)
  const loginCliente = (clienteData) => setCliente(clienteData)

  const logoutAdmin = async () => {
    await fetch('/api/auth?action=logout', { method: 'POST', credentials: 'include' })
    setAdmin(null)
  }
  const logoutCliente = async () => {
    await fetch('/api/auth?action=logout', { method: 'POST', credentials: 'include' })
    setCliente(null)
  }

  return (
    <AuthContext.Provider value={{ admin, cliente, cargando, loginAdmin, loginCliente, logoutAdmin, logoutCliente }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
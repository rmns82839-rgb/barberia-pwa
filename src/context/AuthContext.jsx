import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [barbero, setBarbero] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/auth?action=whoami', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setAdmin(data.admin || null)
        setCliente(data.cliente || null)
        setBarbero(data.barbero || null)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const loginAdmin = (data) => setAdmin(data.admin)
  const loginCliente = (clienteData) => setCliente(clienteData)
  const loginBarbero = (data) => setBarbero(data.barbero)

  const logoutAdmin = async () => {
    await fetch('/api/auth?action=logout', { method: 'POST', credentials: 'include' })
    setAdmin(null)
  }
  const logoutCliente = async () => {
    await fetch('/api/auth?action=logout', { method: 'POST', credentials: 'include' })
    setCliente(null)
  }
  const logoutBarbero = async () => {
    await fetch('/api/auth?action=logout', { method: 'POST', credentials: 'include' })
    setBarbero(null)
  }

  return (
    <AuthContext.Provider
      value={{
        admin, cliente, barbero, cargando,
        loginAdmin, loginCliente, loginBarbero,
        logoutAdmin, logoutCliente, logoutBarbero,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
import { createContext, useContext, useState, useEffect } from 'react'

const InstalarPWAContext = createContext(null)

const CLAVE_BANNER_VISTO = 'pwa-banner-visto'

function esStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function esIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export function InstalarPWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [mostrarBanner, setMostrarBanner] = useState(false)
  const [modalIOS, setModalIOS] = useState(false)
  const [instalado, setInstalado] = useState(false)

  useEffect(() => {
    if (esStandalone()) {
      setInstalado(true)
      return
    }

    const alCapturarPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!localStorage.getItem(CLAVE_BANNER_VISTO)) {
        setTimeout(() => setMostrarBanner(true), 1500)
      }
    }

    window.addEventListener('beforeinstallprompt', alCapturarPrompt)

    if (esIOS() && !localStorage.getItem(CLAVE_BANNER_VISTO)) {
      setTimeout(() => setMostrarBanner(true), 1500)
    }

    const alInstalar = () => {
      setInstalado(true)
      setMostrarBanner(false)
    }
    window.addEventListener('appinstalled', alInstalar)

    return () => {
      window.removeEventListener('beforeinstallprompt', alCapturarPrompt)
      window.removeEventListener('appinstalled', alInstalar)
    }
  }, [])

  const cerrarBanner = () => {
    setMostrarBanner(false)
    localStorage.setItem(CLAVE_BANNER_VISTO, '1')
  }

  const instalar = async () => {
    if (esIOS()) {
      setModalIOS(true)
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    cerrarBanner()
  }

  const puedeInstalar = !instalado && (!!deferredPrompt || esIOS())

  return (
    <InstalarPWAContext.Provider
      value={{ puedeInstalar, instalar, mostrarBanner, cerrarBanner, modalIOS, setModalIOS }}
    >
      {children}
    </InstalarPWAContext.Provider>
  )
}

export function useInstalarPWA() {
  const ctx = useContext(InstalarPWAContext)
  if (!ctx) throw new Error('useInstalarPWA debe usarse dentro de <InstalarPWAProvider>')
  return ctx
}
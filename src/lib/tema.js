const CLAVE = 'tema'

export function obtenerTema() {
  const guardado = localStorage.getItem(CLAVE)
  if (guardado === 'oscuro' || guardado === 'claro') return guardado
  const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefiereOscuro ? 'oscuro' : 'claro'
}

export function aplicarTema(tema) {
  document.documentElement.classList.toggle('dark', tema === 'oscuro')
  localStorage.setItem(CLAVE, tema)
}

export function alternarTema() {
  const actual = obtenerTema()
  const nuevo = actual === 'oscuro' ? 'claro' : 'oscuro'
  aplicarTema(nuevo)
  return nuevo
}
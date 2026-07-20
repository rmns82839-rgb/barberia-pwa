// Devuelve la fecha de HOY en zona horaria de Colombia (YYYY-MM-DD)
export function hoyColombia() {
  const ahora = new Date()
  // 'en-CA' da formato YYYY-MM-DD directamente
  return ahora.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}
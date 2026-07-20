// Pide permiso al usuario para mostrar notificaciones
export async function pedirPermisoNotificaciones() {
  if (!('Notification' in window)) {
    return 'no-soportado'
  }
  if (Notification.permission === 'granted') {
    return 'granted'
  }
  if (Notification.permission !== 'denied') {
    const permiso = await Notification.requestPermission()
    return permiso
  }
  return Notification.permission
}

// Muestra una notificación local
export function mostrarNotificacion(titulo, cuerpo) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    new Notification(titulo, {
      body: cuerpo,
      icon: '/icon-192.png',
    })
  }
}
// Convierte fotos HEIC/HEIF (formato nativo de iPhone) a JPEG antes de subirlas,
// porque la mayoría de navegadores no pueden mostrar HEIC directamente.
export async function convertirSiHeic(archivo) {
  const esHeic =
    archivo.type === 'image/heic' ||
    archivo.type === 'image/heif' ||
    /\.hei[cf]$/i.test(archivo.name)

  if (!esHeic) return archivo

  const heic2any = (await import('heic2any')).default
  const blobConvertido = await heic2any({
    blob: archivo,
    toType: 'image/jpeg',
    quality: 0.85,
  })

  const nombreNuevo = archivo.name.replace(/\.hei[cf]$/i, '.jpg')
  return new File([blobConvertido], nombreNuevo, { type: 'image/jpeg' })
}
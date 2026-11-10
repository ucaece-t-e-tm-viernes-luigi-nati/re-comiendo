'use client'

/**
 * Achica la foto en el navegador (máx. 1200 px, WebP) y la sube a /api/fotos.
 * Devuelve la URL pública (/api/fotos/<id>). Reemplaza al Storage de Supabase de la v2.1.
 */
export async function subirFoto(archivo: File): Promise<string> {
  if (!archivo.type.startsWith('image/')) throw new Error('El archivo tiene que ser una imagen')
  if (archivo.size > 15 * 1024 * 1024) throw new Error('La foto tiene que pesar menos de 15 MB')
  const comprimida = await comprimir(archivo)
  const datos = new FormData()
  datos.append('foto', comprimida, 'foto.webp')
  const res = await fetch('/api/fotos', { method: 'POST', body: datos })
  const json = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
  if (!res.ok || !json?.url) throw new Error(json?.error ?? 'No pudimos subir la foto')
  return json.url
}

async function comprimir(archivo: File, max = 1200): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo)
  const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/webp', 0.8))
  if (blob && blob.type === 'image/webp') return blob
  // Safari viejo no exporta WebP: cae a JPEG.
  const jpeg = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.82))
  if (!jpeg) throw new Error('No pudimos procesar la foto')
  return jpeg
}

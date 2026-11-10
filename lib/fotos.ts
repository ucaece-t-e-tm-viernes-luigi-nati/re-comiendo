import { z } from 'zod'

// Fotos: las del seed viven en /public/fotos (WebP) y las que suben locales y comensales se guardan
// en la tabla media y se sirven en /api/fotos/<uuid>. También se aceptan URLs https externas.
export const RUTA_FOTO = /^\/(api\/fotos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|fotos\/[a-z0-9-]+\.(webp|jpe?g|png))$/

export const esquemaFoto = z
  .string()
  .trim()
  .max(500)
  .refine((v) => RUTA_FOTO.test(v) || /^https:\/\/[^\s]+$/.test(v), 'Foto inválida')

/** Tamaño máximo que acepta el servidor (la foto ya llega comprimida desde el navegador). */
export const MAX_BYTES_FOTO = 1_500_000

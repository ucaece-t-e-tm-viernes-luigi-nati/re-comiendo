import { connection } from 'next/server'
import { q1 } from '@/lib/db'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** GET /api/fotos/:id — sirve una foto subida (son públicas, como el bucket "fotos" de la v2.1). */
export async function GET(_: Request, ctx: RouteContext<'/api/fotos/[id]'>) {
  await connection()
  const { id } = await ctx.params
  if (!UUID.test(id)) return new Response('No encontrada', { status: 404 })
  const foto = await q1<{ content_type: string; data: Buffer }>(`SELECT content_type, data FROM media WHERE id = $1`, [id])
  if (!foto) return new Response('No encontrada', { status: 404 })
  return new Response(new Uint8Array(foto.data), {
    headers: {
      'Content-Type': foto.content_type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

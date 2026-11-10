import { connection, NextResponse } from 'next/server'
import { obtenerLocal, publicacionesDeLocal, resenasDeLocal } from '@/lib/services/locales'

/** GET /api/locales/:id — ficha, publicaciones y reseñas. */
export async function GET(_: Request, ctx: RouteContext<'/api/locales/[id]'>) {
  await connection()
  const { id } = await ctx.params
  const local = await obtenerLocal(id)
  if (!local || local.estado !== 'activo') return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const [publicaciones, resenas] = await Promise.all([publicacionesDeLocal(id), resenasDeLocal(id)])
  const { client_id, ...publico } = local
  void client_id
  return NextResponse.json({ ...publico, publicaciones, resenas: resenas.map((r) => ({ ...r, user_id: undefined })) })
}

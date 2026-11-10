import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { q, q1 } from '@/lib/db'
import { MAX_BYTES_FOTO } from '@/lib/fotos'

const TIPOS = ['image/webp', 'image/jpeg', 'image/png']

/** POST /api/fotos — sube una foto (comensal logueado o miembro de un local). Devuelve { url }. */
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tenés que ingresar para subir fotos' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const archivo = form?.get('foto')
  if (!(archivo instanceof Blob)) return NextResponse.json({ error: 'Falta la foto' }, { status: 400 })
  if (!TIPOS.includes(archivo.type)) return NextResponse.json({ error: 'Formato no soportado' }, { status: 415 })
  if (archivo.size > MAX_BYTES_FOTO) return NextResponse.json({ error: 'La foto pesa demasiado' }, { status: 413 })

  // Límite simple anti-abuso: 60 fotos por usuario por día.
  const hoy = await q1<{ n: number }>(`SELECT count(*)::int AS n FROM media WHERE owner_user_id = $1 AND created_at > now() - interval '1 day'`, [user.id])
  if ((hoy?.n ?? 0) >= 60) return NextResponse.json({ error: 'Llegaste al límite de fotos por hoy' }, { status: 429 })

  // Si es miembro de un local, la foto queda asociada a su empresa (client_id resuelto en el servidor).
  const membresia = await q1<{ client_id: string }>(`SELECT client_id FROM client_member WHERE user_id = $1 ORDER BY created_at LIMIT 1`, [user.id])
  const datos = Buffer.from(await archivo.arrayBuffer())
  const [fila] = await q<{ id: string }>(
    `INSERT INTO media (owner_user_id, client_id, content_type, bytes, data) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [user.id, membresia?.client_id ?? null, archivo.type, datos.length, datos],
  )
  return NextResponse.json({ url: `/api/fotos/${fila.id}` })
}

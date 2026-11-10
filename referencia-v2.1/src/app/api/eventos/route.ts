import { NextResponse } from 'next/server'
import { z } from 'zod'
import { obtenerPerfil } from '@/lib/services/auth'
import { EVENTOS_DESDE_CLIENTE, registrarEvento } from '@/lib/services/eventos'
import type { TipoEvento } from '@/lib/tipos'

const Esquema = z.object({
  tipo: z.string().refine((t) => EVENTOS_DESDE_CLIENTE.includes(t as TipoEvento)),
  localId: z.string().max(120).nullable().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

/** Eventos de analítica que manda el navegador (vistas, clicks, impresiones). */
export async function POST(req: Request) {
  const datos = Esquema.safeParse(await req.json().catch(() => null))
  if (!datos.success) return NextResponse.json({ error: 'Evento inválido' }, { status: 400 })
  const perfil = await obtenerPerfil()
  await registrarEvento(datos.data.tipo as TipoEvento, {
    userId: perfil?.id ?? null,
    localId: datos.data.localId ?? null,
    meta: datos.data.meta,
  })
  return NextResponse.json({ ok: true })
}

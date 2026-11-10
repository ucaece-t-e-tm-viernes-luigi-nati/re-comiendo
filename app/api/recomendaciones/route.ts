import { connection, NextResponse } from 'next/server'
import { obtenerPerfil } from '@/lib/services/auth'
import { recomendacionesPara } from '@/lib/services/recomendaciones'
import type { Momento } from '@/lib/tipos'

const MOMENTOS = ['desayuno', 'almuerzo', 'merienda', 'cena', 'birra']

/** GET /api/recomendaciones?momento=&lat=&lng= — recomendaciones para el usuario logueado (o invitado). */
export async function GET(req: Request) {
  await connection()
  const p = new URL(req.url).searchParams
  const m = p.get('momento')
  const lat = Number(p.get('lat'))
  const lng = Number(p.get('lng'))
  const recos = await recomendacionesPara(await obtenerPerfil(), {
    momento: m && MOMENTOS.includes(m) ? (m as Momento) : undefined,
    ubicacion: p.has('lat') && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
  })
  return NextResponse.json(
    recos.map((r) => ({
      id: r.local.id,
      nombre: r.local.nombre,
      categoria: r.local.categoria,
      match: r.match,
      motivo: r.motivo,
      distancia_km: r.distanciaKm,
      patrocinado: r.patrocinado ?? null,
    })),
  )
}

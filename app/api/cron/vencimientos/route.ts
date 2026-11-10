import { timingSafeEqual } from 'node:crypto'
import { runDailyBilling } from '@/lib/billing'

// Cron diario de Vercel (ver vercel.json). Vercel manda "Authorization: Bearer <CRON_SECRET>".
// Sin CRON_SECRET configurado o con un header incorrecto → 404 (no revela que existe).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const ok =
    !!secret && header.length === expected.length && timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  if (!ok) return new Response('Not found', { status: 404 })

  try {
    const result = await runDailyBilling()
    return Response.json({ ok: true, ...result })
  } catch (error) {
    console.error('[cron] vencimientos falló', error)
    return Response.json({ ok: false }, { status: 500 })
  }
}

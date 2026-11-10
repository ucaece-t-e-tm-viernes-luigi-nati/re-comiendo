import { NextResponse } from 'next/server'
import { listarLocales, obtenerSeñales } from '@/lib/services/locales'
import { NOMBRE_CATEGORIA, type Categoria, type Precio } from '@/lib/tipos'

/** GET /api/locales?q=&categoria=&precio= — locales activos con rating. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams
  const categoria = p.get('categoria')
  const precio = Number(p.get('precio'))
  const [locales, señales] = await Promise.all([
    listarLocales({
      texto: p.get('q') ?? undefined,
      categoria: categoria && categoria in NOMBRE_CATEGORIA ? (categoria as Categoria) : undefined,
      precio: [1, 2, 3].includes(precio) ? (precio as Precio) : undefined,
    }),
    obtenerSeñales(),
  ])
  return NextResponse.json(locales.map((l) => ({ ...l, owner_id: undefined, ...señales[l.id] })))
}

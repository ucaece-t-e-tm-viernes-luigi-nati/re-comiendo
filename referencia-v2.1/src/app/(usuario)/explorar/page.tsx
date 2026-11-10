import Link from 'next/link'
import { Crown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TarjetaLocal } from '@/components/comunes/tarjeta-local'
import { obtenerPerfil } from '@/lib/services/auth'
import { listarLocales, obtenerSeñales } from '@/lib/services/locales'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA, PRECIO_TEXTO, TAGS, type Categoria, type Precio } from '@/lib/tipos'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Explorar' }

type Params = { q?: string; categoria?: string; precio?: string; tag?: string | string[] }

function enlace(actual: Params, cambio: Partial<Params>) {
  const p = new URLSearchParams()
  const nuevo = { ...actual, ...cambio }
  if (nuevo.q) p.set('q', nuevo.q)
  if (nuevo.categoria) p.set('categoria', nuevo.categoria)
  if (nuevo.precio) p.set('precio', nuevo.precio)
  for (const t of [nuevo.tag ?? []].flat()) p.append('tag', t)
  const s = p.toString()
  return s ? `/explorar?${s}` : '/explorar'
}

export default async function Explorar({ searchParams }: PageProps<'/explorar'>) {
  const sp = (await searchParams) as Params
  const perfil = await obtenerPerfil()
  const premium = !!perfil?.es_premium
  const tags = premium ? [sp.tag ?? []].flat() : []
  const categoria = sp.categoria && sp.categoria in NOMBRE_CATEGORIA ? (sp.categoria as Categoria) : undefined
  const precio = ['1', '2', '3'].includes(sp.precio ?? '') ? (Number(sp.precio) as Precio) : undefined
  const [locales, señales] = await Promise.all([
    listarLocales({ texto: sp.q, categoria, precio, tags }),
    obtenerSeñales(),
  ])

  const chip = (activo: boolean) =>
    cn('shrink-0 rounded-full border px-3 py-1 text-sm transition', activo ? 'border-bordo bg-bordo text-crema' : 'bg-card hover:border-bordo/40')

  return (
    <div className="flex flex-col gap-4">
      <h1 className="titulo text-3xl text-bordo">Explorar</h1>
      <form className="relative" action="/explorar">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={sp.q} placeholder="Buscá por nombre, barrio o plato" className="h-11 bg-card pl-9" />
        {categoria && <input type="hidden" name="categoria" value={categoria} />}
        {precio && <input type="hidden" name="precio" value={precio} />}
      </form>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold">Tipo de comida</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Link href={enlace(sp, { categoria: undefined })} className={chip(!categoria)}>
            Todo
          </Link>
          {(Object.keys(NOMBRE_CATEGORIA) as Categoria[]).map((c) => (
            <Link key={c} href={enlace(sp, { categoria: c })} className={chip(categoria === c)}>
              {EMOJI_CATEGORIA[c]} {NOMBRE_CATEGORIA[c]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3] as Precio[]).map((p) => (
            <Link key={p} href={enlace(sp, { precio: precio === p ? undefined : String(p) })} className={chip(precio === p)}>
              {PRECIO_TEXTO[p]}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-suave/60 p-3">
          <p className="flex items-center gap-1 text-sm font-bold">
            Más filtros {!premium && <Crown className="size-3.5 text-bordo" />}
          </p>
          {premium ? (
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => {
                const activo = tags.includes(t)
                return (
                  <Link key={t} href={enlace(sp, { tag: activo ? tags.filter((x) => x !== t) : [...tags, t] })} className={cn(chip(activo), 'capitalize')}>
                    {t}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Pet friendly, sin TACC, vista al mar y más.</span>
              <Button asChild size="sm">
                <Link href="/premium?volver=/explorar">Probar Premium</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{locales.length} lugares</p>
      {locales.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center">No encontramos lugares con esos filtros.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {locales.map((l) => (
            <TarjetaLocal key={l.id} local={l} señales={señales[l.id]} />
          ))}
        </div>
      )}
    </div>
  )
}

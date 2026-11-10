import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Heart, RefreshCw, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BotonUbicacion } from '@/components/comunes/boton-ubicacion'
import { FotoLocal, TarjetaLocal } from '@/components/comunes/tarjeta-local'
import { obtenerPerfil } from '@/lib/services/auth'
import { obtenerSeñales } from '@/lib/services/locales'
import { recomendacionesPara } from '@/lib/services/recomendaciones'
import { momentoActual } from '@/lib/services/recomendador'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA, NOMBRE_MOMENTO, PRECIO_TEXTO, type Momento } from '@/lib/tipos'
import { ubicacionGuardada } from '@/lib/ubicacion'
import { cn } from '@/lib/utils'
import { accionMeCopa, accionNoMeInteresa, accionOtraOpcion, accionVerDeNuevo } from '../acciones'

const MOMENTOS = Object.keys(NOMBRE_MOMENTO) as Momento[]

export default async function Inicio({ searchParams }: PageProps<'/inicio'>) {
  // El momento del día depende de la hora actual: se calcula siempre en el request (no en el prerender).
  await connection()
  const perfil = await obtenerPerfil()
  if (perfil && !perfil.onboarding_ok) redirect('/gustos')

  const { momento: m } = await searchParams
  const momento: Momento | null = m === 'todos' ? null : MOMENTOS.includes(m as Momento) ? (m as Momento) : momentoActual()
  const ubicacion = await ubicacionGuardada()
  const [recos, señales] = await Promise.all([recomendacionesPara(perfil, { momento, ubicacion }), obtenerSeñales()])
  const principal = recos.find((r) => !r.patrocinado)
  const resto = recos.filter((r) => r !== principal).slice(0, 10)

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h1 className="titulo text-3xl text-bordo md:text-4xl">
          {perfil ? `Hola, ${perfil.nombre.split(' ')[0]}.` : 'Basta de perder media hora eligiendo dónde comer.'}
          <span className="block text-xl text-foreground/80 md:text-2xl">¿Qué tenés ganas hoy?</span>
        </h1>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {[...MOMENTOS, 'todos' as const].map((x) => {
            const activo = x === 'todos' ? momento === null : momento === x
            return (
              <Link
                key={x}
                href={`/inicio?momento=${x}`}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition',
                  activo ? 'border-bordo bg-bordo text-crema' : 'bg-card hover:border-bordo/40',
                )}
              >
                {x === 'todos' ? 'Cualquier momento' : NOMBRE_MOMENTO[x]}
              </Link>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BotonUbicacion activa={!!ubicacion} />
          {!perfil && (
            <p className="text-sm text-muted-foreground">
              <Link href="/ingresar?modo=registro" className="font-bold text-bordo">
                Creá tu cuenta
              </Link>{' '}
              y te recomendamos según tus gustos.
            </p>
          )}
        </div>
      </section>

      {principal ? (
        <section className="grid overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 md:grid-cols-2">
          <Link href={`/local/${principal.local.id}`} className="relative block">
            <FotoLocal local={principal.local} className="aspect-[4/3] w-full md:h-full" />
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-crema/95 px-3 py-1 text-sm font-bold text-bordo">
              <Sparkles className="size-4" /> {principal.match}% match
            </span>
          </Link>
          <div className="flex flex-col gap-3 p-5">
            <p className="text-sm font-bold text-bordo">{principal.motivo}</p>
            <h2 className="titulo text-3xl">{principal.local.nombre}</h2>
            <p className="text-sm text-muted-foreground">
              {EMOJI_CATEGORIA[principal.local.categoria]} {NOMBRE_CATEGORIA[principal.local.categoria]} ·{' '}
              {PRECIO_TEXTO[principal.local.precio]} · {principal.local.barrio}
              {principal.distanciaKm != null && ` · ${principal.distanciaKm.toFixed(1)} km`}
            </p>
            <p className="text-sm leading-relaxed">{principal.local.descripcion}</p>
            {perfil ? (
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <form action={accionMeCopa.bind(null, principal.local.id, principal.local.categoria)} className="flex-1">
                  <Button type="submit" size="lg" className="w-full">
                    <Heart /> Me copa
                  </Button>
                </form>
                <form action={accionOtraOpcion.bind(null, principal.local.id, principal.local.categoria)} className="flex-1">
                  <Button type="submit" size="lg" variant="secondary" className="w-full">
                    <RefreshCw /> Otra opción
                  </Button>
                </form>
                <form action={accionNoMeInteresa.bind(null, principal.local.id)}>
                  <Button type="submit" size="lg" variant="ghost" aria-label="No me interesa">
                    <X />
                  </Button>
                </form>
              </div>
            ) : (
              <Button asChild size="lg" className="mt-auto">
                <Link href={`/local/${principal.local.id}`}>Ver el lugar</Link>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">Nunca te repetimos el mismo lugar dos veces seguidas.</p>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl bg-card p-6 text-center">
          <p className="titulo text-xl">Ya te mostramos todo para este momento.</p>
          <p className="mt-1 text-sm text-muted-foreground">Probá con otro momento o volvé a ver los que descartaste.</p>
          {perfil && (
            <form action={accionVerDeNuevo} className="mt-4">
              <Button type="submit" variant="outline">
                Ver de nuevo
              </Button>
            </form>
          )}
        </section>
      )}

      {perfil && !perfil.es_premium && (
        <Link
          href="/premium"
          className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-bordo/30 bg-suave px-4 py-3 text-sm"
        >
          <span>
            <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">Espacio publicitario</span>
            Reservá sin llamar y comé con descuento
          </span>
          <span className="shrink-0 font-bold text-bordo">Sacalo con Premium →</span>
        </Link>
      )}

      {resto.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="titulo text-2xl">También para vos</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {resto.map((r) => (
              <TarjetaLocal
                key={r.local.id + (r.patrocinado ? '-p' : '')}
                local={r.local}
                señales={señales[r.local.id]}
                motivo={r.motivo}
                match={r.patrocinado ? undefined : r.match}
                distanciaKm={r.distanciaKm}
                patrocinado={r.patrocinado}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

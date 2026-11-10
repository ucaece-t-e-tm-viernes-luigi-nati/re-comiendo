import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3,
  CalendarCheck,
  Check,
  Coins,
  Heart,
  MapPin,
  Megaphone,
  Newspaper,
  Sparkles,
  Star,
  Store,
  Timer,
  UtensilsCrossed,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { obtenerPerfil } from '@/lib/services/auth'
import { listarLocales } from '@/lib/services/locales'
import { contactHref } from '@/lib/site'
import { PREMIUM_USD } from '@/lib/tipos'

export const metadata = {
  title: { absolute: 'ReComiendo · Dónde comer en Mar del Plata, según tus gustos' },
}

const PASOS = [
  { icono: Heart, titulo: 'Contanos qué te gusta', texto: 'Elegís tus comidas favoritas, cuánto querés gastar y si preferís descubrir o ir a lo seguro.' },
  { icono: Sparkles, titulo: 'Te recomendamos al toque', texto: 'Nuestro algoritmo te propone el lugar ideal para el momento del día, cerca tuyo y sin repetir.' },
  { icono: CalendarCheck, titulo: 'Reservá, reseñá y sumá', texto: 'Reservás sin llamar, contás cómo te fue y canjeás puntos por beneficios en locales aliados.' },
]

const FUNCIONES = [
  { icono: Sparkles, titulo: 'Recomendaciones a tu medida', texto: 'Aprende con cada "Me copa" y cada "Otra opción".' },
  { icono: MapPin, titulo: 'Mapa interactivo', texto: 'Todos los lugares cerca tuyo, filtrados por rubro.' },
  { icono: Newspaper, titulo: 'Feed de tus lugares', texto: 'Posts, promos y fotos de los locales que seguís.' },
  { icono: Star, titulo: 'Reseñas reales', texto: 'De la comunidad marplatense, con fotos.' },
  { icono: CalendarCheck, titulo: 'Reservas sin llamar', texto: 'Elegís horario y te llega un código.' },
  { icono: Coins, titulo: 'Puntos y cupones', texto: 'Cada reseña suma. Canjeá por cafés, pintas y descuentos.' },
]

const NEGOCIOS = [
  { icono: Store, texto: 'Tu ficha con fotos, carta, horarios y ubicación' },
  { icono: Megaphone, texto: 'Publicá posts y promos que llegan a tus seguidores' },
  { icono: CalendarCheck, texto: 'Recibí reservas y validá cupones en el momento' },
  { icono: BarChart3, texto: 'Métricas: vistas, clicks, reservas y seguidores' },
]

function FotoTarjeta({ src, nombre, detalle, match, className }: { src: string; nombre: string; detalle: string; match: number; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-black/5 ${className ?? ''}`}>
      <div className="relative">
        <Image src={src} alt={nombre} width={480} height={360} className="aspect-[4/3] w-full object-cover" />
        <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-crema/95 px-2.5 py-1 text-xs font-bold text-bordo">
          <Sparkles className="size-3.5" /> {match}% match
        </span>
      </div>
      <div className="p-4">
        <p className="titulo text-xl text-foreground">{nombre}</p>
        <p className="text-sm text-muted-foreground">{detalle}</p>
      </div>
    </div>
  )
}

// Lee la sesión y los locales en cada pedido.
export const instant = false

export default async function Landing() {
  const [perfil, locales] = await Promise.all([obtenerPerfil(), listarLocales()])
  const destino = '/inicio'
  const barrios = new Set(locales.map((l) => l.barrio)).size

  return (
    <div className="min-h-dvh bg-crema text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-bordo/10 bg-crema/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={34} height={34} className="rounded-lg" />
            <span className="titulo text-2xl text-bordo">ReComiendo</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#como-funciona" className="hover:text-bordo">Cómo funciona</a>
            <a href="#premium" className="hover:text-bordo">Premium</a>
            <a href="#negocios" className="hover:text-bordo">Para negocios</a>
          </nav>
          <div className="flex items-center gap-2">
            {perfil ? (
              <Button asChild>
                <Link href={destino}>Ir a la app</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/ingresar">Ingresar</Link>
                </Button>
                <Button asChild>
                  <Link href="/ingresar?modo=registro">Crear cuenta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 md:grid-cols-[1.1fr_1fr] md:pt-20 md:pb-24">
        <div className="flex flex-col gap-6">
          <span className="w-fit rounded-full bg-rosa-claro px-3 py-1 text-sm font-bold text-bordo">Hecho en Mar del Plata 🌊</span>
          <h1 className="titulo text-5xl leading-[1.02] text-bordo md:text-7xl">Basta de perder media hora eligiendo dónde comer.</h1>
          <p className="max-w-xl text-lg leading-relaxed text-foreground/80">
            ReComiendo junta lo mejor de Instagram y Google Maps: te recomienda cafés, bares y restaurantes según tus gustos, te muestra
            cómo llegar y te deja reservar sin llamar.
          </p>
          <div className="flex flex-wrap gap-3">
            {perfil ? (
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href={destino}>Ir a la app</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-12 px-6 text-base">
                  <Link href="/ingresar?modo=registro">Crear cuenta gratis</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-bordo/30 px-6 text-base">
                  <Link href="/ingresar">Ya tengo cuenta</Link>
                </Button>
              </>
            )}
          </div>
          <dl className="mt-2 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">Lugares</dt>
              <dd className="titulo text-3xl text-bordo">{locales.length}+</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Barrios</dt>
              <dd className="titulo text-3xl text-bordo">{barrios}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Para empezar</dt>
              <dd className="titulo text-3xl text-bordo">Gratis</dd>
            </div>
          </dl>
        </div>
        <div className="relative mx-auto h-[400px] w-full max-w-md sm:h-[460px]">
          <FotoTarjeta src="/fotos/hiei-s-sushi-1.webp" nombre="Hiei's Sushi" detalle="🍣 Sushi · $$$ · Centro" match={97} className="absolute top-0 left-0 w-[64%] rotate-[-4deg]" />
          <FotoTarjeta
            src="/fotos/antares-1.webp"
            nombre="Antares"
            detalle="🍺 Cerveza · $$ · Güemes"
            match={91}
            className="absolute right-0 bottom-10 z-10 w-[58%] rotate-[4deg]"
          />
          <div className="absolute bottom-0 left-2 z-20 flex items-center gap-2 rounded-2xl bg-bordo px-4 py-3 text-sm font-bold text-crema shadow-lg">
            <Timer className="size-4 text-durazno" /> Elegido en 10 segundos
          </div>
        </div>
      </section>

      {/* Instagram + Maps */}
      <section className="bg-bordo text-crema">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-3 md:py-20">
          <div className="md:col-span-1">
            <h2 className="titulo text-4xl leading-tight">Lo mejor de Instagram y Google Maps, en una sola app.</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:col-span-2">
            <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
              <Newspaper className="size-7 text-durazno" />
              <p className="titulo mt-3 text-2xl">Lo que se ve</p>
              <p className="mt-1 text-crema/80">Fotos, posts y promos de los lugares que seguís, y reseñas de gente como vos.</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
              <MapPin className="size-7 text-durazno" />
              <p className="titulo mt-3 text-2xl">Dónde queda</p>
              <p className="mt-1 text-crema/80">Mapa con todo lo que tenés cerca y el camino para llegar con un toque.</p>
            </div>
            <div className="rounded-3xl bg-durazno p-6 text-bordo-osc sm:col-span-2">
              <Sparkles className="size-7" />
              <p className="titulo mt-3 text-2xl">Y un algoritmo que te conoce</p>
              <p className="mt-1">Cruza tus gustos, tu presupuesto, la hora y la distancia para decirte a dónde ir. Cuanto más lo usás, mejor te recomienda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:py-24">
        <h2 className="titulo text-center text-4xl text-bordo md:text-5xl">Cómo funciona</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PASOS.map((p, i) => (
            <div key={p.titulo} className="rounded-3xl bg-card p-6 ring-1 ring-foreground/5">
              <div className="flex items-center gap-3">
                <span className="titulo flex size-10 items-center justify-center rounded-full bg-bordo text-lg text-crema">{i + 1}</span>
                <p.icono className="size-6 text-bordo" />
              </div>
              <p className="titulo mt-4 text-2xl">{p.titulo}</p>
              <p className="mt-2 text-muted-foreground">{p.texto}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {FUNCIONES.map((f) => (
            <div key={f.titulo} className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rosa-claro text-bordo">
                <f.icono className="size-5" />
              </span>
              <div>
                <p className="font-bold">{f.titulo}</p>
                <p className="text-sm text-muted-foreground">{f.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Planes */}
      <section id="premium" className="scroll-mt-20 bg-suave/60">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
          <h2 className="titulo text-center text-4xl text-bordo md:text-5xl">Empezá gratis</h2>
          <p className="mt-2 text-center text-muted-foreground">Y cuando quieras más, pasate a Premium.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-3xl bg-card p-7 ring-1 ring-foreground/5">
              <p className="titulo text-2xl">Gratis</p>
              <p className="titulo mt-2 text-5xl">USD 0</p>
              <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm">
                {['Recomendaciones personalizadas', 'Refi, el asistente con IA: 1 consulta por semana', 'Mapa y feed', 'Reseñas y puntos', 'Canje de cupones'].map((b) => (
                  <li key={b} className="flex gap-2">
                    <Check className="size-5 text-bordo" /> {b}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" size="lg" className="mt-6">
                <Link href="/ingresar?modo=registro">Crear cuenta</Link>
              </Button>
            </div>
            <div className="relative flex flex-col rounded-3xl bg-bordo p-7 text-crema shadow-xl">
              <span className="absolute -top-3 right-6 rounded-full bg-durazno px-3 py-1 text-xs font-bold text-bordo-osc">Primer mes gratis</span>
              <p className="titulo text-2xl">Premium</p>
              <p className="mt-2">
                <span className="titulo text-5xl">USD {PREMIUM_USD}</span> <span className="text-crema/70">/ mes</span>
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm">
                {['Todo lo del plan gratis', 'Uso ilimitado de Refi', 'Reservas sin llamar', 'Descuentos exclusivos', 'Filtros: pet friendly, sin TACC, vista al mar…', 'Sin publicidad'].map((b) => (
                  <li key={b} className="flex gap-2">
                    <Check className="size-5 text-durazno" /> {b}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-6 bg-durazno text-bordo-osc hover:bg-durazno/90">
                <Link href={perfil ? '/premium' : '/ingresar?modo=registro'}>Probar Premium</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Negocios */}
      <section id="negocios" className="scroll-mt-20 bg-bordo-osc text-crema">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-durazno">Para cafés, bares y restaurantes</span>
            <h2 className="titulo mt-4 text-4xl leading-tight md:text-5xl">Que te encuentren justo cuando tienen hambre.</h2>
            <p className="mt-4 text-crema/80">
              Sumá tu local a ReComiendo y aparecé en las recomendaciones de quienes buscan exactamente lo que ofrecés. Y si querés más
              visibilidad, destacate con un espacio patrocinado.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 bg-durazno px-6 text-base text-bordo-osc hover:bg-durazno/90">
                <a href={contactHref()} target="_blank" rel="noopener noreferrer">
                  Quiero sumar mi local
                </a>
              </Button>
            </div>
          </div>
          <ul className="grid gap-3">
            {NEGOCIOS.map((n) => (
              <li key={n.texto} className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-durazno text-bordo-osc">
                  <n.icono className="size-5" />
                </span>
                {n.texto}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
        <UtensilsCrossed className="mx-auto size-10 text-bordo" />
        <h2 className="titulo mt-4 text-4xl text-bordo md:text-5xl">¿Qué tenés ganas hoy?</h2>
        <p className="mt-3 text-lg text-muted-foreground">Creá tu cuenta en un minuto y te decimos a dónde ir.</p>
        <Button asChild size="lg" className="mt-6 h-12 px-8 text-base">
          <Link href={perfil ? destino : '/ingresar?modo=registro'}>{perfil ? 'Ir a la app' : 'Empezar gratis'}</Link>
        </Button>
      </section>

      <footer className="border-t border-bordo/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <p className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={22} height={22} className="rounded" /> ReComiendo · Mar del Plata
          </p>
          <nav className="flex gap-5">
            <Link href="/explorar" className="hover:text-bordo">Explorar</Link>
            <Link href="/mapa" className="hover:text-bordo">Mapa</Link>
            <a href="#negocios" className="hover:text-bordo">Para locales</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

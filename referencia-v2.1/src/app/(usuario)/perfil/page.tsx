import Link from 'next/link'
import { Coins, Crown, LogOut, Pencil, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TarjetaLocal } from '@/components/comunes/tarjeta-local'
import { Estrellas } from '@/components/comunes/estrellas'
import { requerirRol } from '@/lib/services/auth'
import { misFavoritos, misResenas, misReservas } from '@/lib/services/usuarios'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA, PRECIO_TEXTO } from '@/lib/tipos'
import { accionSalir } from '../../(auth)/acciones'
import { BotonCancelarReserva } from './cancelar'

export const metadata = { title: 'Perfil' }

const ESTADO_RESERVA = { pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada', usada: 'Usada' } as const

export default async function PaginaPerfil() {
  const perfil = await requerirRol()
  const [reservas, resenas, favoritos] = await Promise.all([misReservas(perfil.id), misResenas(perfil.id), misFavoritos(perfil.id)])
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <section className="flex items-center gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/5">
        <div className="titulo flex size-16 items-center justify-center rounded-full bg-bordo text-3xl text-crema">
          {perfil.nombre.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="titulo truncate text-2xl">{perfil.nombre}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-sm">
            <Link href="/puntos" className="flex items-center gap-1 font-bold text-bordo">
              <Coins className="size-4" /> {perfil.puntos} puntos
            </Link>
            {perfil.es_premium ? (
              <Badge className="bg-durazno text-bordo-osc">
                <Crown /> Premium
              </Badge>
            ) : (
              <Link href="/premium" className="text-muted-foreground underline">
                Hoy usás la versión gratis
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
        <div className="flex items-center justify-between">
          <h2 className="titulo text-xl">Tus gustos</h2>
          <Button asChild size="sm" variant="ghost">
            <Link href="/gustos">
              <Pencil /> Editar
            </Link>
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {perfil.categorias.map((c) => (
            <Badge key={c} variant="secondary">
              {EMOJI_CATEGORIA[c]} {NOMBRE_CATEGORIA[c]}
            </Badge>
          ))}
          <Badge variant="outline">{PRECIO_TEXTO[perfil.precio]}</Badge>
          <Badge variant="outline">{perfil.modo === 'descubrir' ? 'Descubrir' : 'Ir a lo seguro'}</Badge>
        </div>
      </section>

      <section>
        <h2 className="titulo mb-2 text-xl">Mis reservas</h2>
        {reservas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no reservaste. Con Premium reservás desde la ficha de cada lugar.</p>
        ) : (
          <div className="grid gap-2">
            {reservas.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 text-sm ring-1 ring-foreground/5">
                <div>
                  <Link href={`/local/${r.local_id}`} className="font-bold hover:text-bordo">
                    {r.local?.nombre}
                  </Link>
                  <p className="text-muted-foreground">
                    {new Date(r.fecha + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {r.hora} · {r.personas} pers. ·{' '}
                    <span className="font-mono">{r.codigo}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ESTADO_RESERVA[r.estado]}</Badge>
                  {(r.estado === 'pendiente' || r.estado === 'confirmada') && <BotonCancelarReserva id={r.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {favoritos.length > 0 && (
        <section>
          <h2 className="titulo mb-2 text-xl">Guardados</h2>
          <div className="grid gap-2">
            {favoritos.map((l) => (
              <TarjetaLocal key={l.id} local={l} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="titulo mb-2 text-xl">Mis reseñas</h2>
        {resenas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cuando vayas a un lugar, reseñalo y sumá puntos.</p>
        ) : (
          <div className="grid gap-2">
            {resenas.map((r) => (
              <Link key={r.id} href={`/local/${r.local_id}`} className="rounded-2xl bg-card p-3 text-sm ring-1 ring-foreground/5">
                <div className="flex items-center justify-between">
                  <b>{r.local?.nombre}</b>
                  <Estrellas valor={r.estrellas} />
                </div>
                {r.texto && <p className="mt-1 text-muted-foreground">{r.texto}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        {perfil.rol === 'usuario' && (
          <Button asChild variant="outline">
            <Link href="/negocios">
              <Store /> ¿Tenés un local? Sumalo a ReComiendo
            </Link>
          </Button>
        )}
        {perfil.rol === 'negocio' && (
          <Button asChild variant="outline">
            <Link href="/clientes">
              <Store /> Ir al panel de mi negocio
            </Link>
          </Button>
        )}
        {perfil.rol === 'superadmin' && (
          <Button asChild variant="outline">
            <Link href="/superadmin">Ir al panel superadmin</Link>
          </Button>
        )}
        <form action={accionSalir}>
          <Button type="submit" variant="ghost" className="w-full text-muted-foreground">
            <LogOut /> Cerrar sesión
          </Button>
        </form>
      </section>
    </div>
  )
}

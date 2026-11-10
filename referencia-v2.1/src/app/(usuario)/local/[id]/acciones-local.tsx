'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOptimistic, useState, useTransition } from 'react'
import { Bookmark, CalendarCheck, Crown, UserCheck, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { accionFavorito, accionReservar, accionSeguir } from '../../acciones'

type Relacion = { sigue: boolean; favorito: boolean }

export function BotonesSociales({ localId, logueado, sigue, favorito }: { localId: string; logueado: boolean; sigue: boolean; favorito: boolean }) {
  const router = useRouter()
  const [estado, setOptimista] = useOptimistic<Relacion, Partial<Relacion>>({ sigue, favorito }, (s, cambio) => ({ ...s, ...cambio }))
  const [, empezar] = useTransition()
  const exigirLogin = () => router.push(`/login?volver=/local/${localId}`)
  return (
    <div className="flex gap-2">
      <Button
        variant={estado.sigue ? 'secondary' : 'default'}
        onClick={() =>
          logueado
            ? empezar(async () => {
                setOptimista({ sigue: !estado.sigue })
                await accionSeguir(localId)
              })
            : exigirLogin()
        }
      >
        {estado.sigue ? <UserCheck /> : <UserPlus />} {estado.sigue ? 'Siguiendo' : 'Seguir'}
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label={estado.favorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        onClick={() =>
          logueado
            ? empezar(async () => {
                setOptimista({ favorito: !estado.favorito })
                await accionFavorito(localId)
              })
            : exigirLogin()
        }
      >
        <Bookmark className={cn(estado.favorito && 'fill-bordo text-bordo')} />
      </Button>
    </div>
  )
}

type Turno = { hora: string; estado: 'libre' | 'pocos' | 'lleno' }

export function Reservar({
  localId,
  nombre,
  turnos,
  logueado,
  premium,
}: {
  localId: string
  nombre: string
  turnos: Turno[]
  logueado: boolean
  premium: boolean
}) {
  const [hora, setHora] = useState<string | null>(null)
  const [personas, setPersonas] = useState(2)
  const [codigo, setCodigo] = useState<string | null>(null)
  const [pendiente, empezar] = useTransition()

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="titulo text-xl">Reservá sin llamar</h2>
        {!premium && (
          <span className="flex items-center gap-1 text-xs font-bold text-bordo">
            <Crown className="size-3.5" /> Premium
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {turnos.map((t) => (
          <span
            key={t.hora}
            className={cn(
              'rounded-xl px-2 py-2 text-center text-sm font-bold',
              t.estado === 'libre' && 'bg-green-100 text-green-800',
              t.estado === 'pocos' && 'bg-orange-100 text-orange-800',
              t.estado === 'lleno' && 'bg-muted text-muted-foreground line-through',
            )}
          >
            {t.hora}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Disponibilidad informada por el local en tiempo real.</p>
      {!logueado ? (
        <Button asChild className="mt-3 w-full">
          <Link href={`/login?volver=/local/${localId}`}>Entrá para reservar</Link>
        </Button>
      ) : !premium ? (
        <Button asChild className="mt-3 w-full">
          <Link href={`/premium?volver=/local/${localId}`}>Probar Premium gratis</Link>
        </Button>
      ) : (
        <Dialog onOpenChange={(abierto) => !abierto && setCodigo(null)}>
          <DialogTrigger asChild>
            <Button className="mt-3 w-full">
              <CalendarCheck /> Reservar
            </Button>
          </DialogTrigger>
          <DialogContent>
            {codigo ? (
              <>
                <DialogHeader>
                  <DialogTitle className="titulo text-2xl text-bordo">¡Listo, reservado!</DialogTitle>
                  <DialogDescription>
                    {nombre} · hoy a las {hora} · {personas} {personas === 1 ? 'persona' : 'personas'}
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-2xl border-2 border-dashed border-bordo/40 bg-suave p-4 text-center">
                  <p className="text-xs text-muted-foreground">Código de reserva</p>
                  <p className="titulo text-3xl tracking-wider text-bordo">{codigo}</p>
                </div>
                <p className="text-sm text-muted-foreground">Mostralo al llegar. Si no podés ir, cancelá desde tu perfil.</p>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="titulo text-2xl">Confirmá tu reserva</DialogTitle>
                  <DialogDescription>{nombre} · hoy</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-2">
                  {turnos.map((t) => (
                    <button
                      key={t.hora}
                      type="button"
                      disabled={t.estado === 'lleno'}
                      onClick={() => setHora(t.hora)}
                      className={cn(
                        'rounded-xl border-2 px-2 py-2 text-sm font-bold disabled:opacity-40',
                        hora === t.hora ? 'border-bordo bg-rosa-claro text-bordo' : 'border-border',
                      )}
                    >
                      {t.hora}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                  <span className="text-sm font-medium">Personas</span>
                  <div className="flex items-center gap-3">
                    <Button size="icon-sm" variant="outline" onClick={() => setPersonas(Math.max(1, personas - 1))}>
                      −
                    </Button>
                    <span className="w-5 text-center font-bold">{personas}</span>
                    <Button size="icon-sm" variant="outline" onClick={() => setPersonas(Math.min(20, personas + 1))}>
                      +
                    </Button>
                  </div>
                </div>
                <Button
                  size="lg"
                  disabled={!hora || pendiente}
                  onClick={() =>
                    empezar(async () => {
                      const r = await accionReservar({ localId, hora: hora!, personas })
                      if ('error' in r) toast.error(r.error)
                      else setCodigo(r.codigo)
                    })
                  }
                >
                  {pendiente ? 'Reservando…' : 'Confirmar'}
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

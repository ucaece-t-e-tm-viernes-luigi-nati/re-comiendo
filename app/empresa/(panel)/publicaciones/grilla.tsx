'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NOMBRE_TIPO_PUBLICACION, type Publicacion } from '@/lib/tipos'
import { accionBorrarPublicacion } from '../acciones'
import { mensaje, ok } from '../_componentes/resultado'

export function GrillaPublicaciones({ publicaciones, soloLectura = false }: { publicaciones: Publicacion[]; soloLectura?: boolean }) {
  const [pendiente, iniciar] = useTransition()

  function borrar(id: string) {
    iniciar(async () => {
      try {
        ok(await accionBorrarPublicacion(id))
        toast.success('Publicación borrada')
      } catch (e) {
        toast.error(mensaje(e, 'No pudimos borrar la publicación'))
      }
    })
  }

  if (!publicaciones.length) {
    return <p className="text-sm text-muted-foreground">Todavía no tenés publicaciones.</p>
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {publicaciones.map((p) => (
        <div key={p.id} className="flex gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
          {p.foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.foto} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge className={p.tipo === 'promo' ? 'bg-durazno text-bordo-osc' : undefined} variant={p.tipo === 'promo' ? 'default' : 'secondary'}>
                {NOMBRE_TIPO_PUBLICACION[p.tipo]}
              </Badge>
              {p.vence && <span className="text-xs text-muted-foreground">Vence {p.vence.split('-').reverse().join('/')}</span>}
            </div>
            <p className="line-clamp-3 text-sm">{p.texto}</p>
            <Button variant="ghost" size="sm" className="mt-auto w-fit text-destructive" onClick={() => borrar(p.id)} disabled={pendiente || soloLectura}>
              <Trash2 className="size-3.5" />
              Borrar
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

import { Estrellas } from '@/components/comunes/estrellas'
import { requerirRol } from '@/lib/services/auth'
import { resenasParaModerar } from '@/lib/services/metricas'
import { cn } from '@/lib/utils'
import { BotonModerarResena } from '../_componentes/acciones-ui'

export default async function PaginaResenas() {
  await requerirRol('superadmin')
  const resenas = await resenasParaModerar()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="titulo text-3xl text-bordo">Reseñas</h1>

      <div className="flex flex-col gap-3">
        {resenas.map((r) => (
          <div
            key={r.id}
            className={cn('flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/5', r.oculta && 'opacity-60')}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">
                  {r.autor} <span className="font-normal text-muted-foreground">· {r.local?.nombre ?? 'Local eliminado'}</span>
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Estrellas valor={r.estrellas} />
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('es-AR')}</span>
                  {r.oculta && <span className="text-xs font-bold text-muted-foreground">Oculta</span>}
                </div>
              </div>
              <BotonModerarResena id={r.id} oculta={r.oculta} />
            </div>
            {r.texto && <p className="text-sm leading-relaxed">{r.texto}</p>}
          </div>
        ))}
        {resenas.length === 0 && <p className="py-6 text-center text-muted-foreground">Todavía no hay reseñas.</p>}
      </div>
    </div>
  )
}

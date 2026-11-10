import { requireLocalConFicha } from '@/lib/guards'
import { publicacionesDe } from '@/lib/services/negocios'
import { FormularioPublicacion } from './formulario'
import { GrillaPublicaciones } from './grilla'

export default async function PaginaPublicaciones() {
  const { local, readOnly } = await requireLocalConFicha('posts.manage')
  const publicaciones = await publicacionesDe(local.id)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="titulo text-2xl text-bordo-osc">Menú, novedades y promos</h1>
        <p className="text-sm text-muted-foreground">Publicá tu carta, novedades y promos: aparecen en tu ficha, en el feed y en Eventos.</p>
      </div>
      <FormularioPublicacion soloLectura={readOnly} />
      <GrillaPublicaciones publicaciones={publicaciones} soloLectura={readOnly} />
    </div>
  )
}

import { requireLocalConFicha } from '@/lib/guards'
import { resenasPara } from '@/lib/services/negocios'
import { ListaResenas } from './lista'

export default async function PaginaResenas() {
  const { local } = await requireLocalConFicha('reviews.reply')
  const resenas = await resenasPara(local.id)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="titulo text-2xl text-bordo-osc">Reseñas</h1>
        <p className="text-sm text-muted-foreground">Respondé a tus clientes para generar confianza.</p>
      </div>
      <ListaResenas resenas={resenas} />
    </div>
  )
}

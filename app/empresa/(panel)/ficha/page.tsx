import { requireLocalConFicha } from '@/lib/guards'
import { FormularioFicha } from './formulario'

export default async function PaginaFicha() {
  const { local, readOnly } = await requireLocalConFicha('local.edit')

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="titulo text-2xl text-bordo-osc">Mi ficha</h1>
        <p className="text-sm text-muted-foreground">Así te van a ver tus clientes en ReComiendo.</p>
      </div>
      <FormularioFicha local={local} soloLectura={readOnly} />
    </div>
  )
}

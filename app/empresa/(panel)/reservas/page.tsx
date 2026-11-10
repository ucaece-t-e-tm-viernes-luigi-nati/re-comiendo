import { requireLocalConFicha } from '@/lib/guards'
import { reservasDe } from '@/lib/services/negocios'
import { TablaReservas } from './tabla'
import { ValidarCodigo } from './validar-codigo'

export default async function PaginaReservas() {
  const { local } = await requireLocalConFicha('reservations.manage')
  const reservas = await reservasDe(local.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo text-2xl text-bordo-osc">Reservas</h1>
        <p className="text-sm text-muted-foreground">Validá códigos en el mostrador y gestioná las reservas.</p>
      </div>
      <ValidarCodigo />
      <TablaReservas reservas={reservas} />
    </div>
  )
}

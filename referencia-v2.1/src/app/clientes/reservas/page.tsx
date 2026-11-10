import { redirect } from 'next/navigation'
import { requerirRol } from '@/lib/services/auth'
import { miLocal, reservasDe } from '@/lib/services/negocios'
import { TablaReservas } from './tabla'
import { ValidarCodigo } from './validar-codigo'

export default async function PaginaReservas() {
  const perfil = await requerirRol('negocio')
  const local = await miLocal(perfil)
  if (!local) redirect('/negocios')
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

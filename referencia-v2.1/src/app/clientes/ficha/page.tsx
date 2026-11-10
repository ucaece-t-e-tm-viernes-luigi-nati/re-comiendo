import { redirect } from 'next/navigation'
import { requerirRol } from '@/lib/services/auth'
import { miLocal } from '@/lib/services/negocios'
import { FormularioFicha } from './formulario'

export default async function PaginaFicha() {
  const perfil = await requerirRol('negocio')
  const local = await miLocal(perfil)
  if (!local) redirect('/negocios')

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="titulo text-2xl text-bordo-osc">Mi ficha</h1>
        <p className="text-sm text-muted-foreground">Así te van a ver tus clientes en ReComiendo.</p>
      </div>
      <FormularioFicha local={local} userId={perfil.id} />
    </div>
  )
}

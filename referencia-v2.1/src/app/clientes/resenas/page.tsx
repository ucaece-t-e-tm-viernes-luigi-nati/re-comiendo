import { redirect } from 'next/navigation'
import { requerirRol } from '@/lib/services/auth'
import { miLocal, resenasPara } from '@/lib/services/negocios'
import { ListaResenas } from './lista'

export default async function PaginaResenas() {
  const perfil = await requerirRol('negocio')
  const local = await miLocal(perfil)
  if (!local) redirect('/negocios')
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

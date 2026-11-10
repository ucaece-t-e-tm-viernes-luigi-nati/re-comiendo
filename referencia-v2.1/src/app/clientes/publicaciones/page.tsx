import { redirect } from 'next/navigation'
import { requerirRol } from '@/lib/services/auth'
import { miLocal, publicacionesDe } from '@/lib/services/negocios'
import { FormularioPublicacion } from './formulario'
import { GrillaPublicaciones } from './grilla'

export default async function PaginaPublicaciones() {
  const perfil = await requerirRol('negocio')
  const local = await miLocal(perfil)
  if (!local) redirect('/negocios')
  const publicaciones = await publicacionesDe(local.id)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="titulo text-2xl text-bordo-osc">Publicaciones</h1>
        <p className="text-sm text-muted-foreground">Compartí novedades o promos con tus clientes.</p>
      </div>
      <FormularioPublicacion userId={perfil.id} localId={local.id} />
      <GrillaPublicaciones publicaciones={publicaciones} />
    </div>
  )
}

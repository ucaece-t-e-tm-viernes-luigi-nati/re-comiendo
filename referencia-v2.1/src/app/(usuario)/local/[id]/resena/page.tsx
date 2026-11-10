import { notFound } from 'next/navigation'
import { requerirRol } from '@/lib/services/auth'
import { obtenerLocal } from '@/lib/services/locales'
import { FormularioResena } from './formulario'

export const metadata = { title: 'Reseñar' }

export default async function PaginaResena({ params }: PageProps<'/local/[id]/resena'>) {
  const perfil = await requerirRol()
  const local = await obtenerLocal((await params).id)
  if (!local) notFound()
  return <FormularioResena localId={local.id} nombre={local.nombre} userId={perfil.id} />
}

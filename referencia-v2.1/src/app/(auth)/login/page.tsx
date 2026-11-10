import { redirect } from 'next/navigation'
import { FormularioLogin, type Acceso } from '../formulario'

export const metadata = { title: 'Entrar' }

export default async function PaginaLogin({ searchParams }: PageProps<'/login'>) {
  const { volver } = await searchParams
  const v = typeof volver === 'string' ? volver : undefined
  if (v?.startsWith('/clientes')) redirect('/negocios/ingresar')
  const acceso: Acceso = v?.startsWith('/clientes') ? 'clientes' : v?.startsWith('/superadmin') ? 'superadmin' : 'usuario'
  return <FormularioLogin volver={v} acceso={acceso} />
}

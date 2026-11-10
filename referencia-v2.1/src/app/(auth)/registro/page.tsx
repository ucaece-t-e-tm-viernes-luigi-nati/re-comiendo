import { redirect } from 'next/navigation'
import { FormularioRegistro } from '../formulario'

export const metadata = { title: 'Crear cuenta' }

export default async function PaginaRegistro({ searchParams }: PageProps<'/registro'>) {
  // Los links viejos de alta de negocio van al onboarding propio.
  const { negocio } = await searchParams
  if (negocio === '1') redirect('/negocios')
  return <FormularioRegistro />
}

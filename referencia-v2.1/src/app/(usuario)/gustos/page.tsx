import { requerirRol } from '@/lib/services/auth'
import { FormularioGustos } from './formulario'

export const metadata = { title: 'Tus gustos' }

export default async function PaginaGustos() {
  const perfil = await requerirRol()
  return (
    <FormularioGustos
      inicial={{ nombre: perfil.nombre, categorias: perfil.categorias, precio: perfil.precio, modo: perfil.modo }}
      primeraVez={!perfil.onboarding_ok}
    />
  )
}

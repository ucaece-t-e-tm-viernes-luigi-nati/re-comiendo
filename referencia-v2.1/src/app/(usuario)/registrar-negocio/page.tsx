import { redirect } from 'next/navigation'

// Ruta vieja: el alta de negocios ahora vive en /negocios.
export default function RegistrarNegocio() {
  redirect('/negocios')
}

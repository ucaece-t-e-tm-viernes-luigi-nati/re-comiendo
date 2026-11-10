import { FormularioLogin } from '../../(auth)/formulario'

export const metadata = { title: 'Acceso para negocios' }

export default function IngresarNegocio() {
  return <FormularioLogin volver="/clientes" acceso="clientes" />
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { obtenerPerfil } from '@/lib/services/auth'
import { miLocal } from '@/lib/services/negocios'
import { Onboarding, SolicitudEnviada } from './onboarding'

export const metadata = { title: 'Sumá tu negocio' }

export default async function PaginaNegocios() {
  const perfil = await obtenerPerfil()
  if (perfil?.rol === 'superadmin') {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Estás con la cuenta del equipo. Para probar el alta de un negocio, cerrá sesión o usá otro navegador.{' '}
        <Link href="/superadmin/locales" className="font-bold text-bordo">
          Ir a Pendientes
        </Link>
      </p>
    )
  }
  const local = perfil ? await miLocal(perfil) : null
  // Con la solicitud en revisión se queda el aviso de 48 horas (al enviar, Next vuelve a renderizar esta página).
  if (local?.estado === 'activo') redirect('/clientes')
  if (local) return <SolicitudEnviada nombre={local.nombre} />
  return <Onboarding conCuenta={!!perfil} nombre={perfil?.nombre ?? ''} />
}

import { requerirRol } from '@/lib/services/auth'
import { localesParaGestion } from '@/lib/services/metricas'
import { BarraMobilAdmin, SidebarAdmin } from './_componentes/nav'

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  await requerirRol('superadmin')
  const locales = await localesParaGestion()
  const pendientes = locales.filter((l) => l.estado === 'pendiente').length

  return (
    <div className="flex min-h-dvh bg-crema">
      <SidebarAdmin pendientes={pendientes} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraMobilAdmin pendientes={pendientes} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}

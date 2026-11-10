import { Bot } from 'lucide-react'
import { requireSuperadmin } from '@/lib/guards'
import { estadoApiKeyClaude } from '@/lib/services/refi'
import { FormularioApiKey } from './formulario'

export const metadata = { title: 'Ajustes' }

export default async function PaginaAjustes() {
  await requireSuperadmin()
  const estado = await estadoApiKeyClaude()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="titulo text-3xl text-bordo">Ajustes</h1>
      <section className="flex max-w-2xl flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-durazno text-bordo-osc">
            <Bot className="size-5" />
          </span>
          <div>
            <h2 className="titulo text-xl text-bordo-osc">Agente IA de Refi (Claude)</h2>
            <p className="text-sm text-muted-foreground">
              Pegá la API key de Claude Platform (console.anthropic.com → API keys). Por ahora Refi funciona en modo demo; esta clave es la
              que va a usar el agente cuando lo conectemos. Se guarda sólo en el servidor y acá se muestran los últimos 4 caracteres.
            </p>
          </div>
        </div>
        <FormularioApiKey conectada={estado.conectada} final={estado.final} actualizada={estado.actualizada} />
      </section>
    </div>
  )
}

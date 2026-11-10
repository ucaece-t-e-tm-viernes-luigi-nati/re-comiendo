import { Check } from 'lucide-react'
import { requerirRol } from '@/lib/services/auth'
import { PREMIUM_USD } from '@/lib/tipos'
import { BotonesPremium } from './botones'

export const metadata = { title: 'Premium' }

const BENEFICIOS = [
  'Uso ilimitado de Refi, tu asistente con IA',
  'Reservá sin llamar, con código',
  'Descuentos exclusivos en locales aliados',
  'Más filtros: pet friendly, sin TACC, vista al mar…',
  'Sin publicidad',
]

export default async function PaginaPremium({ searchParams }: PageProps<'/premium'>) {
  const perfil = await requerirRol()
  const { volver } = await searchParams
  return (
    <div className="mx-auto max-w-lg">
      <section className="flex flex-col gap-5 rounded-3xl bg-bordo p-6 text-crema shadow-lg">
        <h1 className="titulo text-4xl">{perfil.es_premium ? '¡Ya sos Premium!' : 'ReComiendo Premium'}</h1>
        {perfil.es_premium ? (
          <p className="opacity-90">Tenés Refi ilimitado, reservas, descuentos y filtros desbloqueados.</p>
        ) : (
          <p>
            <span className="titulo text-5xl">USD {PREMIUM_USD}</span> <span className="opacity-80">/ mes</span>
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {BENEFICIOS.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <Check className="size-5 text-durazno" /> {b}
            </li>
          ))}
        </ul>
        <BotonesPremium premium={perfil.es_premium} volver={typeof volver === 'string' && volver.startsWith('/') ? volver : undefined} />
        {!perfil.es_premium && <p className="text-center text-xs opacity-70">Primer mes gratis · cancelás cuando quieras · pago simulado (próximamente Mercado Pago)</p>}
      </section>
    </div>
  )
}

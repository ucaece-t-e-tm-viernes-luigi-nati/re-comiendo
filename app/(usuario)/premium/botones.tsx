'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { accionActivarPremium, accionCancelarPremium } from '../acciones'

export function BotonesPremium({ premium, volver }: { premium: boolean; volver?: string }) {
  const router = useRouter()
  const [pendiente, empezar] = useTransition()
  if (premium) {
    return (
      <div className="flex flex-col gap-2">
        {volver?.startsWith('/local') && (
          <Button size="lg" className="bg-durazno text-bordo-osc hover:bg-durazno/90" onClick={() => router.push(volver)}>
            Volver a reservar
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-rosa-claro hover:bg-white/10 hover:text-crema"
          disabled={pendiente}
          onClick={() => empezar(async () => {
            await accionCancelarPremium()
            toast('Cancelaste Premium')
          })}
        >
          Cancelar suscripción
        </Button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="bg-durazno text-bordo-osc hover:bg-durazno/90"
        disabled={pendiente}
        onClick={() =>
          empezar(async () => {
            await accionActivarPremium()
            toast.success('¡Ya sos Premium! Tu primer mes es gratis')
            if (volver) router.push(volver)
          })
        }
      >
        {pendiente ? 'Activando…' : 'Probar Premium gratis'}
      </Button>
      <Button variant="ghost" className="text-rosa-claro hover:bg-white/10 hover:text-crema" onClick={() => router.push(volver ?? '/inicio')}>
        Seguir con la versión gratis
      </Button>
    </div>
  )
}

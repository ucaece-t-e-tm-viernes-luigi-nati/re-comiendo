'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { accionCanjear } from '../acciones'

export function BotonCanjear({ premioId, costo, alcanza }: { premioId: string; costo: number; alcanza: boolean }) {
  const [pendiente, empezar] = useTransition()
  return (
    <Button
      disabled={!alcanza || pendiente}
      onClick={() =>
        empezar(async () => {
          const r = await accionCanjear(premioId)
          if ('error' in r) toast.error(r.error)
          else toast.success(`¡Canjeado! Tu código es ${r.codigo}`)
        })
      }
    >
      {costo} pts
    </Button>
  )
}

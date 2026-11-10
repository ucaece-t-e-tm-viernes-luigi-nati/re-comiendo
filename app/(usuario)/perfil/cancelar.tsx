'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { accionCancelarReserva } from '../acciones'

export function BotonCancelarReserva({ id }: { id: string }) {
  const [pendiente, empezar] = useTransition()
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pendiente}
      onClick={() =>
        empezar(async () => {
          await accionCancelarReserva(id)
          toast('Reserva cancelada')
        })
      }
    >
      Cancelar
    </Button>
  )
}

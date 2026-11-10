'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { EstadoLocal } from '@/lib/tipos'
import { accionAlternarPremio, accionCambiarEstadoLocal, accionModerarResena } from '../acciones-red'


export function AccionesEstadoLocal({ id, estado }: { id: string; estado: EstadoLocal }) {
  const [pendiente, empezar] = useTransition()
  const cambiar = (nuevo: EstadoLocal, mensaje: string) =>
    empezar(async () => {
      await accionCambiarEstadoLocal(id, nuevo)
      toast.success(mensaje)
    })

  if (estado === 'pendiente') {
    return (
      <div className="flex gap-1.5">
        <Button size="sm" disabled={pendiente} onClick={() => cambiar('activo', 'Local aprobado')}>
          Aprobar
        </Button>
        <Button size="sm" variant="ghost" disabled={pendiente} onClick={() => cambiar('suspendido', 'Local rechazado')}>
          Rechazar
        </Button>
      </div>
    )
  }
  if (estado === 'activo') {
    return (
      <Button size="sm" variant="destructive" disabled={pendiente} onClick={() => cambiar('suspendido', 'Local suspendido')}>
        Suspender
      </Button>
    )
  }
  return (
    <Button size="sm" variant="secondary" disabled={pendiente} onClick={() => cambiar('activo', 'Local reactivado')}>
      Reactivar
    </Button>
  )
}

export function BotonModerarResena({ id, oculta }: { id: string; oculta: boolean }) {
  const [pendiente, empezar] = useTransition()
  return (
    <Button
      size="sm"
      variant={oculta ? 'secondary' : 'outline'}
      disabled={pendiente}
      onClick={() =>
        empezar(async () => {
          await accionModerarResena(id, !oculta)
          toast.success(oculta ? 'Reseña visible de nuevo' : 'Reseña ocultada')
        })
      }
    >
      {oculta ? 'Mostrar' : 'Ocultar'}
    </Button>
  )
}

export function SwitchPremioActivo({ id, activo }: { id: string; activo: boolean }) {
  const [pendiente, empezar] = useTransition()
  return (
    <Switch
      checked={activo}
      disabled={pendiente}
      onCheckedChange={(valor) =>
        empezar(async () => {
          await accionAlternarPremio(id, valor)
          toast.success(valor ? 'Premio activado' : 'Premio desactivado')
        })
      }
    />
  )
}

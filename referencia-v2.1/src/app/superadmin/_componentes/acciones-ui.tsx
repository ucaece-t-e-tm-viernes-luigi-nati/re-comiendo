'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { EstadoLocal, Rol } from '@/lib/tipos'
import { accionAlternarPremio, accionCambiarEstadoLocal, accionCambiarRolUsuario, accionModerarResena } from '../acciones'

const NOMBRE_ROL: Record<Rol, string> = { usuario: 'Usuario', negocio: 'Negocio', superadmin: 'Superadmin' }

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

export function SelectorRol({ id, rol, esUnoMismo }: { id: string; rol: Rol; esUnoMismo: boolean }) {
  const [pendiente, empezar] = useTransition()
  return (
    <Select
      value={rol}
      disabled={esUnoMismo || pendiente}
      onValueChange={(valor) =>
        empezar(async () => {
          const r = await accionCambiarRolUsuario(id, valor as Rol)
          if (r?.error) toast.error(r.error)
          else toast.success('Rol actualizado')
        })
      }
    >
      <SelectTrigger size="sm" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(['usuario', 'negocio', 'superadmin'] as Rol[]).map((r) => (
          <SelectItem key={r} value={r}>
            {NOMBRE_ROL[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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

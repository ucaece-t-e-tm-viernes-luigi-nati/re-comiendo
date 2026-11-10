'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Reserva } from '@/lib/tipos'
import { accionCambiarEstadoReserva } from '../acciones'
import { mensaje, ok } from '../_componentes/resultado'

const ESTADO_VARIANTE: Record<Reserva['estado'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendiente: 'outline',
  confirmada: 'default',
  cancelada: 'destructive',
  usada: 'secondary',
}

const ESTADO_TEXTO: Record<Reserva['estado'], string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  usada: 'Usada',
}

export function TablaReservas({ reservas }: { reservas: (Reserva & { cliente: string })[] }) {
  const [pendiente, iniciar] = useTransition()

  function cambiar(id: string, estado: 'confirmada' | 'cancelada' | 'usada') {
    iniciar(async () => {
      try {
        ok(await accionCambiarEstadoReserva(id, estado))
        toast.success('Reserva actualizada')
      } catch (e) {
        toast.error(mensaje(e, 'No pudimos actualizar la reserva'))
      }
    })
  }

  if (!reservas.length) {
    return <p className="text-sm text-muted-foreground">Todavía no tenés reservas.</p>
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Personas</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservas.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.fecha}</TableCell>
              <TableCell>{r.hora}</TableCell>
              <TableCell>{r.cliente}</TableCell>
              <TableCell>{r.personas}</TableCell>
              <TableCell className="font-mono text-xs">{r.codigo}</TableCell>
              <TableCell>
                <Badge variant={ESTADO_VARIANTE[r.estado]}>{ESTADO_TEXTO[r.estado]}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  {r.estado === 'pendiente' && (
                    <>
                      <Button size="sm" variant="outline" disabled={pendiente} onClick={() => cambiar(r.id, 'confirmada')}>
                        Confirmar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" disabled={pendiente} onClick={() => cambiar(r.id, 'cancelada')}>
                        Cancelar
                      </Button>
                    </>
                  )}
                  {r.estado === 'confirmada' && (
                    <>
                      <Button size="sm" variant="outline" disabled={pendiente} onClick={() => cambiar(r.id, 'usada')}>
                        Marcar usada
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" disabled={pendiente} onClick={() => cambiar(r.id, 'cancelada')}>
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

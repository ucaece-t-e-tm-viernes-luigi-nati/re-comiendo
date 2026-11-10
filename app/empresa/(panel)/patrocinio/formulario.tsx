'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { accionContratarPatrocinio } from '../acciones'

export function FormularioPatrocinio({ planes }: { planes: readonly { dias: number; monto: number }[] }) {
  const [beneficio, setBeneficio] = useState('')
  const [dias, setDias] = useState(planes[0]?.dias ?? 7)
  const [pendiente, iniciar] = useTransition()

  function contratar() {
    const b = beneficio.trim()
    if (b.length < 3) {
      toast.error('Contanos el beneficio que vas a ofrecer')
      return
    }
    iniciar(async () => {
      try {
        const r = await accionContratarPatrocinio({ beneficio: b, dias })
        if (r && 'error' in r) toast.error(r.error)
        else {
          toast.success('Espacio contratado (pago simulado)')
          setBeneficio('')
        }
      } catch {
        toast.error('No pudimos contratar el espacio')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="beneficio">Beneficio a destacar</Label>
        <Input
          id="beneficio"
          placeholder="Ej: 2x1 en tragos todos los jueves"
          value={beneficio}
          onChange={(e) => setBeneficio(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Plan</Label>
        <div className="flex gap-2">
          {planes.map((p) => (
            <button
              key={p.dias}
              type="button"
              onClick={() => setDias(p.dias)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition',
                dias === p.dias ? 'border-bordo bg-bordo text-crema' : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {p.dias} días · USD {p.monto}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={contratar} disabled={pendiente} className="bg-bordo text-crema hover:bg-bordo/90">
          {pendiente ? 'Contratando…' : 'Contratá el espacio'}
        </Button>
      </div>
    </div>
  )
}

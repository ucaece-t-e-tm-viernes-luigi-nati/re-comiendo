'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { accionBorrarApiKeyClaude, accionGuardarApiKeyClaude } from '../acciones'

export function FormularioApiKey({ conectada, final, actualizada }: { conectada: boolean; final: string; actualizada: string | null }) {
  const [valor, setValor] = useState('')
  const [pendiente, empezar] = useTransition()
  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2 text-sm">
        Estado:
        {conectada ? (
          <>
            <Badge>Cargada · sk-ant-…{final}</Badge>
            {actualizada && <span className="text-xs text-muted-foreground">actualizada el {new Date(actualizada).toLocaleDateString('es-AR')}</span>}
          </>
        ) : (
          <Badge variant="outline">Sin cargar</Badge>
        )}
      </p>
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        action={() =>
          empezar(async () => {
            const r = await accionGuardarApiKeyClaude(valor)
            if (r.error) toast.error(r.error)
            else {
              toast.success('API key guardada')
              setValor('')
            }
          })
        }
      >
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="api-key">{conectada ? 'Reemplazar API key' : 'API key'}</Label>
          <Input id="api-key" type="password" autoComplete="off" placeholder="sk-ant-api03-…" value={valor} onChange={(e) => setValor(e.target.value)} required />
        </div>
        <Button type="submit" disabled={pendiente || !valor}>
          Guardar
        </Button>
        {conectada && (
          <Button
            type="button"
            variant="ghost"
            disabled={pendiente}
            onClick={() =>
              empezar(async () => {
                await accionBorrarApiKeyClaude()
                toast.success('API key borrada')
              })
            }
          >
            Borrar
          </Button>
        )}
      </form>
    </div>
  )
}

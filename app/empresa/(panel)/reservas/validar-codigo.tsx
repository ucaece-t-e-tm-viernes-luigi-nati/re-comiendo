'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { accionValidarCodigo } from '../acciones'

export function ValidarCodigo() {
  const [codigo, setCodigo] = useState('')
  const [pendiente, iniciar] = useTransition()

  function validar() {
    const c = codigo.trim()
    if (!c) return
    iniciar(async () => {
      try {
        const r = await accionValidarCodigo(c)
        if (r.ok) toast.success(r.mensaje)
        else toast.error(r.mensaje)
      } catch {
        toast.error('No pudimos validar el código')
      } finally {
        setCodigo('')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validar código</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="RES-… o RC-…"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              validar()
            }
          }}
          className="font-mono"
        />
        <Button onClick={validar} disabled={pendiente} className="bg-bordo text-crema hover:bg-bordo/90 sm:w-auto">
          {pendiente ? 'Validando…' : 'Validar'}
        </Button>
      </CardContent>
    </Card>
  )
}

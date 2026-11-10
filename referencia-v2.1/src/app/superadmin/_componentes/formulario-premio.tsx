'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { accionGuardarPremio } from '../acciones'

export function FormularioPremio({ locales }: { locales: { id: string; nombre: string }[] }) {
  const [id, setId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [localId, setLocalId] = useState('')
  const [costo, setCosto] = useState('')
  const [pendiente, empezar] = useTransition()

  const limpiar = () => {
    setId('')
    setTitulo('')
    setLocalId('')
    setCosto('')
  }

  const enviar = () =>
    empezar(async () => {
      const r = await accionGuardarPremio({ id: id.trim(), titulo: titulo.trim(), local_id: localId, costo: Number(costo) })
      if (r?.error) toast.error(r.error)
      else {
        toast.success('Premio guardado')
        limpiar()
      }
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear premio</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5">
          <Label htmlFor="premio-id">ID (slug)</Label>
          <Input id="premio-id" placeholder="cafe-gratis" value={id} onChange={(e) => setId(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="premio-titulo">Título</Label>
          <Input id="premio-titulo" placeholder="Café gratis" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Local</Label>
          <Select value={localId} onValueChange={setLocalId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elegí un local" />
            </SelectTrigger>
            <SelectContent>
              {locales.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="premio-costo">Costo en puntos</Label>
          <Input id="premio-costo" type="number" min={1} placeholder="100" value={costo} onChange={(e) => setCosto(e.target.value)} />
        </div>
        <Button
          className="sm:col-span-2 lg:col-span-4"
          disabled={pendiente || !id.trim() || !titulo.trim() || !localId || !costo}
          onClick={enviar}
        >
          {pendiente ? 'Guardando…' : 'Guardar premio'}
        </Button>
      </CardContent>
    </Card>
  )
}

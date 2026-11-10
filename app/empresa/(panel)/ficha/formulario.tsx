'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Local, Momento, Precio } from '@/lib/tipos'
import { NOMBRE_MOMENTO, PRECIO_TEXTO, TAGS } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { accionActualizarFicha } from '../acciones'
import { mensaje, ok } from '../_componentes/resultado'
import { SubirFoto } from '../_componentes/subir-foto'

const MOMENTOS = Object.keys(NOMBRE_MOMENTO) as Momento[]

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]
}

export function FormularioFicha({ local, soloLectura = false }: { local: Local; soloLectura?: boolean }) {
  const [nombre, setNombre] = useState(local.nombre)
  const [barrio, setBarrio] = useState(local.barrio)
  const [direccion, setDireccion] = useState(local.direccion)
  const [lat, setLat] = useState(local.lat?.toString() ?? '')
  const [lng, setLng] = useState(local.lng?.toString() ?? '')
  const [precio, setPrecio] = useState<Precio>(local.precio)
  const [momentos, setMomentos] = useState<Momento[]>(local.momentos)
  const [tags, setTags] = useState<string[]>(local.tags)
  const [platos, setPlatos] = useState<string[]>(local.platos)
  const [platoNuevo, setPlatoNuevo] = useState('')
  const [descripcion, setDescripcion] = useState(local.descripcion)
  const [instagram, setInstagram] = useState(local.instagram)
  const [horarios, setHorarios] = useState(local.horarios)
  const [fotos, setFotos] = useState<string[]>(local.fotos)
  const [pendiente, iniciar] = useTransition()

  function agregarPlato() {
    const texto = platoNuevo.trim()
    if (!texto) return
    setPlatos([...platos, texto])
    setPlatoNuevo('')
  }

  function guardar() {
    iniciar(async () => {
      try {
        ok(
          await accionActualizarFicha({
          nombre,
          barrio,
          direccion,
          lat: lat.trim() ? Number(lat) : null,
          lng: lng.trim() ? Number(lng) : null,
          precio,
          momentos,
          tags,
          platos,
          descripcion,
          instagram,
          horarios,
          fotos,
          }),
        )
        toast.success('Guardamos los cambios de tu ficha')
      } catch (e) {
        toast.error(mensaje(e, 'No pudimos guardar los cambios, revisá los datos'))
      }
    })
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Datos básicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="barrio">Barrio</Label>
              <Input id="barrio" value={barrio} onChange={(e) => setBarrio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="lat">Latitud</Label>
              <Input id="lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lng">Longitud</Label>
              <Input id="lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precio">Precio</Label>
              <Select value={String(precio)} onValueChange={(v) => setPrecio(Number(v) as Precio)}>
                <SelectTrigger id="precio" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {([1, 2, 3] as const).map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {PRECIO_TEXTO[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cuándo abrís</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {MOMENTOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMomentos(alternar(momentos, m))}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                momentos.includes(m) ? 'border-bordo bg-bordo text-crema' : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {NOMBRE_MOMENTO[m]}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estilo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTags(alternar(tags, t))}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition',
                tags.includes(t) ? 'border-bordo bg-bordo text-crema' : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {t}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platos destacados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {platos.map((p, i) => (
              <span key={`${p}-${i}`} className="flex items-center gap-1.5 rounded-full bg-suave px-3 py-1 text-sm text-bordo-osc">
                {p}
                <button type="button" onClick={() => setPlatos(platos.filter((_, j) => j !== i))} aria-label={`Quitar ${p}`}>
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Rabas con alioli"
              value={platoNuevo}
              onChange={(e) => setPlatoNuevo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  agregarPlato()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={agregarPlato}>
              <Plus className="size-4" />
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descripción y contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@tu_local" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horarios">Horarios</Label>
              <Input id="horarios" value={horarios} onChange={(e) => setHorarios(e.target.value)} placeholder="Lun a dom 12 a 00 hs" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fotos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {fotos.map((foto, i) => (
              <div key={foto} className="group relative size-24 overflow-hidden rounded-xl ring-1 ring-foreground/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFotos(fotos.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                  aria-label="Quitar foto"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <SubirFoto disabled={soloLectura} onSubida={(url) => setFotos([...fotos, url])} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={pendiente || soloLectura} className="bg-bordo text-crema hover:bg-bordo/90">
          {pendiente ? 'Guardando…' : 'Guardá los cambios'}
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TipoPublicacion } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { accionCrearPublicacion } from '../acciones'
import { mensaje, ok } from '../_componentes/resultado'
import { SubirFoto } from '../_componentes/subir-foto'

const ETIQUETA: Record<TipoPublicacion, string> = { post: 'Novedad', promo: 'Promo', menu: 'Menú / carta' }
const AYUDA: Record<TipoPublicacion, string> = {
  post: 'Contanos la novedad…',
  promo: 'Ej.: 2x1 en pintas de 18 a 20 h',
  menu: 'Ej.: Rabas · Cazuela de mariscos · Paella. Podés poner precios y aclarar opciones sin TACC o veganas.',
}

export function FormularioPublicacion({ soloLectura = false }: { soloLectura?: boolean }) {
  const [tipo, setTipo] = useState<TipoPublicacion>('post')
  const [texto, setTexto] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [vence, setVence] = useState('')
  const [pendiente, iniciar] = useTransition()

  function publicar() {
    if (!texto.trim()) {
      toast.error('Escribí el texto de la publicación')
      return
    }
    iniciar(async () => {
      try {
        ok(await accionCrearPublicacion({ tipo, texto, foto, vence: tipo === 'promo' && vence ? vence : null }))
        toast.success(tipo === 'promo' ? 'Promo publicada' : tipo === 'menu' ? 'Menú publicado' : 'Publicación creada')
        setTexto('')
        setFoto(null)
        setVence('')
      } catch (e) {
        toast.error(mensaje(e, 'No pudimos crear la publicación'))
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva publicación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          {(['post', 'promo', 'menu'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                tipo === t ? 'border-bordo bg-bordo text-crema' : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {ETIQUETA[t]}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="texto-publicacion">Texto</Label>
          <Textarea
            id="texto-publicacion"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={tipo === 'menu' ? 6 : 3}
            maxLength={1000}
            placeholder={AYUDA[tipo]}
          />
        </div>
        {tipo === 'promo' && (
          <div className="space-y-1.5">
            <Label htmlFor="vence">Vence</Label>
            <Input id="vence" type="date" value={vence} onChange={(e) => setVence(e.target.value)} />
          </div>
        )}
        <div className="flex items-center gap-3">
          {foto ? (
            <div className="relative size-16 overflow-hidden rounded-lg ring-1 ring-foreground/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setFoto(null)}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"
                aria-label="Quitar foto"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ) : (
            <SubirFoto disabled={soloLectura} onSubida={setFoto} texto="Agregar foto" />
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={publicar} disabled={pendiente || soloLectura} className="bg-bordo text-crema hover:bg-bordo/90">
            {pendiente ? 'Publicando…' : 'Publicá'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

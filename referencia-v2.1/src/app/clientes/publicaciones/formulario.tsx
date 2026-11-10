'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { accionCrearPublicacion } from '../acciones'
import { SubirFoto } from '../_componentes/subir-foto'

export function FormularioPublicacion({ userId, localId }: { userId: string; localId: string }) {
  const [tipo, setTipo] = useState<'post' | 'promo'>('post')
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
        await accionCrearPublicacion({ tipo, texto, foto, vence: tipo === 'promo' && vence ? vence : null })
        toast.success(tipo === 'promo' ? 'Promo publicada' : 'Publicación creada')
        setTexto('')
        setFoto(null)
        setVence('')
      } catch {
        toast.error('No pudimos crear la publicación')
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
          {(['post', 'promo'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                tipo === t ? 'border-bordo bg-bordo text-crema' : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {t === 'post' ? 'Novedad' : 'Promo'}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="texto-publicacion">Texto</Label>
          <Textarea
            id="texto-publicacion"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            placeholder="Contanos la novedad…"
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
            <SubirFoto userId={userId} carpeta={`locales/${localId}/publicaciones`} onSubida={setFoto} texto="Agregar foto" />
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={publicar} disabled={pendiente} className="bg-bordo text-crema hover:bg-bordo/90">
            {pendiente ? 'Publicando…' : 'Publicá'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

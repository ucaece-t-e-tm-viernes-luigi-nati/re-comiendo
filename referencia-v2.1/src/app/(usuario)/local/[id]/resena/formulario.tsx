'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Camera, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { crearClienteNavegador } from '@/lib/db/navegador'
import { PUNTOS } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { accionPublicarResena } from '../../../acciones'

const ETIQUETAS = ['Rico', 'Buena atención', 'Buen precio', 'Lindo lugar', 'Rápido', 'Porciones grandes']

export function FormularioResena({ localId, nombre, userId }: { localId: string; nombre: string; userId: string }) {
  const router = useRouter()
  const [estrellas, setEstrellas] = useState(0)
  const [etiquetas, setEtiquetas] = useState<string[]>([])
  const [texto, setTexto] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [pendiente, empezar] = useTransition()

  async function subir(archivo: File) {
    if (archivo.size > 5 * 1024 * 1024) return toast.error('La foto tiene que pesar menos de 5 MB')
    setSubiendo(true)
    const supabase = crearClienteNavegador()
    const ruta = `${userId}/${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9.]/g, '')}`
    const { error } = await supabase.storage.from('fotos').upload(ruta, archivo)
    setSubiendo(false)
    if (error) return toast.error('No pudimos subir la foto')
    setFoto(supabase.storage.from('fotos').getPublicUrl(ruta).data.publicUrl)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div>
        <p className="text-sm text-muted-foreground">{nombre}</p>
        <h1 className="titulo text-3xl text-bordo">¿Cómo te fue?</h1>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setEstrellas(n)} aria-label={`${n} estrellas`}>
            <Star className={cn('size-10', n <= estrellas ? 'fill-durazno text-durazno' : 'text-muted-foreground/40')} />
          </button>
        ))}
      </div>
      <div>
        <h2 className="mb-2 font-bold">¿Qué estuvo bien?</h2>
        <div className="flex flex-wrap gap-2">
          {ETIQUETAS.map((e) => {
            const activa = etiquetas.includes(e)
            return (
              <button
                key={e}
                type="button"
                onClick={() => setEtiquetas(activa ? etiquetas.filter((x) => x !== e) : [...etiquetas, e])}
                className={cn('rounded-full border px-3 py-1 text-sm', activa ? 'border-bordo bg-bordo text-crema' : 'bg-card')}
              >
                {e}
              </button>
            )
          })}
        </div>
      </div>
      <Textarea placeholder="Contale a la comunidad" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={600} rows={4} />
      {foto ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto} alt="Tu foto" className="h-40 rounded-xl object-cover" />
          <Button size="icon-sm" variant="secondary" className="absolute top-2 right-2" onClick={() => setFoto(null)} aria-label="Quitar foto">
            <X />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed bg-card px-4 py-3 text-sm">
          <Camera className="size-5 text-bordo" />
          {subiendo ? 'Subiendo…' : `Sumá una foto (+${PUNTOS.foto} puntos)`}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])} />
        </label>
      )}
      <Button
        size="lg"
        disabled={estrellas === 0 || pendiente || subiendo}
        onClick={() =>
          empezar(async () => {
            const ganados = await accionPublicarResena({ localId, estrellas, etiquetas, texto, foto })
            toast.success(`¡Genial! Sumaste ${ganados} puntos`)
            router.push(`/local/${localId}`)
          })
        }
      >
        {pendiente ? 'Publicando…' : `Publicar reseña · +${PUNTOS.resena} puntos`}
      </Button>
    </div>
  )
}

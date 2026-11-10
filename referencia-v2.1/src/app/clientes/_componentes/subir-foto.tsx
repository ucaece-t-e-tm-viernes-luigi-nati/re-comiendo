'use client'

import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { buttonVariants } from '@/components/ui/button'
import { crearClienteNavegador } from '@/lib/db/navegador'
import { cn } from '@/lib/utils'

/** Sube una foto al bucket público "fotos" (carpeta {userId}/{carpeta}/...) y avisa la URL pública. */
export function SubirFoto({
  userId,
  carpeta,
  onSubida,
  texto = 'Subir foto',
}: {
  userId: string
  carpeta: string
  onSubida: (url: string) => void
  texto?: string
}) {
  const [subiendo, setSubiendo] = useState(false)

  async function manejarCambio(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setSubiendo(true)
    try {
      const supabase = crearClienteNavegador()
      const nombreLimpio = archivo.name.replace(/[^a-zA-Z0-9.]/g, '-')
      const ruta = `${userId}/${carpeta}/${Date.now()}-${nombreLimpio}`
      const { error } = await supabase.storage.from('fotos').upload(ruta, archivo)
      if (error) throw error
      const { data } = supabase.storage.from('fotos').getPublicUrl(ruta)
      onSubida(data.publicUrl)
    } catch {
      toast.error('No pudimos subir la foto')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <label
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'cursor-pointer', subiendo && 'pointer-events-none opacity-60')}
    >
      <input type="file" accept="image/*" className="hidden" onChange={manejarCambio} disabled={subiendo} />
      {subiendo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
      {subiendo ? 'Subiendo…' : texto}
    </label>
  )
}

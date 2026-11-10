'use client'

import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { buttonVariants } from '@/components/ui/button'
import { subirFoto } from '@/lib/subir-foto'
import { cn } from '@/lib/utils'

/** Sube una foto (se comprime a WebP en el navegador) y avisa la URL pública. */
export function SubirFoto({ onSubida, texto = 'Subir foto', disabled }: { onSubida: (url: string) => void; texto?: string; disabled?: boolean }) {
  const [subiendo, setSubiendo] = useState(false)

  async function manejarCambio(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setSubiendo(true)
    try {
      onSubida(await subirFoto(archivo))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos subir la foto')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <label
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'cursor-pointer',
        (subiendo || disabled) && 'pointer-events-none opacity-60',
      )}
    >
      <input type="file" accept="image/*" className="hidden" onChange={manejarCambio} disabled={subiendo || disabled} />
      {subiendo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
      {subiendo ? 'Subiendo…' : texto}
    </label>
  )
}

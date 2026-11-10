'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

/** Guarda la ubicación en una cookie para que el servidor recomiende por cercanía. */
export function BotonUbicacion({ activa }: { activa: boolean }) {
  const router = useRouter()
  const [buscando, setBuscando] = useState(false)
  if (activa) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          document.cookie = 'ubicacion=; max-age=0; path=/'
          router.refresh()
        }}
      >
        <LocateFixed /> Cerca tuyo · quitar
      </Button>
    )
  }
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={buscando}
      onClick={() => {
        if (!navigator.geolocation) return toast.error('Tu navegador no comparte ubicación')
        setBuscando(true)
        navigator.geolocation.getCurrentPosition(
          (p) => {
            document.cookie = `ubicacion=${p.coords.latitude.toFixed(5)},${p.coords.longitude.toFixed(5)}; max-age=3600; path=/`
            setBuscando(false)
            router.refresh()
          },
          () => {
            setBuscando(false)
            toast.error('No pudimos obtener tu ubicación')
          },
        )
      }}
    >
      <LocateFixed /> {buscando ? 'Buscando…' : 'Usar mi ubicación'}
    </Button>
  )
}

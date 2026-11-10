'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function PaginaError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => console.error(error), [error])
  const mensaje = error instanceof Error ? error.message : String(error)
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="titulo text-3xl text-bordo">Algo salió mal</h1>
      <p className="text-sm text-muted-foreground">Probá de nuevo. Si sigue pasando, mandanos este detalle:</p>
      <code className="max-w-full overflow-x-auto rounded-lg bg-muted px-3 py-2 text-xs">{mensaje}</code>
      <div className="flex gap-2">
        <Button onClick={() => retry()}>Reintentar</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Ir al inicio
        </Button>
      </div>
    </div>
  )
}

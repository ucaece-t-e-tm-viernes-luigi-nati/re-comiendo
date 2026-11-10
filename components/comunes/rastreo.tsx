'use client'

import { useEffect, useRef } from 'react'
import type { TipoEvento } from '@/lib/tipos'

export function rastrear(tipo: TipoEvento, localId?: string | null, meta?: Record<string, unknown>) {
  const cuerpo = JSON.stringify({ tipo, localId: localId ?? null, meta })
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/eventos', new Blob([cuerpo], { type: 'application/json' }))
  } else {
    void fetch('/api/eventos', { method: 'POST', body: cuerpo, headers: { 'Content-Type': 'application/json' }, keepalive: true })
  }
}

/** Registra un evento una sola vez al montarse (ej: vista de la ficha, impresión de un anuncio). */
export function RegistrarEvento({ tipo, localId }: { tipo: TipoEvento; localId?: string }) {
  const hecho = useRef(false)
  useEffect(() => {
    if (hecho.current) return
    hecho.current = true
    rastrear(tipo, localId)
  }, [tipo, localId])
  return null
}

/** Enlace externo que registra el click antes de abrirse. */
export function EnlaceRastreado({
  href,
  tipo,
  localId,
  className,
  children,
}: {
  href: string
  tipo: TipoEvento
  localId?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className} onClick={() => rastrear(tipo, localId)}>
      {children}
    </a>
  )
}

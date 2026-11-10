'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Leaflet usa window: se carga sólo en el navegador
export const Mapa = dynamic(() => import('./mapa-leaflet'), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-48 w-full rounded-2xl" />,
})
export type { PuntoMapa } from './mapa-leaflet'

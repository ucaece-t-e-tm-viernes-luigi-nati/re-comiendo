import 'server-only'
import { cookies } from 'next/headers'

/** Ubicación que el usuario compartió (cookie "lat,lng"), o null. */
export async function ubicacionGuardada(): Promise<{ lat: number; lng: number } | null> {
  const valor = (await cookies()).get('ubicacion')?.value
  if (!valor) return null
  const [lat, lng] = valor.split(',').map(Number)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

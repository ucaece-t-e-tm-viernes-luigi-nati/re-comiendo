/** Las server actions del panel devuelven { error } en vez de lanzar: esto lo convierte en excepción para el try/catch con toast. */
export function ok<T extends { error?: string } | null | undefined>(r: T): T {
  if (r && typeof r === 'object' && 'error' in r && r.error) throw new Error(r.error)
  return r
}

export function mensaje(e: unknown, porDefecto: string) {
  return e instanceof Error && e.message ? e.message : porDefecto
}

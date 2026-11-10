import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Cliente con la clave de servicio: saltea RLS. Usar SOLO dentro de /lib/services
 * y después de verificar permisos (puntos, premium, métricas, eventos).
 */
export function crearClienteAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

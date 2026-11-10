import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** Cliente de Supabase con la sesión del usuario (respeta RLS). Para Server Components, actions y API. */
export async function crearClienteServidor() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // En Server Components no se pueden escribir cookies; el proxy refresca la sesión.
          }
        },
      },
    },
  )
}

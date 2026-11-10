import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Refresca la sesión de Supabase en cada pedido y manda a /login a quien entra a un panel sin sesión.
// La verificación de rol real se hace en cada layout con requerirRol().
const PRIVADAS = ['/clientes', '/superadmin', '/inicio', '/perfil', '/puntos', '/feed', '/gustos', '/refi', '/eventos']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )
  const { data } = await supabase.auth.getClaims()
  const ruta = request.nextUrl.pathname
  if (!data?.claims && PRIVADAS.some((p) => ruta === p || ruta.startsWith(p + '/'))) {
    const url = request.nextUrl.clone()
    // Los negocios tienen su propio acceso; el resto entra por /login.
    if (ruta === '/clientes' || ruta.startsWith('/clientes/')) {
      url.pathname = '/negocios/ingresar'
    } else {
      url.pathname = '/login'
      url.searchParams.set('volver', ruta)
    }
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fotos/|logo.png|api/mcp|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
}

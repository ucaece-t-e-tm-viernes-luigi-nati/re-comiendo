import Image from 'next/image'
import Link from 'next/link'
import { Crown, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { obtenerPerfil } from '@/lib/services/auth'
import { Navegacion } from './navegacion'

// Lee la sesión en cada pedido (área del comensal): sin shell estático.
export const instant = false

export default async function LayoutUsuario({ children }: LayoutProps<'/'>) {
  const perfil = await obtenerPerfil()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-[1000] bg-bordo text-crema shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/inicio" className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={30} height={30} className="rounded-lg" />
            <span className="titulo text-xl">ReComiendo</span>
          </Link>
          <Navegacion variante="arriba" />
          <div className="flex items-center gap-2">
            {perfil ? (
              <>
                {perfil.es_premium && <Crown className="size-4 text-durazno" aria-label="Premium" />}
                <Link href="/puntos" className="flex items-center gap-1 rounded-full bg-durazno px-3 py-1 text-xs font-bold text-bordo-osc">
                  <Coins className="size-3.5" />
                  {perfil.puntos}
                </Link>
              </>
            ) : (
              <Button asChild size="sm" className="bg-durazno text-bordo-osc hover:bg-durazno/90">
                <Link href="/ingresar">Entrar</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-24 md:pb-10">{children}</main>
      <Navegacion variante="abajo" />
    </div>
  )
}

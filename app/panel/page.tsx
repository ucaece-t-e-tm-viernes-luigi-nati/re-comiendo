import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { site } from '@/lib/site'
import { SignOutButton } from './sign-out-button'

export default function PanelPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">{site.name} · Panel</p>
      <Suspense fallback={<p className="mt-4 text-muted">Cargando…</p>}>
        <Welcome />
      </Suspense>
    </main>
  )
}

// Lee la sesión (cookies): por eso va dentro de <Suspense>, como pide cacheComponents.
async function Welcome() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return (
    <div className="mt-2">
      <h1 className="text-3xl font-bold">Hola, {user.name}</h1>
      <p className="mt-2 text-muted">
        Ingresaste como {user.email}. Acá va el MVP de {site.name}.
      </p>
      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  )
}

import Link from 'next/link'
import { site } from '@/lib/site'

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <span className="text-lg font-bold">{site.name}</span>
        <Link href="/login" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
          Ingresar
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">{site.course}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">{site.name}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{site.tagline}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login?modo=registro" className="rounded-lg bg-brand px-5 py-3 font-semibold text-white">
            Crear cuenta
          </Link>
          <Link href="/login" className="rounded-lg border border-border px-5 py-3 font-semibold">
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted">
        Demo académica con datos de ejemplo · {site.course}
      </footer>
    </main>
  )
}

'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { accionLogin, accionRegistro } from './acciones'

const DEMOS = [
  { rol: 'Usuario', email: 'usuario@recomiendo.app', acceso: 'usuario' },
  { rol: 'Negocio', email: 'negocio@recomiendo.app', acceso: 'clientes' },
  { rol: 'Superadmin', email: 'admin@recomiendo.app', acceso: 'superadmin' },
] as const

export type Acceso = 'usuario' | 'clientes' | 'superadmin'

const TITULOS: Record<Acceso, { titulo: string; bajada: string }> = {
  usuario: { titulo: 'Entrá a tu cuenta', bajada: 'Y descubrí dónde comer hoy.' },
  clientes: { titulo: 'Acceso para negocios', bajada: 'Gestioná tu local, tus reservas y tus métricas.' },
  superadmin: { titulo: 'Acceso del equipo', bajada: 'Panel de administración de ReComiendo.' },
}

export function FormularioLogin({ volver, acceso }: { volver?: string; acceso: Acceso }) {
  const [estado, accion, pendiente] = useActionState(accionLogin, null)
  return (
    <form action={accion} className="flex flex-col gap-4">
      <div>
        <h1 className="titulo text-2xl text-bordo">{TITULOS[acceso].titulo}</h1>
        <p className="text-sm text-muted-foreground">{TITULOS[acceso].bajada}</p>
      </div>
      <input type="hidden" name="volver" value={volver ?? ''} />
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {estado?.error && <p className="text-sm text-destructive">{estado.error}</p>}
      <Button type="submit" size="lg" disabled={pendiente}>
        {pendiente ? 'Entrando…' : 'Entrar'}
      </Button>
      {acceso !== 'superadmin' && (
        <p className="text-center text-sm text-muted-foreground">
          {acceso === 'clientes' ? '¿Tu local todavía no está?' : '¿No tenés cuenta?'}{' '}
          <Link href={acceso === 'clientes' ? '/negocios' : '/registro'} className="font-bold text-bordo">
            {acceso === 'clientes' ? 'Sumalo' : 'Registrate'}
          </Link>
        </p>
      )}
      <div className="rounded-xl bg-suave p-3 text-xs">
        <p className="mb-2 font-bold text-bordo-osc">Cuenta de prueba (contraseña: recomiendo123)</p>
        <div className="flex flex-col gap-1">
          {DEMOS.filter((d) => d.acceso === acceso).map((d) => (
            <button
              key={d.email}
              type="button"
              className="flex justify-between rounded-lg px-2 py-1 text-left hover:bg-white"
              onClick={(e) => {
                const form = e.currentTarget.form!
                ;(form.elements.namedItem('email') as HTMLInputElement).value = d.email
                ;(form.elements.namedItem('password') as HTMLInputElement).value = 'recomiendo123'
              }}
            >
              <span className="font-medium">{d.rol}</span>
              <span className="text-muted-foreground">{d.email}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}

export function FormularioRegistro() {
  const [estado, accion, pendiente] = useActionState(accionRegistro, null)
  return (
    <form action={accion} className="flex flex-col gap-4">
      <h1 className="titulo text-2xl text-bordo">Creá tu cuenta</h1>
      <p className="-mt-2 text-sm text-muted-foreground">Basta de perder media hora eligiendo dónde comer.</p>
      <div className="grid gap-1.5">
        <Label htmlFor="nombre">¿Cómo te llamás?</Label>
        <Input id="nombre" name="nombre" required maxLength={40} autoComplete="given-name" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" />
      </div>
      {estado?.error && <p className="text-sm text-destructive">{estado.error}</p>}
      <Button type="submit" size="lg" disabled={pendiente}>
        {pendiente ? 'Creando…' : 'Crear cuenta'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-bold text-bordo">
          Entrá
        </Link>
        {' · '}
        <Link href="/negocios" className="font-bold text-bordo">
          Soy un negocio
        </Link>
      </p>
    </form>
  )
}

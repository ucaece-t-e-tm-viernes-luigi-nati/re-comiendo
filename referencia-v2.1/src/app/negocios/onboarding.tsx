'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowLeft, Clock, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA, PRECIO_TEXTO, type Categoria, type Precio } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { accionSolicitarAlta } from './acciones'

const PASOS = ['Tu local', 'Dónde queda', 'Contacto'] as const

/** Aviso final del alta: el equipo responde en 48 horas. */
export function SolicitudEnviada({ nombre }: { nombre: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-durazno text-bordo-osc">
        <PartyPopper className="size-8" />
      </span>
      <h1 className="titulo text-3xl text-bordo">¡Recibimos tu solicitud!</h1>
      <p className="text-muted-foreground">
        Gracias por sumar <b className="text-foreground">{nombre}</b> a ReComiendo. Nuestro equipo revisa los datos y{' '}
        <b className="text-foreground">te contestamos dentro de las próximas 48 horas</b>.
      </p>
      <p className="flex items-center gap-2 rounded-xl bg-suave px-4 py-3 text-sm text-bordo-osc">
        <Clock className="size-4 shrink-0" />
        Cuando aprobemos tu local, entrás con tu email y contraseña y ya aparecés en las recomendaciones.
      </p>
      <Button asChild size="lg" variant="outline">
        <Link href="/">Volver a ReComiendo</Link>
      </Button>
    </div>
  )
}

/** Alta de negocio en 3 pasos. Al enviar muestra el aviso de que respondemos en 48 horas. */
export function Onboarding({ conCuenta, nombre }: { conCuenta: boolean; nombre: string }) {
  const [paso, setPaso] = useState(0)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [pendiente, empezar] = useTransition()
  const [categoria, setCategoria] = useState<Categoria>('cafe')
  const [precio, setPrecio] = useState<Precio>(2)
  const [d, setD] = useState({
    nombre: '',
    direccion: '',
    barrio: '',
    descripcion: '',
    instagram: '',
    responsable: nombre,
    telefono: '',
    email: '',
    password: '',
  })
  const campo = (k: keyof typeof d) => ({
    id: k,
    name: k,
    value: d[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value }),
  })

  if (enviado) return <SolicitudEnviada nombre={d.nombre} />

  const siguiente = (form: HTMLFormElement) => {
    setError('')
    if (!form.reportValidity()) return
    if (paso < PASOS.length - 1) return setPaso(paso + 1)
    empezar(async () => {
      const r = await accionSolicitarAlta({ ...d, categoria, precio })
      if ('error' in r) setError(r.error ?? 'No pudimos enviar la solicitud')
      else setEnviado(true)
    })
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        siguiente(e.currentTarget)
      }}
    >
      <div>
        <h1 className="titulo text-3xl text-bordo">Sumá tu negocio</h1>
        <p className="text-sm text-muted-foreground">Completá estos 3 pasos y te contestamos en 48 horas.</p>
      </div>

      <ol className="grid grid-cols-3 gap-2">
        {PASOS.map((p, i) => (
          <li key={p} className="flex flex-col gap-1.5">
            <span className={cn('h-1.5 rounded-full', i <= paso ? 'bg-bordo' : 'bg-bordo/15')} />
            <span className={cn('text-xs font-medium', i === paso ? 'text-bordo' : 'text-muted-foreground')}>
              {i + 1}. {p}
            </span>
          </li>
        ))}
      </ol>

      {paso === 0 && (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="nombre">Nombre del local</Label>
            <Input {...campo('nombre')} required minLength={2} maxLength={80} autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label>Rubro</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(NOMBRE_CATEGORIA) as Categoria[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoria(c)}
                  className={cn('rounded-xl border-2 bg-card px-2 py-2 text-sm', categoria === c ? 'border-bordo bg-rosa-claro' : 'border-transparent')}
                >
                  {EMOJI_CATEGORIA[c]} {NOMBRE_CATEGORIA[c]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Precio promedio</Label>
            <div className="flex gap-2">
              {([1, 2, 3] as Precio[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrecio(p)}
                  className={cn('flex-1 rounded-xl border-2 bg-card py-2 font-bold', precio === p ? 'border-bordo bg-rosa-claro text-bordo' : 'border-transparent')}
                >
                  {PRECIO_TEXTO[p]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {paso === 1 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="direccion">Dirección</Label>
              <Input {...campo('direccion')} required minLength={3} maxLength={120} placeholder="Güemes 2800" autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="barrio">Barrio</Label>
              <Input {...campo('barrio')} maxLength={60} placeholder="Los Troncos" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="descripcion">Contanos de tu local</Label>
            <Textarea {...campo('descripcion')} maxLength={400} rows={3} placeholder="Qué ofrecés, qué te hace distinto…" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="instagram">Instagram</Label>
            <Input {...campo('instagram')} maxLength={60} placeholder="@tulocal" />
          </div>
        </>
      )}

      {paso === 2 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="responsable">Tu nombre</Label>
              <Input {...campo('responsable')} required maxLength={60} autoComplete="name" autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="telefono">Teléfono o WhatsApp</Label>
              <Input {...campo('telefono')} type="tel" required minLength={6} maxLength={30} placeholder="223 555-1234" autoComplete="tel" />
            </div>
          </div>
          {!conCuenta && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input {...campo('email')} type="email" required autoComplete="email" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Contraseña para entrar a tu panel</Label>
                <Input {...campo('password')} type="password" required minLength={6} autoComplete="new-password" />
              </div>
            </>
          )}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        {paso > 0 && (
          <Button type="button" variant="ghost" size="lg" onClick={() => setPaso(paso - 1)} disabled={pendiente}>
            <ArrowLeft /> Atrás
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1" disabled={pendiente}>
          {paso < PASOS.length - 1 ? 'Siguiente' : pendiente ? 'Enviando…' : 'Enviar solicitud'}
        </Button>
      </div>

      {!conCuenta && (
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya enviaste tu solicitud?{' '}
          <Link href="/negocios/ingresar" className="font-bold text-bordo">
            Entrá a tu panel
          </Link>
        </p>
      )}
    </form>
  )
}

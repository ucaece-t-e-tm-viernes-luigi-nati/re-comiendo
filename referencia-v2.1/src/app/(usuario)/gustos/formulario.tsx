'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA, type Categoria, type Modo, type Precio } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { accionGuardarGustos } from '../acciones'

const CATEGORIAS = Object.keys(NOMBRE_CATEGORIA) as Categoria[]
const PRECIOS: { valor: Precio; titulo: string; detalle: string }[] = [
  { valor: 1, titulo: '$', detalle: 'Algo económico' },
  { valor: 2, titulo: '$$', detalle: 'Término medio' },
  { valor: 3, titulo: '$$$', detalle: 'Darme un gusto' },
]

export function FormularioGustos({
  inicial,
  primeraVez,
}: {
  inicial: { nombre: string; categorias: Categoria[]; precio: Precio; modo: Modo }
  primeraVez: boolean
}) {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [nombre, setNombre] = useState(inicial.nombre)
  const [categorias, setCategorias] = useState<Categoria[]>(inicial.categorias)
  const [precio, setPrecio] = useState<Precio>(inicial.precio)
  const [modo, setModo] = useState<Modo>(inicial.modo)
  const [guardando, empezar] = useTransition()

  const guardar = () =>
    empezar(async () => {
      await accionGuardarGustos({ nombre, categorias, precio, modo })
      toast.success(primeraVez ? '¡Listo! Ya tenemos tus primeras recomendaciones' : 'Guardamos tus gustos')
      router.push('/inicio')
    })

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i <= paso ? 'bg-bordo' : 'bg-suave')} />
        ))}
      </div>

      {paso === 0 && (
        <>
          <h1 className="titulo text-3xl text-bordo">¿Qué te hace agua la boca?</h1>
          <p className="-mt-3 text-sm text-muted-foreground">Elegí todo lo que te guste. Con esto armamos tus primeras recomendaciones.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIAS.map((c) => {
              const activo = categorias.includes(c)
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategorias(activo ? categorias.filter((x) => x !== c) : [...categorias, c])}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-2xl border-2 bg-card p-3 text-sm font-medium transition',
                    activo ? 'border-bordo bg-rosa-claro text-bordo' : 'border-transparent hover:border-bordo/30',
                  )}
                  aria-pressed={activo}
                >
                  <span className="text-3xl">{EMOJI_CATEGORIA[c]}</span>
                  {NOMBRE_CATEGORIA[c]}
                </button>
              )
            })}
          </div>
          <Button size="lg" disabled={categorias.length === 0} onClick={() => setPaso(1)}>
            Seguir
          </Button>
        </>
      )}

      {paso === 1 && (
        <>
          <h1 className="titulo text-3xl text-bordo">¿Cuánto querés gastar?</h1>
          <div className="grid gap-2">
            {PRECIOS.map((p) => (
              <button
                key={p.valor}
                type="button"
                onClick={() => setPrecio(p.valor)}
                className={cn(
                  'flex items-center justify-between rounded-2xl border-2 bg-card px-4 py-3 text-left transition',
                  precio === p.valor ? 'border-bordo bg-rosa-claro' : 'border-transparent hover:border-bordo/30',
                )}
                aria-pressed={precio === p.valor}
              >
                <span className="font-medium">{p.detalle}</span>
                <span className="titulo text-xl text-bordo">{p.titulo}</span>
              </button>
            ))}
          </div>
          <h2 className="titulo mt-2 text-2xl">¿Qué preferís?</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { v: 'descubrir' as const, t: 'Descubrir lugares nuevos', d: 'Te mostramos joyitas de nicho' },
              { v: 'seguro' as const, t: 'Ir a lo seguro', d: 'Priorizamos lo que ya te gustó' },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setModo(o.v)}
                className={cn(
                  'rounded-2xl border-2 bg-card px-4 py-3 text-left transition',
                  modo === o.v ? 'border-bordo bg-rosa-claro' : 'border-transparent hover:border-bordo/30',
                )}
                aria-pressed={modo === o.v}
              >
                <span className="block font-bold">{o.t}</span>
                <span className="text-sm text-muted-foreground">{o.d}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" onClick={() => setPaso(0)}>
              Volver
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setPaso(2)}>
              Seguir
            </Button>
          </div>
        </>
      )}

      {paso === 2 && (
        <>
          <h1 className="titulo text-3xl text-bordo">Último paso</h1>
          <label className="grid gap-1.5 text-sm font-medium">
            ¿Cómo te llamás?
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={40} />
          </label>
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" onClick={() => setPaso(1)}>
              Volver
            </Button>
            <Button size="lg" className="flex-1" disabled={!nombre.trim() || guardando} onClick={guardar}>
              {guardando ? 'Guardando…' : primeraVez ? 'Empezar' : 'Guardar'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

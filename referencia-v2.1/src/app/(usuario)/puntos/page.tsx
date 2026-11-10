import { requerirRol } from '@/lib/services/auth'
import { listarPremios, misCanjes } from '@/lib/services/usuarios'
import { PUNTOS } from '@/lib/tipos'
import { BotonCanjear } from './canjear'

export const metadata = { title: 'Mis puntos' }

export default async function PaginaPuntos() {
  const perfil = await requerirRol()
  const [premios, canjes] = await Promise.all([listarPremios(), misCanjes(perfil.id)])
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <section className="rounded-3xl bg-bordo p-6 text-crema">
        <p className="text-sm opacity-80">Mis puntos</p>
        <p className="titulo text-5xl">{perfil.puntos}</p>
        <p className="mt-1 text-sm opacity-80">Canjeá tus puntos por beneficios en locales aliados.</p>
      </section>
      <section>
        <h2 className="titulo mb-2 text-2xl">Cómo sumar</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li className="rounded-2xl bg-card p-3 text-sm ring-1 ring-foreground/5">
            <b className="text-bordo">+{PUNTOS.resena}</b> por cada reseña. Cuando vayas a un lugar, reseñalo y sumá puntos.
          </li>
          <li className="rounded-2xl bg-card p-3 text-sm ring-1 ring-foreground/5">
            <b className="text-bordo">+{PUNTOS.foto}</b> extra si subís una foto.
          </li>
        </ul>
      </section>
      <section>
        <h2 className="titulo mb-2 text-2xl">Canjeá</h2>
        <div className="grid gap-2">
          {premios.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
              <div>
                <p className="font-bold">{p.titulo}</p>
                <p className="text-sm text-muted-foreground">en {p.local?.nombre ?? 'un local aliado'}</p>
              </div>
              <BotonCanjear premioId={p.id} costo={p.costo} alcanza={perfil.puntos >= p.costo} />
            </div>
          ))}
        </div>
      </section>
      {canjes.length > 0 && (
        <section>
          <h2 className="titulo mb-2 text-2xl">Mis cupones</h2>
          <div className="grid gap-2">
            {canjes.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
                <div>
                  <p className="font-bold">{c.premio?.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.premio?.local?.nombre} · {c.usado ? 'usado' : 'mostrá este código en el local'}
                  </p>
                </div>
                <span className={`rounded-xl border-2 border-dashed px-3 py-1 font-mono font-bold ${c.usado ? 'text-muted-foreground line-through' : 'border-bordo/40 text-bordo'}`}>
                  {c.codigo}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

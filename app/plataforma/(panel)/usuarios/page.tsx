import type { Metadata } from 'next'
import { inputClass } from '@/components/forms'
import { Card, Empty, PageTitle, Table, Td } from '@/components/panel/ui'
import { requireSuperadmin } from '@/lib/guards'
import { usuariosParaGestion } from '@/lib/services/metricas'
import { numero } from '../_componentes/formato'

export const metadata: Metadata = { title: 'Comensales' }

export default async function PaginaComensales({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireSuperadmin()
  const { q } = await searchParams
  const busqueda = (q ?? '').trim().toLowerCase()
  const usuarios = await usuariosParaGestion()
  const filtrados = busqueda ? usuarios.filter((u) => u.nombre.toLowerCase().includes(busqueda) || u.email.toLowerCase().includes(busqueda)) : usuarios
  const premium = usuarios.filter((u) => u.es_premium).length

  return (
    <>
      <PageTitle
        eyebrow="Plataforma"
        title="Comensales"
        description={`${numero(usuarios.length)} usuarios de la app · ${numero(premium)} Premium. Se registran solos desde /ingresar.`}
      />
      <form method="GET" className="mb-4 max-w-sm">
        <input name="q" defaultValue={q ?? ''} placeholder="Buscar por nombre o email…" aria-label="Buscar comensal" className={inputClass} />
      </form>
      <Card>
        {filtrados.length ? (
          <Table head={['Nombre', 'Email', 'Plan', 'Puntos', 'Reseñas', 'Alta']}>
            {filtrados.map((u) => (
              <tr key={u.id}>
                <Td className="font-semibold">
                  {u.nombre}
                  {u.demo && <span className="ml-1 text-xs font-normal text-muted-foreground">(demo)</span>}
                </Td>
                <Td className="text-muted-foreground">{u.email}</Td>
                <Td>{u.es_premium ? 'Premium' : 'Gratis'}</Td>
                <Td>{numero(u.puntos)}</Td>
                <Td>{u.resenas}</Td>
                <Td className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('es-AR')}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>No encontramos comensales con esa búsqueda.</Empty>
        )}
      </Card>
    </>
  )
}

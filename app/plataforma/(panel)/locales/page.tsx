import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, Empty, PageTitle, StatusBadge, Table, Td } from '@/components/panel/ui'
import { requireSuperadmin } from '@/lib/guards'
import { localesParaGestion } from '@/lib/services/metricas'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA, type Categoria, type EstadoLocal } from '@/lib/tipos'
import { AccionesEstadoLocal } from '../_componentes/acciones-ui'

export const metadata: Metadata = { title: 'Locales' }

const PESTANAS: { valor: EstadoLocal; etiqueta: string }[] = [
  { valor: 'activo', etiqueta: 'Activos' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'suspendido', etiqueta: 'Suspendidos' },
]

export default async function PaginaLocales({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requireSuperadmin()
  const { estado: param } = await searchParams
  const estado: EstadoLocal = PESTANAS.some((p) => p.valor === param) ? (param as EstadoLocal) : 'activo'
  const locales = await localesParaGestion()
  const filtrados = locales.filter((l) => l.estado === estado)

  return (
    <>
      <PageTitle
        eyebrow="Plataforma"
        title="Locales"
        description="Todos los locales que aparecen en la app (los de clientes y los del catálogo curado). Las altas nuevas de clientes entran por Solicitudes."
      />
      <nav aria-label="Filtrar por estado" className="mb-4 flex flex-wrap gap-2 text-sm">
        {PESTANAS.map((p) => (
          <Link
            key={p.valor}
            href={`/plataforma/locales?estado=${p.valor}`}
            className={`rounded-full px-3 py-1.5 font-semibold ${estado === p.valor ? 'bg-foreground text-background' : 'border border-border bg-card'}`}
          >
            {p.etiqueta} ({locales.filter((l) => l.estado === p.valor).length})
          </Link>
        ))}
      </nav>
      <Card>
        {filtrados.length ? (
          <Table head={['Local', 'Barrio', 'Cliente', 'Estado del cliente', '']}>
            {filtrados.map((l) => (
              <tr key={l.id}>
                <Td>
                  <Link href={`/local/${l.id}`} className="font-semibold hover:text-primary">
                    {EMOJI_CATEGORIA[l.categoria as Categoria] ?? ''} {l.nombre}
                  </Link>
                  <p className="text-xs text-muted-foreground">{NOMBRE_CATEGORIA[l.categoria as Categoria] ?? l.categoria}</p>
                </Td>
                <Td>{l.barrio || '—'}</Td>
                <Td>
                  {l.client_id ? (
                    <Link href={`/plataforma/empresas/${l.client_id}`} className="hover:text-primary">
                      {l.client_name}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">Catálogo (sin cliente)</span>
                  )}
                </Td>
                <Td>{l.client_status ? <StatusBadge status={l.client_status} /> : '—'}</Td>
                <Td className="text-right">
                  <AccionesEstadoLocal id={l.id} estado={l.estado} />
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>No hay locales en este estado.</Empty>
        )}
      </Card>
    </>
  )
}

import Link from 'next/link'
import { Card, Empty, Metric, PageTitle, STATUS_LABELS, StatusBadge, Table, Td } from '@/components/panel/ui'
import { q, q1 } from '@/lib/db'
import { formatDate, formatDateTime, formatMoney } from '@/lib/dates'
import { requireSuperadmin } from '@/lib/guards'
import { mailProviderLabel } from '@/lib/mail'

export default async function PlatformDashboard() {
  await requireSuperadmin()
  const [byStatus, pending, mrr, overdue, recent] = await Promise.all([
    q<{ status: string; n: number }>(`SELECT status, count(*)::int AS n FROM client GROUP BY status`),
    q1<{ n: number }>(`SELECT count(*)::int AS n FROM client_application WHERE status = 'pending_review'`),
    q1<{ cents: string }>(`SELECT coalesce(sum(monthly_price_cents), 0)::text AS cents FROM client WHERE status = 'active' AND NOT is_demo`),
    q<{ id: string; name: string; next_due_date: string; monthly_price_cents: string; currency: string }>(
      `SELECT id, name, to_char(next_due_date, 'YYYY-MM-DD') AS next_due_date, monthly_price_cents::text, currency FROM client WHERE status = 'past_due' ORDER BY next_due_date`,
    ),
    q<{ id: string; email: string; data: { name?: string }; status: string; submitted_at: Date | null }>(
      `SELECT id, email, data, status, submitted_at FROM client_application WHERE status <> 'draft' ORDER BY coalesce(submitted_at, created_at) DESC LIMIT 6`,
    ),
  ])
  const count = (s: string) => byStatus.find((r) => r.status === s)?.n ?? 0

  return (
    <>
      <PageTitle eyebrow="Plataforma" title="Resumen" description={`Envío de mails: ${mailProviderLabel()}.`} />
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Solicitudes pendientes" value={pending?.n ?? 0} />
        <Metric label="MRR (locales activos)" value={formatMoney(mrr?.cents ?? 0)} hint="Suma del abono de locales activos (sin demo)" />
        <Metric label="Con pago vencido" value={overdue.length} />
        <Metric label="En prueba" value={count('trial')} />
      </section>
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {['trial', 'active', 'past_due', 'paused', 'cancelled'].map((s) => (
          <Link key={s} href={`/plataforma/empresas?estado=${s}`} className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40">
            <p className="text-xs text-muted-foreground">{STATUS_LABELS[s]}</p>
            <p className="mt-1 text-2xl font-bold">{count(s)}</p>
          </Link>
        ))}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Últimas solicitudes">
          {recent.length ? (
            <Table head={['Local', 'Estado', 'Enviada']}>
              {recent.map((a) => (
                <tr key={a.id}>
                  <Td>
                    <Link href={`/plataforma/solicitudes/${a.id}`} className="font-semibold hover:text-primary">
                      {a.data?.name ?? a.email}
                    </Link>
                  </Td>
                  <Td>
                    <StatusBadge status={a.status} />
                  </Td>
                  <Td className="text-xs text-muted-foreground">{formatDateTime(a.submitted_at)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Todavía no hay solicitudes. Creá una invitación para empezar.</Empty>
          )}
        </Card>
        <Card title="Pagos vencidos">
          {overdue.length ? (
            <Table head={['Local', 'Venció', 'Monto']}>
              {overdue.map((c) => (
                <tr key={c.id}>
                  <Td>
                    <Link href={`/plataforma/empresas/${c.id}`} className="font-semibold hover:text-primary">
                      {c.name}
                    </Link>
                  </Td>
                  <Td>{formatDate(c.next_due_date)}</Td>
                  <Td>{formatMoney(c.monthly_price_cents, c.currency)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>No hay pagos vencidos.</Empty>
          )}
        </Card>
      </div>
    </>
  )
}

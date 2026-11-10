import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Card, Empty, Metric, PageTitle, StatusBadge, Table, Td } from '@/components/panel/ui'
import { getEmpresaProfile, listEmpresaPayments } from '@/lib/data/empresa'
import { formatDate, formatMoney } from '@/lib/dates'
import { requireLocal } from '@/lib/guards'

export const metadata: Metadata = { title: 'Plan y pagos' }

export default async function PlanLocalPage() {
  const ctx = await requireLocal('billing.view')
  const [p, payments] = await Promise.all([getEmpresaProfile(ctx.clientId), listEmpresaPayments(ctx.clientId)])
  if (!p) notFound()

  return (
    <>
      <PageTitle eyebrow={ctx.clientName} title="Plan y pagos" description="Los pagos los registra el equipo de ReComiendo. Si tenés dudas, respondé cualquiera de nuestros mails." />
      <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Plan" value={p.plan_name ?? '—'} />
        <Metric label="Abono mensual" value={formatMoney(p.monthly_price_cents, p.currency)} />
        <Metric label="Próximo vencimiento" value={formatDate(p.next_due_date)} hint={p.billing_day ? `Día de pago: ${p.billing_day} de cada mes` : undefined} />
        <Metric label="Estado" value={<StatusBadge status={p.status} />} hint={p.status === 'trial' && p.trial_ends_at ? `Prueba gratis hasta el ${formatDate(p.trial_ends_at)}` : undefined} />
      </section>
      <Card title="Pagos registrados">
        {payments.length ? (
          <Table head={['Período', 'Monto', 'Vencimiento', 'Estado', 'Medio']}>
            {payments.map((pay) => (
              <tr key={pay.id}>
                <Td>{pay.period}</Td>
                <Td>{formatMoney(pay.amount_cents, pay.currency)}</Td>
                <Td>{formatDate(pay.due_date)}</Td>
                <Td>
                  <StatusBadge status={pay.status} />
                </Td>
                <Td>{pay.method ?? '—'}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Todavía no hay pagos registrados.</Empty>
        )}
      </Card>
    </>
  )
}

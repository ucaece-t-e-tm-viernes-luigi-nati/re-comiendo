import type { Metadata } from 'next'
import { Card, Empty, PageTitle, Table, Td } from '@/components/panel/ui'
import { q } from '@/lib/db'
import { formatDateTime } from '@/lib/dates'
import { requireSuperadmin } from '@/lib/guards'

export const metadata: Metadata = { title: 'Auditoría' }

export default async function AuditPage() {
  await requireSuperadmin()
  const rows = await q<{ id: string; action: string; actor_role: string | null; actor: string | null; client: string | null; entity: string | null; entity_id: string | null; detail: unknown; created_at: Date }>(
    `SELECT l.id::text, l.action, l.actor_role, u.email AS actor, c.name AS client, l.entity, l.entity_id, l.detail, l.created_at
       FROM audit_log l
       LEFT JOIN "user" u ON u.id = l.actor_user_id
       LEFT JOIN client c ON c.id = l.client_id
      ORDER BY l.created_at DESC LIMIT 300`,
  )
  return (
    <>
      <PageTitle eyebrow="Plataforma" title="Auditoría" description="Altas, aprobaciones, rechazos, cambios de estado (locales y cuentas), plan, pagos y equipo. Últimos 300 registros." />
      <Card>
        {rows.length ? (
          <Table head={['Fecha', 'Acción', 'Quién', 'Local', 'Detalle']}>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap text-xs">{formatDateTime(r.created_at)}</Td>
                <Td className="font-mono text-xs">{r.action}</Td>
                <Td className="text-xs">
                  {r.actor ?? '—'}
                  <p className="text-muted-foreground">{r.actor_role}</p>
                </Td>
                <Td className="text-xs">{r.client ?? '—'}</Td>
                <Td className="max-w-[320px] break-words font-mono text-[11px] text-muted-foreground">{r.detail ? JSON.stringify(r.detail) : r.entity_id ?? ''}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Sin registros todavía.</Empty>
        )}
      </Card>
    </>
  )
}

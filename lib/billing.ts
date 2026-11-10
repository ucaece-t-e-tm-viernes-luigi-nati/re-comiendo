import 'server-only'
import { audit } from './audit'
import { q } from './db'
import { addDays, dayKeyAR, formatDate, formatMoney } from './dates'
import { pauseAfterDays } from './env'
import { sendMail } from './mail'
import { mails } from './mail-templates'

type DueClient = {
  id: string
  name: string
  status: string
  monthly_price_cents: string
  currency: string
  next_due_date: string
  emails: string[] | null
}

const DUE_SELECT = `SELECT c.id, c.name, c.status, c.monthly_price_cents::text, c.currency,
       to_char(c.next_due_date, 'YYYY-MM-DD') AS next_due_date,
       (SELECT array_agg(u.email) FROM client_member m JOIN "user" u ON u.id = m.user_id WHERE m.client_id = c.id AND m.role = 'owner') AS emails
  FROM client c`

async function notify(client: DueClient, mail: { subject: string; html: string; text: string; template: string }) {
  for (const to of client.emails ?? []) await sendMail({ to, ...mail })
}

async function alreadyDone(clientId: string, action: string, due: string) {
  const rows = await q(`SELECT 1 FROM audit_log WHERE client_id = $1 AND action = $2 AND detail->>'due' = $3 LIMIT 1`, [clientId, action, due])
  return rows.length > 0
}

/**
 * Proceso diario de vencimientos (lo llama el cron de Vercel). Idempotente: si corre dos veces el mismo día no duplica mails.
 * 1. Aviso 5 días antes del vencimiento.
 * 2. Vencido → past_due (+ pago pendiente marcado como vencido).
 * 3. past_due con más de PAUSE_AFTER_DAYS días → paused (panel solo lectura y local oculto).
 * Los locales de demo (is_demo) no se tocan.
 */
export async function runDailyBilling(today = dayKeyAR()) {
  const result = { reminders: 0, pastDue: 0, paused: 0 }
  const grace = pauseAfterDays()
  const amount = (c: DueClient) => formatMoney(c.monthly_price_cents, c.currency)

  // 1. Aviso previo
  const reminderDate = addDays(today, 5)
  const upcoming = await q<DueClient>(`${DUE_SELECT} WHERE c.status IN ('trial','active') AND NOT c.is_demo AND c.monthly_price_cents > 0 AND c.next_due_date = $1::date`, [reminderDate])
  for (const c of upcoming) {
    if (await alreadyDone(c.id, 'billing.reminder', c.next_due_date)) continue
    await notify(c, mails.billingReminder({ empresa: c.name, monto: amount(c), fecha: formatDate(c.next_due_date) }))
    await audit(null, 'billing.reminder', { actorRole: 'cron', clientId: c.id, entity: 'client', entityId: c.id, detail: { due: c.next_due_date } })
    result.reminders++
  }

  // 2. Vencidos
  const overdue = await q<DueClient>(`${DUE_SELECT} WHERE c.status IN ('trial','active') AND NOT c.is_demo AND c.monthly_price_cents > 0 AND c.next_due_date < $1::date`, [today])
  for (const c of overdue) {
    await q(`UPDATE client SET status = 'past_due', updated_at = now() WHERE id = $1`, [c.id])
    await q(
      `INSERT INTO payment (client_id, period, amount_cents, currency, status, due_date)
       VALUES ($1, to_char($2::date, 'YYYY-MM'), $3, $4, 'overdue', $2::date)
       ON CONFLICT (client_id, period) DO UPDATE SET status = 'overdue' WHERE payment.status = 'pending'`,
      [c.id, c.next_due_date, c.monthly_price_cents, c.currency],
    )
    await notify(c, mails.billingOverdue({ empresa: c.name, monto: amount(c), fecha: formatDate(c.next_due_date), fechaPausa: formatDate(addDays(c.next_due_date, grace)) }))
    await audit(null, 'client.past_due', { actorRole: 'cron', clientId: c.id, entity: 'client', entityId: c.id, detail: { due: c.next_due_date, from: c.status } })
    result.pastDue++
  }

  // 3. Pausa por falta de pago
  const toPause = await q<DueClient>(`${DUE_SELECT} WHERE c.status = 'past_due' AND NOT c.is_demo AND c.next_due_date < ($1::date - make_interval(days => $2::int))`, [today, grace])
  for (const c of toPause) {
    await q(`UPDATE client SET status = 'paused', updated_at = now() WHERE id = $1`, [c.id])
    await notify(c, mails.billingPaused({ empresa: c.name }))
    await audit(null, 'client.pause', { actorRole: 'cron', clientId: c.id, entity: 'client', entityId: c.id, detail: { due: c.next_due_date, reason: 'falta de pago' } })
    result.paused++
  }

  return result
}

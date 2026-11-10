import 'server-only'
import { q, q1 } from '../db'

// Consultas del panel del local (empresa). SIEMPRE reciben el clientId resuelto por getLocalContext() (sesión → membresía).

export type EmpresaProfile = {
  id: string
  name: string
  slug: string
  legal_name: string | null
  tax_id: string | null
  city: string | null
  neighborhood: string | null
  address: string | null
  instagram: string | null
  website: string | null
  phone: string | null
  contact_email: string | null
  description: string | null
  data: Record<string, unknown> | null
  status: string
  plan_id: string | null
  plan_name: string | null
  monthly_price_cents: string
  currency: string
  trial_ends_at: string | null
  billing_day: number | null
  next_due_date: string | null
  is_demo: boolean
}

export function getEmpresaProfile(clientId: string) {
  return q1<EmpresaProfile>(
    `SELECT c.id, c.name, c.slug, c.legal_name, c.tax_id, c.city, c.neighborhood, c.address,
            c.instagram, c.website, c.phone, c.contact_email, c.description, c.data, c.status, c.plan_id, p.name AS plan_name,
            c.monthly_price_cents::text, c.currency,
            to_char(c.trial_ends_at, 'YYYY-MM-DD') AS trial_ends_at, c.billing_day,
            to_char(c.next_due_date, 'YYYY-MM-DD') AS next_due_date, c.is_demo
       FROM client c LEFT JOIN plan p ON p.id = c.plan_id WHERE c.id = $1`,
    [clientId],
  )
}

export function listEmpresaMembers(clientId: string) {
  return q<{ userId: string; name: string; email: string; role: 'owner' | 'staff'; mustChangePassword: boolean; createdAt: string }>(
    `SELECT u.id AS "userId", u.name, u.email, m.role, u."mustChangePassword", m.created_at AS "createdAt"
       FROM client_member m JOIN "user" u ON u.id = m.user_id
      WHERE m.client_id = $1 ORDER BY m.role, u.name`,
    [clientId],
  )
}

export function listEmpresaPayments(clientId: string) {
  return q<{ id: string; period: string; amount_cents: string; currency: string; status: string; method: string | null; due_date: string; paid_at: string | null }>(
    `SELECT id, period, amount_cents::text, currency, status, method, to_char(due_date, 'YYYY-MM-DD') AS due_date, paid_at
       FROM payment WHERE client_id = $1 ORDER BY due_date DESC`,
    [clientId],
  )
}

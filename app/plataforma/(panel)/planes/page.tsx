import type { Metadata } from 'next'
import { ActionForm, inputClass, labelClass } from '@/components/forms'
import { Card, PageTitle } from '@/components/panel/ui'
import { q } from '@/lib/db'
import { requireSuperadmin } from '@/lib/guards'
import { savePlan } from '../actions'

export const metadata: Metadata = { title: 'Planes' }

type PlanRow = { id: string; name: string; description: string | null; features: string[]; monthly_price_cents: string; trial_days: number; sort: number; active: boolean; clients: number }

export default async function PlansPage() {
  await requireSuperadmin()
  const plans = await q<PlanRow>(
    `SELECT p.id, p.name, p.description, p.features, p.monthly_price_cents::text, p.trial_days, p.sort, p.active,
            (SELECT count(*)::int FROM client c WHERE c.plan_id = p.id) AS clients
       FROM plan p ORDER BY p.sort, p.monthly_price_cents`,
  )
  return (
    <>
      <PageTitle eyebrow="Plataforma" title="Planes" description="Precios en pesos (ARS) por mes. Cambiar un precio no modifica el abono de los locales existentes (se ajusta en cada local)." />
      <div className="grid gap-5 lg:grid-cols-2">
        {plans.map((p) => (
          <Card key={p.id} title={`${p.name} · ${p.clients} locales`}>
            <PlanForm plan={p} />
          </Card>
        ))}
        <Card title="Nuevo plan">
          <PlanForm />
        </Card>
      </div>
    </>
  )
}

function PlanForm({ plan }: { plan?: PlanRow }) {
  return (
    <ActionForm action={savePlan} submitLabel={plan ? 'Guardar' : 'Crear plan'}>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Id
          <input name="id" required defaultValue={plan?.id} readOnly={!!plan} className={inputClass} placeholder="ej. pro-anual" />
        </label>
        <label className={labelClass}>
          Nombre
          <input name="name" required defaultValue={plan?.name} className={inputClass} />
        </label>
        <label className={labelClass}>
          Precio ARS / mes
          <input name="price" inputMode="decimal" required defaultValue={plan ? String(Number(plan.monthly_price_cents) / 100) : ''} className={inputClass} />
        </label>
        <label className={labelClass}>
          Días de prueba
          <input name="trial_days" type="number" min={0} max={365} required defaultValue={plan?.trial_days ?? 14} className={inputClass} />
        </label>
        <label className={labelClass}>
          Orden
          <input name="sort" type="number" defaultValue={plan?.sort ?? 10} className={inputClass} />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={plan?.active ?? true} /> Activo (se ofrece en el alta)
        </label>
      </div>
      <label className={labelClass}>
        Descripción
        <input name="description" maxLength={200} defaultValue={plan?.description ?? ''} className={inputClass} />
      </label>
      <label className={labelClass}>
        Beneficios (uno por línea)
        <textarea name="features" rows={3} defaultValue={plan?.features?.join('\n') ?? ''} className={inputClass} />
      </label>
    </ActionForm>
  )
}

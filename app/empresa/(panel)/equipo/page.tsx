import type { Metadata } from 'next'
import { ActionForm, inputClass, labelClass } from '@/components/forms'
import { Card, PageTitle, Table, Td } from '@/components/panel/ui'
import { listEmpresaMembers } from '@/lib/data/empresa'
import { requireLocal } from '@/lib/guards'
import { PERMISSION_LABELS, LOCAL_PERMISSIONS, LOCAL_ROLE_LABELS, localCan, type LocalPermission, type LocalRole } from '@/lib/permissions'
import { inviteMember, removeMember } from '../actions'

export const metadata: Metadata = { title: 'Equipo' }

export default async function TeamPage() {
  const ctx = await requireLocal('team.view')
  const members = await listEmpresaMembers(ctx.clientId)
  const canManage = localCan(ctx.role, 'team.manage') && !ctx.readOnly
  const roles = Object.keys(LOCAL_PERMISSIONS) as LocalRole[]

  return (
    <>
      <PageTitle eyebrow={ctx.clientName} title="Equipo" description="Quiénes pueden entrar al panel de tu local." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="Miembros">
          <Table head={['Persona', 'Rol', '']}>
            {members.map((m) => (
              <tr key={m.userId}>
                <Td>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.email}
                    {m.mustChangePassword && ' · todavía no ingresó'}
                  </p>
                </Td>
                <Td>{LOCAL_ROLE_LABELS[m.role].name}</Td>
                <Td className="text-right">
                  {canManage && m.userId !== ctx.user.id && (
                    <form action={removeMember.bind(null, m.userId)}>
                      <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Quitar</button>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
        <div className="flex flex-col gap-5">
          {canManage && (
            <Card title="Invitar al equipo" description="Le llega un mail con su usuario y una contraseña temporal.">
              <ActionForm action={inviteMember} submitLabel="Enviar invitación" resetOnSuccess>
                <label className={labelClass}>
                  Nombre
                  <input name="name" maxLength={80} className={inputClass} />
                </label>
                <label className={labelClass}>
                  Correo electrónico
                  <input name="email" type="email" required className={inputClass} />
                </label>
                <label className={labelClass}>
                  Rol
                  <select name="role" defaultValue="staff" className={inputClass}>
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {LOCAL_ROLE_LABELS[r].name}
                      </option>
                    ))}
                  </select>
                </label>
              </ActionForm>
            </Card>
          )}
          <Card title="Qué puede hacer cada rol">
            <ul className="flex flex-col gap-4 text-sm">
              {roles.map((r) => (
                <li key={r}>
                  <p className="font-semibold">{LOCAL_ROLE_LABELS[r].name}</p>
                  <p className="text-xs text-muted-foreground">{LOCAL_ROLE_LABELS[r].description}</p>
                  <ul className="mt-1.5 list-disc pl-5 text-xs text-muted-foreground">
                    {(LOCAL_PERMISSIONS[r] as readonly LocalPermission[]).map((p) => (
                      <li key={p}>{PERMISSION_LABELS[p]}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}

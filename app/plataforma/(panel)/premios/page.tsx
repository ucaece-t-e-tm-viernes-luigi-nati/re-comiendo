import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requireSuperadmin } from '@/lib/guards'
import { localesParaGestion, premiosParaGestion } from '@/lib/services/metricas'
import { numero } from '../_componentes/formato'
import { SwitchPremioActivo } from '../_componentes/acciones-ui'
import { FormularioPremio } from '../_componentes/formulario-premio'

export default async function PaginaPremios() {
  await requireSuperadmin()
  const [premios, locales] = await Promise.all([premiosParaGestion(), localesParaGestion()])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="titulo text-3xl text-bordo">Premios</h1>

      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Premio</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Activo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {premios.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.titulo}</TableCell>
                <TableCell className="text-muted-foreground">{p.local?.nombre ?? 'Local eliminado'}</TableCell>
                <TableCell className="text-right">{numero(p.costo)} pts</TableCell>
                <TableCell className="flex justify-end">
                  <SwitchPremioActivo id={p.id} activo={p.activo} />
                </TableCell>
              </TableRow>
            ))}
            {premios.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  Todavía no hay premios creados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FormularioPremio locales={locales.map((l) => ({ id: l.id, nombre: l.nombre }))} />
    </div>
  )
}

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireLocalConFicha } from '@/lib/guards'
import { patrociniosDe, PLANES_PATROCINIO } from '@/lib/services/negocios'
import type { Patrocinio } from '@/lib/tipos'
import { FormularioPatrocinio } from './formulario'

export default async function PaginaPatrocinio() {
  const { local } = await requireLocalConFicha('sponsorship.manage')
  const patrocinios = (await patrociniosDe(local.id)) as unknown as Patrocinio[]

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="titulo text-2xl text-bordo-osc">Patrocinio</h1>
        <p className="text-sm text-muted-foreground">
          Un espacio patrocinado aparece destacado, con la etiqueta{' '}
          <Badge className="bg-durazno text-bordo-osc">Patrocinado</Badge> en las recomendaciones de tus clientes potenciales.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contratar un espacio</CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioPatrocinio planes={PLANES_PATROCINIO} />
          <p className="mt-3 text-xs text-muted-foreground">Pago simulado — próximamente Mercado Pago.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {patrocinios.length ? (
            patrocinios.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-suave px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-bordo-osc">{p.beneficio}</p>
                  <p className="text-xs text-muted-foreground">
                    Hasta {p.fin} · USD {p.monto_usd}
                  </p>
                </div>
                <Badge variant={p.activo ? 'default' : 'outline'}>{p.activo ? 'Activo' : 'Finalizado'}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no contrataste ningún espacio.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

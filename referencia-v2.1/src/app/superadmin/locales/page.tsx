import Link from 'next/link'
import { ExternalLink, AtSign, Mail, MapPin, Phone, User } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requerirRol } from '@/lib/services/auth'
import { localesParaGestion, solicitudesPendientes } from '@/lib/services/metricas'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA, PRECIO_TEXTO, type Categoria, type EstadoLocal, type Precio } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { AccionesEstadoLocal } from '../_componentes/acciones-ui'

const PESTAÑAS: { valor: EstadoLocal; etiqueta: string }[] = [
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'activo', etiqueta: 'Activos' },
  { valor: 'suspendido', etiqueta: 'Suspendidos' },
]

export default async function PaginaLocales({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requerirRol('superadmin')
  const { estado: estadoParam } = await searchParams
  const estado: EstadoLocal = PESTAÑAS.some((p) => p.valor === estadoParam) ? (estadoParam as EstadoLocal) : 'pendiente'

  const [locales, solicitudes] = await Promise.all([localesParaGestion(), estado === 'pendiente' ? solicitudesPendientes() : []])
  const filtrados = locales.filter((l) => l.estado === estado)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="titulo text-3xl text-bordo">Locales</h1>

      <div className="flex gap-2">
        {PESTAÑAS.map((p) => {
          const cantidad = locales.filter((l) => l.estado === p.valor).length
          return (
            <Link
              key={p.valor}
              href={`/superadmin/locales?estado=${p.valor}`}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                estado === p.valor ? 'border-bordo bg-bordo text-crema' : 'bg-card hover:border-bordo/40',
              )}
            >
              {p.etiqueta} ({cantidad})
            </Link>
          )
        })}
      </div>

      {estado === 'pendiente' ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {solicitudes.map((l) => (
            <article key={l.id} className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="titulo text-xl text-bordo-osc">
                    {EMOJI_CATEGORIA[l.categoria as Categoria]} {l.nombre}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {NOMBRE_CATEGORIA[l.categoria as Categoria]} · {PRECIO_TEXTO[l.precio as Precio]} · solicitado el{' '}
                    {new Date(l.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <AccionesEstadoLocal id={l.id} estado="pendiente" />
              </div>
              {l.descripcion && <p className="text-sm">{l.descripcion}</p>}
              <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" /> {l.direccion}
                  {l.barrio && `, ${l.barrio}`}
                </li>
                {l.responsable && (
                  <li className="flex items-center gap-2">
                    <User className="size-4 shrink-0" /> {l.responsable}
                  </li>
                )}
                {l.telefono && (
                  <li className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0" />
                    <a href={`https://wa.me/${l.telefono.replace(/\D/g, '')}`} target="_blank" className="hover:text-bordo">
                      {l.telefono}
                    </a>
                  </li>
                )}
                {l.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0" />
                    <a href={`mailto:${l.email}`} className="truncate hover:text-bordo">
                      {l.email}
                    </a>
                  </li>
                )}
                {l.instagram && (
                  <li className="flex items-center gap-2">
                    <AtSign className="size-4 shrink-0" />
                    <a href={`https://instagram.com/${l.instagram.replace(/^@/, '')}`} target="_blank" className="hover:text-bordo">
                      {l.instagram}
                    </a>
                  </li>
                )}
              </ul>
            </article>
          ))}
          {solicitudes.length === 0 && (
            <p className="rounded-2xl bg-card py-8 text-center text-muted-foreground ring-1 ring-foreground/5 lg:col-span-2">
              No hay solicitudes pendientes.
            </p>
          )}
        </div>
      ) : (
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Local</TableHead>
              <TableHead>Barrio</TableHead>
              <TableHead>Alta</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <Link href={`/local/${l.id}`} target="_blank" className="flex items-center gap-1.5 font-medium hover:text-bordo">
                    {EMOJI_CATEGORIA[l.categoria as Categoria]} {l.nombre}
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </Link>
                  <span className="text-xs text-muted-foreground">{NOMBRE_CATEGORIA[l.categoria as Categoria]}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{l.barrio}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(l.created_at).toLocaleDateString('es-AR')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <AccionesEstadoLocal id={l.id} estado={l.estado as EstadoLocal} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  No hay locales en este estado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  )
}

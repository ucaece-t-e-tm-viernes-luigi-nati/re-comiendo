import { Crown, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requerirRol } from '@/lib/services/auth'
import { usuariosParaGestion } from '@/lib/services/metricas'
import { numero } from '../_componentes/formato'
import { SelectorRol } from '../_componentes/acciones-ui'

export default async function PaginaUsuarios({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const perfil = await requerirRol('superadmin')
  const { q } = await searchParams
  const busqueda = (q ?? '').trim().toLowerCase()

  const usuarios = await usuariosParaGestion()
  const filtrados = busqueda
    ? usuarios.filter((u) => u.nombre.toLowerCase().includes(busqueda) || u.email.toLowerCase().includes(busqueda))
    : usuarios

  return (
    <div className="flex flex-col gap-4">
      <h1 className="titulo text-3xl text-bordo">Usuarios</h1>

      <form method="GET" className="relative max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q ?? ''} placeholder="Buscar por nombre o email…" className="pl-8" />
      </form>

      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead className="text-right">Puntos</TableHead>
              <TableHead>Alta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <SelectorRol id={u.id} rol={u.rol} esUnoMismo={u.id === perfil.id} />
                </TableCell>
                <TableCell>
                  {u.es_premium ? (
                    <Badge className="bg-durazno text-bordo-osc">
                      <Crown className="size-3" /> Premium
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{numero(u.puntos)}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString('es-AR')}</TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                  No encontramos usuarios con esa búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

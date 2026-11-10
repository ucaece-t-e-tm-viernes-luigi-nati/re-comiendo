import { requerirRol } from '@/lib/services/auth'
import { estadoRefi } from '@/lib/services/refi'
import { ChatRefi } from './chat'

export const metadata = { title: 'Refi' }

export default async function PaginaRefi() {
  const perfil = await requerirRol()
  const estado = await estadoRefi(perfil)
  return <ChatRefi nombre={perfil.nombre} premium={perfil.es_premium} disponible={estado.disponible} proxima={estado.proxima} />
}

import { connection } from 'next/server'
import { createMcpHandler } from 'mcp-handler'
import { registrarHerramientas } from '@/mcp/herramientas'

// MCP público de solo lectura (buscar_locales, recomendar, ver_local). No expone métricas ni datos del equipo.
const handler = createMcpHandler((server) => registrarHerramientas(server), {
  serverInfo: { name: 'recomiendo', version: '2.2.0' },
})

async function manejar(req: Request) {
  await connection()
  return handler(req)
}

export { manejar as GET, manejar as POST, manejar as DELETE }

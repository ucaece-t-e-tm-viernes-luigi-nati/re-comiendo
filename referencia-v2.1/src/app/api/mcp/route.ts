import { createMcpHandler } from 'mcp-handler'
import { registrarHerramientas } from '@/mcp/herramientas'

// Las herramientas públicas no necesitan auth. metricas_admin sólo aparece si el cliente manda
// "Authorization: Bearer <MCP_ADMIN_TOKEN>".
async function manejar(req: Request) {
  const token = process.env.MCP_ADMIN_TOKEN
  const esAdmin = !!token && req.headers.get('authorization') === `Bearer ${token}`
  const handler = createMcpHandler((server) => registrarHerramientas(server, { esAdmin }), {
    serverInfo: { name: 'recomiendo', version: '1.0.0' },
  })
  return handler(req)
}

export { manejar as GET, manejar as POST, manejar as DELETE }

// Servidor MCP de ReComiendo: expone la capa de servicios (/lib/services) como herramientas
// para asistentes de IA (Claude, Cursor, etc.). Se monta en /api/mcp.
import 'server-only'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/server'
import { listarLocales, obtenerLocal, obtenerSeñales, resenasDeLocal } from '@/lib/services/locales'
import { recomendacionesPara } from '@/lib/services/recomendaciones'
import { kpisAdmin, rangoDesdeDias, rankingLocales } from '@/lib/services/metricas'
import type { Perfil } from '@/lib/tipos'

const CATEGORIAS = ['cafe', 'mariscos', 'pizza-pastas', 'parrilla', 'cerveza', 'hamburguesas', 'sushi', 'veggie'] as const
const MOMENTOS = ['desayuno', 'almuerzo', 'merienda', 'cena', 'birra'] as const

const texto = (datos: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(datos, null, 2) }] })

export function registrarHerramientas(server: McpServer, opciones: { esAdmin: boolean }) {
  server.registerTool(
    'buscar_locales',
    {
      title: 'Buscar locales',
      description: 'Busca cafés, bares y restaurantes activos de Mar del Plata por texto, rubro o precio (1 a 3).',
      inputSchema: z.object({
        texto: z.string().optional(),
        categoria: z.enum(CATEGORIAS).optional(),
        precio: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
      }),
    },
    async ({ texto: t, categoria, precio }) => {
      const [locales, señales] = await Promise.all([listarLocales({ texto: t, categoria, precio }), obtenerSeñales()])
      return texto(
        locales.map((l) => ({ id: l.id, nombre: l.nombre, categoria: l.categoria, barrio: l.barrio, precio: l.precio, rating: señales[l.id]?.rating ?? null })),
      )
    },
  )

  server.registerTool(
    'recomendar',
    {
      title: 'Recomendar lugares',
      description: 'Devuelve las mejores recomendaciones según gustos (rubros), presupuesto, momento del día y ubicación opcional.',
      inputSchema: z.object({
        categorias: z.array(z.enum(CATEGORIAS)).default([]),
        precio: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
        momento: z.enum(MOMENTOS).optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        cantidad: z.number().int().min(1).max(20).default(5),
      }),
    },
    async ({ categorias, precio, momento, lat, lng, cantidad }) => {
      const perfil = {
        categorias,
        precio,
        modo: 'descubrir',
        aprendizaje: { pesos: {}, historial: [], descartados: [] },
        es_premium: true, // sin anuncios en las respuestas del asistente
      } as unknown as Perfil
      const recos = await recomendacionesPara({ ...perfil, id: '00000000-0000-0000-0000-000000000000' }, {
        momento: momento ?? null,
        ubicacion: lat != null && lng != null ? { lat, lng } : null,
        conPatrocinados: false,
      })
      return texto(
        recos.slice(0, cantidad).map((r) => ({
          id: r.local.id,
          nombre: r.local.nombre,
          match: r.match,
          motivo: r.motivo,
          barrio: r.local.barrio,
          distancia_km: r.distanciaKm != null ? Number(r.distanciaKm.toFixed(1)) : null,
        })),
      )
    },
  )

  server.registerTool(
    'ver_local',
    {
      title: 'Ver local',
      description: 'Ficha completa de un local: descripción, platos destacados, dirección y últimas reseñas.',
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const local = await obtenerLocal(id)
      if (!local || local.estado !== 'activo') return texto({ error: 'No encontramos ese local' })
      const resenas = await resenasDeLocal(id)
      return texto({
        ...local,
        owner_id: undefined,
        resenas: resenas.slice(0, 5).map((r) => ({ autor: r.autor, estrellas: r.estrellas, texto: r.texto })),
      })
    },
  )

  if (opciones.esAdmin) {
    server.registerTool(
      'metricas_admin',
      {
        title: 'Métricas del superadmin',
        description: 'KPIs de la plataforma (usuarios, Premium, locales, interacción) y ranking de locales. Sólo lectura.',
        inputSchema: z.object({ dias: z.number().int().min(1).max(365).default(30) }),
      },
      async ({ dias }) => {
        const rango = rangoDesdeDias(dias)
        const [kpis, ranking] = await Promise.all([kpisAdmin(rango), rankingLocales(rango, 10)])
        return texto({ dias, kpis, ranking })
      },
    )
  }
}

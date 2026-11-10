import 'server-only'
import { q, q1 } from '../db'
import type { Categoria, Perfil, Precio } from '../tipos'
import { recomendacionesPara } from './recomendaciones'

// Refi, el asistente de ReComiendo. Por ahora es una MAQUETA: interpreta el mensaje con palabras
// clave y usa el recomendador de siempre. Cuando se conecte el agente, la API key de Claude se
// carga desde Superadmin → Ajustes (ver obtenerApiKeyClaude).

export const DIAS_LIMITE_GRATIS = 7

/** Si el usuario puede consultar ahora y, si no, desde cuándo vuelve a poder. */
export async function estadoRefi(perfil: Perfil): Promise<{ disponible: boolean; proxima: string | null }> {
  if (perfil.es_premium) return { disponible: true, proxima: null }
  const desde = new Date(Date.now() - DIAS_LIMITE_GRATIS * 86400000)
  const data = await q1<{ created_at: Date }>(
    `SELECT created_at FROM refi_consultas WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at DESC LIMIT 1`,
    [perfil.id, desde],
  )
  if (!data) return { disponible: true, proxima: null }
  return { disponible: false, proxima: new Date(new Date(data.created_at).getTime() + DIAS_LIMITE_GRATIS * 86400000).toISOString() }
}

const PALABRAS: [RegExp, Categoria][] = [
  [/caf[eé]|desayun|merienda|torta|medialuna|dulce|pasteler/i, 'cafe'],
  [/marisc|pescad|rabas|frutos de mar|langostin|mar\b/i, 'mariscos'],
  [/pizza|pasta|fideo|ñoqui|noqui|ravio|italian/i, 'pizza-pastas'],
  [/asado|parrill|carne|bife|vac[ií]o|chori/i, 'parrilla'],
  [/cerve|birra|pinta|after/i, 'cerveza'],
  [/hambur|burger|papas fritas/i, 'hamburguesas'],
  [/sushi|japon|roll|ramen/i, 'sushi'],
  [/veggie|vegan|vegetarian|ensalada|liviano|sano|saludable/i, 'veggie'],
]

const FILTROS: [RegExp, string][] = [
  [/perr|mascota|pet/i, 'pet friendly'],
  [/vista al mar|frente al mar|ver el mar/i, 'vista al mar'],
  [/cel[ií]ac|sin tacc|gluten/i, 'sin tacc'],
  [/vegan/i, 'opciones veganas'],
  [/afuera|aire libre|terraza|patio/i, 'al aire libre'],
  [/grupo|amig|cumple|somos muchos/i, 'para grupos'],
  [/cita|pareja|rom[aá]ntic|aniversario/i, 'romantico'],
]

function interpretar(texto: string) {
  const categorias = PALABRAS.filter(([r]) => r.test(texto)).map(([, c]) => c)
  const filtros = FILTROS.filter(([r]) => r.test(texto)).map(([, f]) => f)
  const precio: Precio | null = /barat|econ[oó]mic|poca plata|ajustad|fin de mes/i.test(texto)
    ? 1
    : /especial|cheto|darme un gusto|top|lujo/i.test(texto)
      ? 3
      : null
  return { categorias, filtros, precio }
}

/** Consulta a Refi: registra el uso (para el límite) y devuelve hasta 3 opciones. */
export async function consultarRefi(perfil: Perfil, entrada: { tipo: 'texto' | 'audio'; texto: string }) {
  const estado = await estadoRefi(perfil)
  if (!estado.disponible) return { limite: true as const, proxima: estado.proxima }

  // Un audio todavía no se transcribe (llega con el agente): se responde con los gustos del perfil.
  const { categorias, filtros, precio } = interpretar(entrada.texto)
  const base = { ...perfil, categorias: categorias.length ? categorias : perfil.categorias, precio: precio ?? perfil.precio }
  let opciones = await recomendacionesPara(base, { conPatrocinados: false, filtros, momento: null })
  if (!opciones.length && filtros.length) opciones = await recomendacionesPara(base, { conPatrocinados: false, momento: null })

  await q(`INSERT INTO refi_consultas (user_id, tipo, texto) VALUES ($1, $2, $3)`, [perfil.id, entrada.tipo, entrada.texto.slice(0, 600)])

  const entendi =
    entrada.tipo === 'audio'
      ? 'Escuché tu audio. Mientras aprendo a entender audios, te propongo según tus gustos:'
      : categorias.length || filtros.length || precio
        ? `Entendí que tenés ganas de ${[...categorias.map((c) => c.replace('-', ' y ')), ...filtros].join(', ') || 'algo rico'}${precio === 1 ? ', sin gastar mucho' : precio === 3 ? ', para darte un gusto' : ''}. Mirá estas opciones:`
        : 'No me quedó claro qué tenés ganas de comer, así que te propongo según tus gustos:'

  return {
    limite: false as const,
    mensaje: entendi,
    opciones: opciones.slice(0, 3).map((o) => ({ id: o.local.id, nombre: o.local.nombre, categoria: o.local.categoria, barrio: o.local.barrio, motivo: o.motivo, match: o.match })),
    proxima: perfil.es_premium ? null : new Date(Date.now() + DIAS_LIMITE_GRATIS * 86400000).toISOString(),
  }
}

// ───────── API key de Claude (Superadmin → Ajustes) ─────────

const CLAVE_API = 'claude_api_key'

/** Para usar en el back end cuando se conecte el agente. Nunca mandarla al navegador. */
export async function obtenerApiKeyClaude(): Promise<string | null> {
  const data = await q1<{ valor: string }>(`SELECT valor FROM ajustes WHERE clave = $1`, [CLAVE_API])
  return data?.valor ?? null
}

/** Lo que ve el superadmin: sólo el final de la clave. */
export async function estadoApiKeyClaude(): Promise<{ conectada: boolean; final: string; actualizada: string | null }> {
  const data = await q1<{ valor: string; updated_at: Date }>(`SELECT valor, updated_at FROM ajustes WHERE clave = $1`, [CLAVE_API])
  if (!data) return { conectada: false, final: '', actualizada: null }
  return { conectada: true, final: data.valor.slice(-4), actualizada: new Date(data.updated_at).toISOString() }
}

export async function guardarApiKeyClaude(valor: string) {
  await q(
    `INSERT INTO ajustes (clave, valor, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = now()`,
    [CLAVE_API, valor],
  )
}

export async function borrarApiKeyClaude() {
  await q(`DELETE FROM ajustes WHERE clave = $1`, [CLAVE_API])
}

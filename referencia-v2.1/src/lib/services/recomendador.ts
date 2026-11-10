// Algoritmo de recomendación v1. Función pura (sin base de datos) para poder testearla
// y reemplazarla más adelante por un modelo con IA sin tocar la UI.
//
// Puntaje = gustos + aprendizaje + presupuesto + distancia + rating + popularidad + novedad
// Los locales patrocinados se intercalan aparte (ver mezclarPatrocinados) y siempre
// llevan la etiqueta "Patrocinado".
import type { Aprendizaje, Categoria, Local, Modo, Momento, Precio } from '../tipos'
import { NOMBRE_CATEGORIA } from '../tipos'

export const RUBROS_POR_MOMENTO: Record<Momento, Categoria[]> = {
  desayuno: ['cafe'],
  merienda: ['cafe', 'veggie'],
  almuerzo: ['mariscos', 'pizza-pastas', 'parrilla', 'hamburguesas', 'sushi', 'veggie'],
  cena: ['mariscos', 'pizza-pastas', 'parrilla', 'cerveza', 'hamburguesas', 'sushi', 'veggie'],
  birra: ['cerveza', 'hamburguesas'],
}

const MOTIVO_MOMENTO: Record<Momento, string> = {
  desayuno: 'Ideal para desayunar',
  merienda: 'Ideal para merendar',
  almuerzo: 'Ideal para almorzar',
  cena: 'Ideal para cenar',
  birra: 'Ideal para unas birras',
}

/** Datos de cada local que vienen de la base (reseñas y eventos). */
export interface Señales {
  rating: number // promedio de estrellas, 0 si no tiene
  cantidadResenas: number
  popularidad: number // vistas + reservas de los últimos 30 días
}

export interface Contexto {
  categorias: Categoria[]
  precio: Precio
  modo: Modo
  aprendizaje: Aprendizaje
  momento: Momento | null
  visitados: string[] // locales que el usuario ya reseñó
  favoritos: string[]
  filtros?: string[] // tags que tiene que cumplir (filtros Premium)
  ubicacion?: { lat: number; lng: number } | null
  señales: Record<string, Señales>
}

export interface Recomendacion {
  local: Local
  puntaje: number
  match: number
  motivo: string
  distanciaKm: number | null
  patrocinado?: string // beneficio, si es un anuncio
}

const VUELTAS_SIN_REPETIR = 3
const LIMITE_PESO = 3

export function momentoActual(fecha = new Date()): Momento {
  const h = fecha.getHours()
  if (h < 11) return 'desayuno'
  if (h < 16) return 'almuerzo'
  if (h < 19) return 'merienda'
  if (h < 21) return 'birra'
  return 'cena'
}

export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(x))
}

export function pasaFiltros(local: Local, ctx: Contexto): boolean {
  if (ctx.momento && !RUBROS_POR_MOMENTO[ctx.momento].includes(local.categoria)) return false
  if (ctx.momento && !local.momentos.includes(ctx.momento)) return false
  if (ctx.aprendizaje.descartados.includes(local.id)) return false
  if (ctx.filtros?.some((f) => !local.tags.includes(f))) return false
  return true
}

export function puntuar(local: Local, ctx: Contexto): { puntaje: number; motivo: string; distanciaKm: number | null } {
  const factores: [number, string][] = []

  // 1. Gustos declarados
  if (ctx.categorias.includes(local.categoria)) {
    factores.push([3, `Porque te gusta: ${NOMBRE_CATEGORIA[local.categoria].toLowerCase()}`])
  }

  // 2. Lo que aprendimos con "Me copa" / "Otra opción"
  const peso = clamp(ctx.aprendizaje.pesos[local.categoria] ?? 0, -LIMITE_PESO, LIMITE_PESO)
  if (peso !== 0) factores.push([peso, peso > 0 ? 'Aprendimos que te copa este estilo' : ''])

  // 3. Presupuesto
  const dif = Math.abs(local.precio - ctx.precio)
  factores.push([dif === 0 ? 1.5 : dif === 1 ? 0.5 : -1, dif === 0 ? 'Va con tu presupuesto' : ''])

  // 4. Distancia (si compartió ubicación)
  let km: number | null = null
  if (ctx.ubicacion && local.lat != null && local.lng != null) {
    km = distanciaKm(ctx.ubicacion, { lat: local.lat, lng: local.lng })
    if (km < 1) factores.push([1.5, 'Te queda a pasos'])
    else if (km < 3) factores.push([0.8, 'Te queda cerca'])
    else if (km > 8) factores.push([-1, ''])
  }

  // 5. Rating y popularidad
  const s = ctx.señales[local.id]
  if (s && s.cantidadResenas > 0) {
    factores.push([(s.rating - 4) * 1.5, s.rating >= 4.6 ? 'De los mejor puntuados' : ''])
  }
  if (s && s.popularidad > 0) {
    factores.push([Math.min(1.2, Math.log10(1 + s.popularidad) * 0.6), s.popularidad > 40 ? 'Está de moda esta semana' : ''])
  }

  // 6. Novedad vs. lo seguro, según el modo
  const visitado = ctx.visitados.includes(local.id)
  const favorito = ctx.favoritos.includes(local.id)
  if (ctx.modo === 'descubrir') {
    if (local.nicho) factores.push([1.5, 'Un lugar de nicho para descubrir'])
    if (!visitado) factores.push([1, ''])
  } else if (visitado || favorito) {
    factores.push([2, 'Un lugar que ya te gustó'])
  }

  // 7. No repetir lo que ya mostramos hace poco
  const vuelta = ctx.aprendizaje.historial.indexOf(local.id)
  if (vuelta !== -1 && vuelta < VUELTAS_SIN_REPETIR) factores.push([-6, ''])

  const puntaje = factores.reduce((acc, [p]) => acc + p, 0)
  const motivos: [number, string][] = [
    ...factores.filter(([p, m]) => p > 0 && m),
    ...(ctx.momento ? [[1.6, MOTIVO_MOMENTO[ctx.momento]] as [number, string]] : []),
  ]
  const principal = motivos.sort((a, b) => b[0] - a[0])[0]
  return { puntaje, motivo: principal?.[1] ?? 'Puede sorprenderte', distanciaKm: km }
}

export function matchDesdePuntaje(puntaje: number): number {
  return Math.round(clamp(55 + puntaje * 6, 60, 99))
}

export function recomendar(locales: Local[], ctx: Contexto): Recomendacion[] {
  return locales
    .filter((l) => pasaFiltros(l, ctx))
    .map((local) => {
      const { puntaje, motivo, distanciaKm } = puntuar(local, ctx)
      return { local, puntaje, motivo, distanciaKm, match: matchDesdePuntaje(puntaje) }
    })
    .sort((a, b) => b.puntaje - a.puntaje || a.local.nombre.localeCompare(b.local.nombre))
}

/** Intercala un patrocinado cada `cada` resultados (sin duplicar locales). */
export function mezclarPatrocinados(
  lista: Recomendacion[],
  patrocinados: Recomendacion[],
  cada = 4,
): Recomendacion[] {
  const ids = new Set(patrocinados.map((p) => p.local.id))
  const organicos = lista.filter((r) => !ids.has(r.local.id))
  const salida: Recomendacion[] = []
  let p = 0
  organicos.forEach((r, i) => {
    if (i > 0 && i % cada === 0 && p < patrocinados.length) salida.push(patrocinados[p++])
    salida.push(r)
  })
  return salida
}

/** Ajusta los pesos por categoría según el feedback (+1 me copa, -1 otra opción). */
export function aprender(ap: Aprendizaje, categoria: Categoria, delta: number): Aprendizaje {
  const actual = ap.pesos[categoria] ?? 0
  return { ...ap, pesos: { ...ap.pesos, [categoria]: clamp(actual + delta, -LIMITE_PESO, LIMITE_PESO) } }
}

export function registrarPrincipal(ap: Aprendizaje, id: string): Aprendizaje {
  if (ap.historial[0] === id) return ap
  return { ...ap, historial: [id, ...ap.historial.filter((h) => h !== id)].slice(0, 20) }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

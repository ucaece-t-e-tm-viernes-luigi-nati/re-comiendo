import { describe, expect, it } from 'vitest'
import type { Local } from '../tipos'
import { aprender, mezclarPatrocinados, recomendar, registrarPrincipal, type Contexto } from './recomendador'

const local = (id: string, extra: Partial<Local> = {}): Local => ({
  id, owner_id: null, nombre: id, categoria: 'cafe', barrio: 'Centro', direccion: '', lat: -38, lng: -57.55,
  precio: 2, momentos: ['desayuno', 'merienda', 'almuerzo', 'cena'], tags: [], platos: [], descripcion: '',
  instagram: '', horarios: '', fotos: [], nicho: false, estado: 'activo', created_at: '', ...extra,
})

const ctx = (extra: Partial<Contexto> = {}): Contexto => ({
  categorias: ['sushi'], precio: 2, modo: 'descubrir', momento: null, visitados: [], favoritos: [], señales: {},
  aprendizaje: { pesos: {}, historial: [], descartados: [] }, ...extra,
})

describe('recomendador', () => {
  it('prioriza los rubros que le gustan', () => {
    const r = recomendar([local('cafe1'), local('sushi1', { categoria: 'sushi' })], ctx())
    expect(r[0].local.id).toBe('sushi1')
  })

  it('filtra por momento del día', () => {
    const r = recomendar([local('cafe1'), local('birra1', { categoria: 'cerveza', momentos: ['birra'] })], ctx({ momento: 'birra' }))
    expect(r.map((x) => x.local.id)).toEqual(['birra1'])
  })

  it('no repite la última recomendación principal', () => {
    let ap = registrarPrincipal(ctx().aprendizaje, 'sushi1')
    ap = aprender(ap, 'sushi', 0)
    const r = recomendar([local('sushi1', { categoria: 'sushi' }), local('sushi2', { categoria: 'sushi' })], ctx({ aprendizaje: ap }))
    expect(r[0].local.id).toBe('sushi2')
  })

  it('premia la cercanía cuando hay ubicación', () => {
    const cerca = local('cerca', { lat: -38.0, lng: -57.55 })
    const lejos = local('lejos', { lat: -38.2, lng: -57.7 })
    const r = recomendar([lejos, cerca], ctx({ categorias: [], ubicacion: { lat: -38.0, lng: -57.55 } }))
    expect(r[0].local.id).toBe('cerca')
  })

  it('intercala patrocinados sin duplicar', () => {
    const lista = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ local: local(id), puntaje: 1, match: 80, motivo: '', distanciaKm: null }))
    const anuncio = { ...lista[2], patrocinado: '2x1' }
    const r = mezclarPatrocinados(lista, [anuncio], 2)
    expect(r.filter((x) => x.local.id === 'c')).toHaveLength(1)
    expect(r[2].patrocinado).toBe('2x1')
  })
})

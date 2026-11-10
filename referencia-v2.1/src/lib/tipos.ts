// Tipos del dominio, compartidos por front end, back end y MCP.

export type Rol = 'usuario' | 'negocio' | 'superadmin'

export type Categoria =
  | 'cafe'
  | 'mariscos'
  | 'pizza-pastas'
  | 'parrilla'
  | 'cerveza'
  | 'hamburguesas'
  | 'sushi'
  | 'veggie'

export type Momento = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'birra'
export type Precio = 1 | 2 | 3
export type Modo = 'descubrir' | 'seguro'
export type EstadoLocal = 'pendiente' | 'activo' | 'suspendido'

export interface Local {
  id: string
  owner_id: string | null
  nombre: string
  categoria: Categoria
  barrio: string
  direccion: string
  lat: number | null
  lng: number | null
  precio: Precio
  momentos: Momento[]
  tags: string[]
  platos: string[]
  descripcion: string
  instagram: string
  horarios: string
  fotos: string[]
  nicho: boolean
  estado: EstadoLocal
  created_at: string
}

export interface Aprendizaje {
  pesos: Partial<Record<Categoria, number>>
  /** ids que fueron recomendación principal, el más reciente primero */
  historial: string[]
  descartados: string[]
}

export interface Perfil {
  id: string
  nombre: string
  rol: Rol
  categorias: Categoria[]
  precio: Precio
  modo: Modo
  onboarding_ok: boolean
  aprendizaje: Aprendizaje
  es_premium: boolean
  premium_desde: string | null
  puntos: number
  created_at: string
}

export interface Resena {
  id: string
  local_id: string
  user_id: string | null
  autor: string
  estrellas: number
  etiquetas: string[]
  texto: string
  foto: string | null
  respuesta: string | null
  oculta: boolean
  created_at: string
}

export interface Publicacion {
  id: string
  local_id: string
  tipo: 'post' | 'promo'
  texto: string
  foto: string | null
  vence: string | null
  created_at: string
}

export interface Reserva {
  id: string
  local_id: string
  user_id: string
  fecha: string
  hora: string
  personas: number
  codigo: string
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'usada'
  created_at: string
}

export interface Premio {
  id: string
  titulo: string
  local_id: string
  costo: number
  activo: boolean
}

export interface Canje {
  id: string
  premio_id: string
  user_id: string
  codigo: string
  usado: boolean
  created_at: string
}

export interface Patrocinio {
  id: string
  local_id: string
  beneficio: string
  monto_usd: number
  inicio: string
  fin: string
  activo: boolean
}

export type TipoEvento =
  | 'view_local'
  | 'click_instagram'
  | 'click_como_llegar'
  | 'reserva'
  | 'canje'
  | 'compra_premium'
  | 'impresion_anuncio'
  | 'click_anuncio'
  | 'resena'
  | 'seguir'
  | 'recomendacion'
  | 'registro'
  | 'sesion'

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  cafe: 'Café y pastelería',
  mariscos: 'Pescados y mariscos',
  'pizza-pastas': 'Pizza y pastas',
  parrilla: 'Parrilla',
  cerveza: 'Cerveza artesanal',
  hamburguesas: 'Hamburguesas',
  sushi: 'Sushi',
  veggie: 'Veggie',
}

export const EMOJI_CATEGORIA: Record<Categoria, string> = {
  cafe: '☕',
  mariscos: '🦑',
  'pizza-pastas': '🍕',
  parrilla: '🥩',
  cerveza: '🍺',
  hamburguesas: '🍔',
  sushi: '🍣',
  veggie: '🥗',
}

export const NOMBRE_MOMENTO: Record<Momento, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  birra: 'Birras',
}

export const TAGS = ['al aire libre', 'clasico', 'para grupos', 'pet friendly', 'romantico', 'sin tacc', 'vista al mar'] as const

export const PRECIO_TEXTO: Record<Precio, string> = { 1: '$', 2: '$$', 3: '$$$' }

export const PUNTOS = { resena: 40, foto: 10, inicial: 50 } as const
export const PREMIUM_USD = 2

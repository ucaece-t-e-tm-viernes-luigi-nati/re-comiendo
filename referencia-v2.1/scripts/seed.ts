// Carga datos de prueba: locales reales de Mar del Plata, cuentas demo, reseñas,
// publicaciones, premios, patrocinios y 60 días de eventos para los dashboards.
// Uso: npm run db:seed   (se puede correr de nuevo: borra y vuelve a cargar los datos demo)
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { conectar } from './db'

const PASSWORD = 'recomiendo123'
const DEMO = {
  admin: { email: 'admin@recomiendo.app', nombre: 'Equipo ReComiendo', rol: 'superadmin' },
  negocio: { email: 'negocio@recomiendo.app', nombre: 'Montecatini', rol: 'negocio' },
  usuario: { email: 'usuario@recomiendo.app', nombre: 'Sofi', rol: 'usuario' },
} as const

// Generador determinístico: los datos salen iguales cada vez
let semilla = 42
function azar() {
  semilla = (semilla * 1664525 + 1013904223) % 2 ** 32
  return semilla / 2 ** 32
}
const entero = (min: number, max: number) => Math.floor(azar() * (max - min + 1)) + min
const elegir = <T,>(xs: readonly T[]) => xs[Math.floor(azar() * xs.length)]

const NOMBRES = ['Sofi', 'Juli', 'Tomi', 'Cami', 'Nico', 'Agus', 'Male', 'Fran', 'Lucho', 'Mica', 'Santi', 'Flor', 'Joaco', 'Lu', 'Valen', 'Pili', 'Mati', 'Belu', 'Gonza', 'Ro', 'Facu', 'Delfi', 'Nacho', 'Euge', 'Lauti', 'Abril', 'Bauti', 'Caro', 'Tincho', 'Vicky', 'Fede', 'Ailu', 'Leo', 'Meli', 'Rami', 'Guada', 'Pato', 'Sol', 'Juan', 'Emi']
const APELLIDOS = ['M.', 'R.', 'G.', 'P.', 'A.', 'L.', 'V.', 'S.', 'B.', 'D.']

const FRASES: Record<string, string[]> = {
  cafe: ['El café, impecable. Las medialunas recién hechas.', 'Ideal para merendar tranqui con amigas.', 'Buena atención y precios razonables.', 'El flat white es de lo mejor de Mardel.'],
  mariscos: ['Las rabas, lo mejor. Fuimos sin reserva y no esperamos nada.', 'Pescado fresquísimo, se nota que es del día.', 'Porciones enormes, para compartir.', 'La cazuela, un abrazo al alma.'],
  'pizza-pastas': ['La masa casera, un golazo.', 'Pedimos sorrentinos y volvería solo por eso.', 'Clásico de Mardel, nunca falla.', 'La fugazzeta rellena, tremenda.'],
  parrilla: ['Carne en su punto justo y la provoleta tremenda.', 'Para ir con la familia un domingo.', 'Buena relación precio-calidad.', 'El vacío se cortaba con cuchara.'],
  cerveza: ['Muchas canillas y la IPA buenísima.', 'Ambiente re lindo para after.', 'Las papas con cheddar, imperdibles.', 'Happy hour largo y buena música.'],
  hamburguesas: ['Hamburguesa jugosa y el pan riquísimo.', 'Las papas rústicas, de lo mejor.', 'Rápido y rico, ideal para antes de salir.', 'La smash doble es otra cosa.'],
  sushi: ['Piezas frescas y bien armadas.', 'Las combinaciones de autor, muy buenas.', 'Un poco caro pero lo vale.', 'El roll crispy, adictivo.'],
  veggie: ['Opciones veganas de verdad ricas.', 'Bowls abundantes y frescos.', 'Lindo lugar para almorzar liviano.', 'Hasta mi novio carnívoro quedó contento.'],
}
const ETIQUETAS = ['Rico', 'Buena atención', 'Buen precio', 'Lindo lugar', 'Rápido', 'Porciones grandes']

const POSTS: Record<string, string[]> = {
  cafe: ['Salieron las medialunas de la tarde 🥐', 'Nuevo blend de especialidad en barra ☕', 'Hoy: torta del día de frutos rojos'],
  mariscos: ['Llegó la pesca del día 🐟', 'Rabas recién salidas, ¿quién se suma?', 'Abrimos el salón del primer piso con vista al puerto'],
  'pizza-pastas': ['Masa madre de 48 h, la diferencia se nota 🍕', 'Sorrentinos de calabaza, edición limitada', 'Domingo de pastas en familia'],
  parrilla: ['El fuego ya está prendido 🔥', 'Vacío a la llama para compartir', 'Mesa larga para grupos, reservá con la app'],
  cerveza: ['Nueva IPA en canilla 🍺', 'Happy hour extendido hasta las 21', 'Esta noche música en vivo'],
  hamburguesas: ['Nueva burger del mes: doble cheddar y cebolla crispy 🍔', 'Papas rústicas con alioli, nuevo topping', 'Combo para dos al mejor precio'],
  sushi: ['Nuevos rolls de temporada 🍣', 'Combinado de 30 piezas para compartir', 'Probá el tiradito de salmón'],
  veggie: ['Bowl de estación con hummus casero 🥗', 'Nuevo brownie vegano', 'Menú del día 100% plant based'],
}
const PROMOS: Record<string, string> = {
  cafe: '2x1 en cafés de 8 a 10 h',
  mariscos: '15% off en la tabla de rabas los martes',
  'pizza-pastas': 'Pizza grande + fainá a precio especial',
  parrilla: 'Provoleta de regalo con la parrillada para 2',
  cerveza: '2x1 en pintas de 18 a 20 h',
  hamburguesas: 'Papas gratis con cualquier burger doble',
  sushi: '10 piezas de regalo con el combinado de 30',
  veggie: 'Postre vegano de regalo al mediodía',
}

async function main() {
  const db = await conectar()
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

  // ── Limpieza (sólo datos de dominio y usuarios @recomiendo.app / @demo.recomiendo.app)
  console.log('Limpiando datos anteriores…')
  await db.query('truncate public.events, public.canjes, public.premios, public.reservas, public.patrocinios, public.suscripciones, public.seguidores, public.favoritos, public.resenas, public.publicaciones, public.locales cascade')
  const { rows: viejos } = await db.query<{ id: string }>("select id from auth.users where email like '%@recomiendo.app' or email like '%@demo.recomiendo.app'")
  for (const u of viejos) await admin.auth.admin.deleteUser(u.id)

  // ── Usuarios
  async function crearUsuario(email: string, nombre: string, rol: string, creado: Date) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { nombre } })
    if (error) throw error
    await db.query('update public.profiles set rol = $2, created_at = $3 where id = $1', [data.user.id, rol, creado])
    return data.user.id
  }
  console.log('Creando cuentas…')
  const hace = (dias: number) => new Date(Date.now() - dias * 86400000 - entero(0, 86400000))
  const idAdmin = await crearUsuario(DEMO.admin.email, DEMO.admin.nombre, DEMO.admin.rol, hace(90))
  const idNegocio = await crearUsuario(DEMO.negocio.email, DEMO.negocio.nombre, DEMO.negocio.rol, hace(80))
  const idUsuario = await crearUsuario(DEMO.usuario.email, DEMO.usuario.nombre, DEMO.usuario.rol, hace(45))
  await db.query(
    `update public.profiles set categorias = '{cafe,sushi,cerveza}', precio = 2, onboarding_ok = true, puntos = 320 where id = $1`,
    [idUsuario],
  )
  void idAdmin

  const usuarios: string[] = [idUsuario]
  for (let i = 0; i < 46; i++) {
    const nombre = `${NOMBRES[i % NOMBRES.length]} ${elegir(APELLIDOS)}`
    // más registros en las últimas semanas: la app está creciendo
    const dias = Math.floor(60 * Math.sqrt(azar()))
    const id = await crearUsuario(`persona${i + 1}@demo.recomiendo.app`, nombre, 'usuario', hace(60 - dias))
    const cats = [...new Set([elegir(Object.keys(FRASES)), elegir(Object.keys(FRASES)), elegir(Object.keys(FRASES))])]
    await db.query(
      `update public.profiles set categorias = $2, precio = $3, onboarding_ok = true, puntos = $4 where id = $1`,
      [id, cats, entero(1, 3), entero(0, 900)],
    )
    usuarios.push(id)
  }

  // ── Locales (ubicaciones repetidas se separan un poco para que no se pisen en el mapa)
  console.log('Cargando locales…')
  const locales = JSON.parse(readFileSync('data/locales.json', 'utf8')) as Record<string, any>[]
  const vistos = new Map<string, number>()
  for (const l of locales) {
    const clave = `${l.lat},${l.lng}`
    const n = vistos.get(clave) ?? 0
    vistos.set(clave, n + 1)
    const ang = n * 2.4
    const lat = l.lat + (n ? Math.sin(ang) * 0.0012 * Math.sqrt(n) : 0)
    const lng = l.lng + (n ? Math.cos(ang) * 0.0015 * Math.sqrt(n) : 0)
    await db.query(
      `insert into public.locales (id, owner_id, nombre, categoria, barrio, direccion, lat, lng, precio, momentos, tags, platos,
        descripcion, instagram, horarios, fotos, nicho, estado, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'activo',$18)`,
      [l.id, l.id === 'montecatini' ? idNegocio : null, l.nombre, l.categoria, l.barrio, l.direccion, lat, lng, l.precio,
        l.momentos, l.tags, l.platos, l.descripcion, l.instagram, 'Todos los días de 12 a 16 y de 20 a 00',
        l.fotos.map((f: string) => '/' + f), l.nicho ?? false, hace(entero(60, 120))],
    )
  }
  // Dos negocios nuevos esperando aprobación del superadmin
  await db.query(`insert into public.locales (id, nombre, categoria, barrio, direccion, lat, lng, precio, momentos, descripcion, estado, created_at) values
    ('la-esquina-del-puerto', 'La Esquina del Puerto', 'mariscos', 'Puerto', '12 de Octubre 3200', -38.0412, -57.5386, 2, '{almuerzo,cena}', 'Cantina familiar de pescados frescos.', 'pendiente', now() - interval '2 days'),
    ('cafe-del-bosque', 'Café del Bosque', 'cafe', 'Bosque Peralta Ramos', 'Av. Mario Bravo 1500', -38.0745, -57.5781, 1, '{desayuno,merienda}', 'Café de especialidad entre los pinos.', 'pendiente', now() - interval '1 day')`)

  const activos = locales.map((l) => l.id as string)
  const categoriaDe = Object.fromEntries(locales.map((l) => [l.id, l.categoria as string]))
  const fotosDe = Object.fromEntries(locales.map((l) => [l.id, l.fotos.map((f: string) => '/' + f) as string[]]))
  // Algunos locales son más populares que otros (distribución tipo "long tail")
  const pesoLocal = Object.fromEntries(activos.map((id, i) => [id, 1 / (1 + (i * 7) % 23) + (id === 'montecatini' ? 0.6 : 0)]))
  const totalPeso = Object.values(pesoLocal).reduce((a, b) => a + b, 0)
  function localPopular() {
    let r = azar() * totalPeso
    for (const id of activos) {
      r -= pesoLocal[id]
      if (r <= 0) return id
    }
    return activos[0]
  }

  // ── Reseñas
  console.log('Cargando reseñas, publicaciones y premios…')
  for (const id of activos) {
    const cant = entero(3, 7)
    for (let i = 0; i < cant; i++) {
      const u = elegir(usuarios)
      const { rows } = await db.query<{ nombre: string }>('select nombre from public.profiles where id = $1', [u])
      const conFoto = azar() < 0.25
      await db.query(
        `insert into public.resenas (local_id, user_id, autor, estrellas, etiquetas, texto, foto, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, u, rows[0].nombre, azar() < 0.7 ? 5 : azar() < 0.8 ? 4 : 3, [elegir(ETIQUETAS), elegir(ETIQUETAS)].filter((v, k, a) => a.indexOf(v) === k),
          elegir(FRASES[categoriaDe[id]]), conFoto ? elegir(fotosDe[id]) : null, hace(entero(0, 55))],
      )
    }
  }
  await db.query(`update public.resenas set respuesta = '¡Gracias por venir! Los esperamos de nuevo 🙌' where local_id = 'montecatini' and estrellas = 5`)

  // ── Publicaciones (posts y promos)
  for (const id of activos) {
    if (azar() < 0.35 && id !== 'montecatini') continue
    const cat = categoriaDe[id]
    const cant = id === 'montecatini' ? 3 : entero(1, 2)
    for (let i = 0; i < cant; i++) {
      await db.query(`insert into public.publicaciones (local_id, tipo, texto, foto, created_at) values ($1,'post',$2,$3,$4)`,
        [id, POSTS[cat][i % POSTS[cat].length], fotosDe[id][i % fotosDe[id].length], hace(entero(0, 20))])
    }
    if (azar() < 0.4 || id === 'montecatini') {
      await db.query(`insert into public.publicaciones (local_id, tipo, texto, foto, vence, created_at) values ($1,'promo',$2,$3,current_date + 14,$4)`,
        [id, PROMOS[cat], fotosDe[id][0], hace(entero(0, 10))])
    }
  }

  // ── Premios, patrocinios y seguidores
  await db.query(`insert into public.premios (id, titulo, local_id, costo) values
    ('cafe', 'Café con medialunas gratis', 'la-fonte-doro', 400),
    ('churros', 'Docena de churros', 'manolo', 600),
    ('pinta', 'Pinta de regalo', 'antares', 800),
    ('descuento', '15% off en la cuenta', 'montecatini', 1200)`)
  await db.query(`insert into public.patrocinios (local_id, beneficio, monto_usd, inicio, fin) values
    ('montecatini', '10% off pagando con la app', 20, current_date - 10, current_date + 20),
    ('antares', '2x1 en pintas de 18 a 20 h', 20, current_date - 5, current_date + 25)`)
  for (const u of usuarios) {
    const sigue = new Set(Array.from({ length: entero(1, 6) }, localPopular))
    for (const l of sigue) {
      await db.query('insert into public.seguidores (user_id, local_id, created_at) values ($1,$2,$3)', [u, l, hace(entero(0, 50))])
    }
  }

  // ── Premium: ~25% de los usuarios
  const premium = usuarios.filter((_, i) => i > 0 && i % 4 === 0)
  for (const u of premium) {
    const desde = hace(entero(1, 50))
    await db.query('update public.profiles set es_premium = true, premium_desde = $2 where id = $1', [u, desde])
    await db.query(`insert into public.suscripciones (user_id, estado, inicio) values ($1, 'activa', $2)`, [u, desde])
    await db.query(`insert into public.events (tipo, user_id, meta, created_at) values ('compra_premium', $1, '{"monto_usd":2}', $2)`, [u, desde])
  }

  // ── Eventos de 60 días (más actividad los fines de semana y en las últimas semanas)
  console.log('Generando eventos…')
  const filas: unknown[][] = []
  for (let d = 60; d >= 0; d--) {
    const fecha = new Date(Date.now() - d * 86400000)
    const finde = [0, 5, 6].includes(fecha.getDay())
    const sesiones = Math.round((40 + (60 - d) * 2.2) * (finde ? 1.4 : 1) * (0.85 + azar() * 0.3))
    for (let s = 0; s < sesiones; s++) {
      const u = azar() < 0.7 ? elegir(usuarios) : null
      const t = new Date(fecha)
      t.setHours(entero(8, 23), entero(0, 59))
      if (t > new Date()) continue
      const local = localPopular()
      const ev = (tipo: string, localId: string | null = local, meta = {}) => filas.push([tipo, u, localId, JSON.stringify(meta), t.toISOString()])
      if (u) ev('sesion', null)
      ev('recomendacion')
      ev('view_local')
      if (azar() < 0.35) ev('click_instagram')
      if (azar() < 0.3) ev('click_como_llegar')
      if (azar() < 0.5) ev('impresion_anuncio', azar() < 0.6 ? 'montecatini' : 'antares')
      if (azar() < 0.06) ev('click_anuncio', azar() < 0.6 ? 'montecatini' : 'antares')
      if (u && azar() < 0.05) ev('reserva', local, { personas: entero(2, 6) })
      if (u && azar() < 0.04) ev('resena')
      if (u && azar() < 0.015) ev('canje')
    }
  }
  for (let i = 0; i < filas.length; i += 500) {
    const lote = filas.slice(i, i + 500)
    const valores = lote.map((_, k) => `($${k * 5 + 1},$${k * 5 + 2},$${k * 5 + 3},$${k * 5 + 4},$${k * 5 + 5})`).join(',')
    await db.query(`insert into public.events (tipo, user_id, local_id, meta, created_at) values ${valores}`, lote.flat())
  }

  // ── Reservas de hoy para el panel de negocios
  for (let i = 0; i < 4; i++) {
    await db.query(
      `insert into public.reservas (local_id, user_id, fecha, hora, personas, codigo, estado) values ('montecatini', $1, (now() at time zone 'America/Argentina/Buenos_Aires')::date, $2, $3, $4, $5)`,
      [premium[i], ['20:30', '21:00', '21:30', '22:00'][i], entero(2, 6), `RES-DEMO${i}`, i === 0 ? 'confirmada' : 'pendiente'],
    )
  }

  const { rows: tot } = await db.query('select (select count(*) from public.events) eventos, (select count(*) from public.resenas) resenas, (select count(*) from public.profiles) perfiles')
  console.log('Listo:', tot[0])
  console.log(`Cuentas demo (contraseña ${PASSWORD}):`, Object.values(DEMO).map((d) => d.email).join(', '))
  await db.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

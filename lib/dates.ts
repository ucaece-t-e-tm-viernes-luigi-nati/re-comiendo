// Fechas en hora de Argentina. Funciones puras: sirven en servidor y navegador.
export const TZ = 'America/Argentina/Buenos_Aires'

/** YYYY-MM-DD de una fecha en hora de Argentina. */
export function dayKeyAR(date: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

function parseKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(key: string, days: number) {
  const date = parseKey(key)
  date.setUTCDate(date.getUTCDate() + days)
  return toKey(date)
}

/** DD/MM/AAAA para un Date, un string ISO o 'YYYY-MM-DD'. */
export function formatDate(value: Date | string | null | undefined) {
  if (!value) return '—'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('es-AR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Montos guardados en centavos: "$ 25.000 ARS" (o "USD 29" para otras monedas). */
export function formatMoney(cents: number | string | null | undefined, currency = 'ARS') {
  const value = Number(cents ?? 0) / 100
  const text = new Intl.NumberFormat('es-AR', { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(value)
  return currency === 'ARS' ? `$ ${text} ARS` : `${currency} ${text}`
}

/** Próxima fecha de vencimiento: el día de pago del mes siguiente al vencimiento anterior. */
export function nextDueAfter(previousDueKey: string, billingDay: number) {
  const [y, m] = previousDueKey.split('-').map(Number)
  const date = new Date(Date.UTC(y, m, Math.min(Math.max(billingDay, 1), 28)))
  return toKey(date)
}

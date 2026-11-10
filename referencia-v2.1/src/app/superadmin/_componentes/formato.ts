// Formateadores de números/fechas en es-AR para el panel de superadmin.

export function numero(n: number) {
  return new Intl.NumberFormat('es-AR').format(n)
}

/** Recibe una fracción (0.5 = 50%), no un número ya multiplicado por 100. */
export function porcentaje(fraccion: number, decimales = 1) {
  return new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: decimales }).format(fraccion)
}

export function usd(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

/** '2024-05-03' → '03/05' */
export function diaCorto(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

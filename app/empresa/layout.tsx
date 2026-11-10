import type { Metadata } from 'next'

// Superficie de los LOCALES (clientes B2B2C). No se linkea desde la parte pública; no se indexa.
export const metadata: Metadata = {
  title: { default: 'Panel del local', template: '%s · Panel del local | ReComiendo' },
  robots: { index: false, follow: false, nocache: true },
}

export default function EmpresaLayout({ children }: LayoutProps<'/empresa'>) {
  return <div className="min-h-svh bg-background">{children}</div>
}

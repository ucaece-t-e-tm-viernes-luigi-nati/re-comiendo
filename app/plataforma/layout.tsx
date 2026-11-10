import type { Metadata } from 'next'

// Superficie del EQUIPO de ReComiendo (superadmin). Sin links desde la parte pública; no se indexa.
export const metadata: Metadata = {
  title: { default: 'Plataforma', template: '%s · Plataforma | ReComiendo' },
  robots: { index: false, follow: false, nocache: true },
}

export default function PlataformaLayout({ children }: LayoutProps<'/plataforma'>) {
  return <div className="min-h-svh bg-background">{children}</div>
}

import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { site } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  title: site.name,
  description: site.tagline,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-AR" className="h-full antialiased" style={{ '--brand': site.color } as CSSProperties}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}

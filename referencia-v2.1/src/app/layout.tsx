import type { Metadata, Viewport } from 'next'
import { DM_Sans, Fraunces } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'] })
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], weight: ['700', '800', '900'] })

export const metadata: Metadata = {
  title: { default: 'ReComiendo', template: '%s · ReComiendo' },
  description: 'Te recomendamos dónde comer o tomar algo en Mar del Plata según tus gustos.',
  icons: { icon: '/logo.png' },
}

export const viewport: Viewport = { themeColor: '#711D24' }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full bg-background">
        {children}
        <Toaster />
      </body>
    </html>
  )
}

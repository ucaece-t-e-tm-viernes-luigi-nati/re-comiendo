import { Suspense } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FormularioIngreso } from './formulario'

export const metadata: Metadata = { title: 'Ingresar', robots: { index: false, follow: false } }

// Ingreso y registro de comensales (la única superficie pública con login).
export default function PaginaIngresar() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bordo px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2 text-crema">
        <Image src="/logo.png" alt="" width={40} height={40} className="rounded-xl" />
        <span className="titulo text-3xl">ReComiendo</span>
      </Link>
      <div className="w-full max-w-sm rounded-3xl bg-crema p-6 shadow-xl">
        <Suspense>
          <FormularioIngreso />
        </Suspense>
      </div>
    </div>
  )
}

import Image from 'next/image'
import Link from 'next/link'

export default function LayoutNegocios({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bordo-osc px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2 text-crema">
        <Image src="/logo.png" alt="" width={40} height={40} className="rounded-xl" />
        <span className="titulo text-3xl leading-tight">
          ReComiendo
          <span className="block text-xs font-normal tracking-wide text-crema/60">para negocios</span>
        </span>
      </Link>
      <div className="w-full max-w-xl rounded-3xl bg-crema p-6 shadow-xl sm:p-8">{children}</div>
    </div>
  )
}

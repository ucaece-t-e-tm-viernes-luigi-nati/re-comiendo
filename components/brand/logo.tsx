import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Logo de ReComiendo para los paneles internos (con un sufijo opcional: "locales", "plataforma"). */
export function Logo({ href = '/', className, suffix }: { href?: string; className?: string; suffix?: string }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2', className)}>
      <Image src="/logo.png" alt="" width={30} height={30} className="rounded-lg" />
      <span className="titulo text-lg text-bordo-osc">ReComiendo</span>
      {suffix && <span className="ml-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{suffix}</span>}
    </Link>
  )
}

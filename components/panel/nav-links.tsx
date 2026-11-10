'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLinks({ links, root }: { links: { href: string; label: string }[]; root: string }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Secciones del panel" className="flex gap-1 overflow-x-auto pb-1">
      {links.map((link) => {
        const active = link.href === root ? pathname === root : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

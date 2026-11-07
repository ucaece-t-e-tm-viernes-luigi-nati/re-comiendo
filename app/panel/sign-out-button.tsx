'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        await signOut()
        router.push('/')
        router.refresh()
      }}
      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
    >
      Cerrar sesión
    </button>
  )
}

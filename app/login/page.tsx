import { Suspense } from 'react'
import { site } from '@/lib/site'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="text-center text-xl font-bold">{site.name}</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}

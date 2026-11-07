'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth-client'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [register, setRegister] = useState(params.get('modo') === 'registro')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    const result = register
      ? await signUp.email({ name: String(form.get('name')), email, password })
      : await signIn.email({ email, password })
    setLoading(false)
    if (result.error) {
      setError(register ? 'No pudimos crear la cuenta. ¿Ya existe ese correo?' : 'Correo o contraseña incorrectos.')
      return
    }
    router.push('/panel')
    router.refresh()
  }

  const input = 'mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2'

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-border p-6">
      <h1 className="text-2xl font-bold">{register ? 'Creá tu cuenta' : 'Ingresá'}</h1>
      {register && (
        <label className="block text-sm font-medium">
          Nombre
          <input name="name" required autoComplete="name" className={input} />
        </label>
      )}
      <label className="block text-sm font-medium">
        Correo electrónico
        <input name="email" type="email" required autoComplete="email" className={input} />
      </label>
      <label className="block text-sm font-medium">
        Contraseña
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={register ? 'new-password' : 'current-password'}
          className={input}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        disabled={loading}
        className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Un momento…' : register ? 'Crear cuenta' : 'Ingresar'}
      </button>
      <button type="button" onClick={() => setRegister(!register)} className="w-full text-sm text-muted underline">
        {register ? 'Ya tengo cuenta' : 'No tengo cuenta, quiero registrarme'}
      </button>
    </form>
  )
}

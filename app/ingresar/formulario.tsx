'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ActionForm, inputClass, labelClass } from '@/components/forms'
import { PasswordInput } from '@/components/password-input'
import { ingresarComensal, registrarComensal } from './actions'

const submitClass = 'w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60'

/** Login / registro de comensales. Sin selector de rol: los locales y el equipo tienen su propio ingreso. */
export function FormularioIngreso() {
  const params = useSearchParams()
  const [registro, setRegistro] = useState(params.get('modo') === 'registro')
  const volver = params.get('volver') ?? ''

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="titulo text-2xl text-bordo">{registro ? 'Creá tu cuenta' : 'Entrá a tu cuenta'}</h1>
        <p className="text-sm text-muted-foreground">
          {registro ? 'Basta de perder media hora eligiendo dónde comer.' : 'Y descubrí dónde comer hoy.'}
        </p>
      </div>

      {registro ? (
        <ActionForm action={registrarComensal} submitLabel="Crear cuenta" pendingLabel="Creando…" className="flex flex-col gap-4" submitClassName={submitClass}>
          <label className={labelClass}>
            ¿Cómo te llamás?
            <input name="nombre" required maxLength={40} autoComplete="given-name" className={inputClass} />
          </label>
          <label className={labelClass}>
            Email
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <label className={labelClass}>
            Contraseña
            <PasswordInput name="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          </label>
          <p className="text-xs text-muted-foreground">Mínimo 8 caracteres. Con tu cuenta guardás favoritos, tus gustos y tus reseñas.</p>
        </ActionForm>
      ) : (
        <ActionForm action={ingresarComensal} submitLabel="Entrar" pendingLabel="Entrando…" className="flex flex-col gap-4" submitClassName={submitClass}>
          <input type="hidden" name="volver" value={volver} />
          <label className={labelClass}>
            Email
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <label className={labelClass}>
            Contraseña
            <PasswordInput name="password" required autoComplete="current-password" className={inputClass} />
          </label>
        </ActionForm>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {registro ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
        <button type="button" onClick={() => setRegistro(!registro)} className="font-bold text-bordo">
          {registro ? 'Entrá' : 'Registrate'}
        </button>
      </p>
    </div>
  )
}

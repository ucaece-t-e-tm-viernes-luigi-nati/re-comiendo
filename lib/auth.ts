import 'server-only'
import { cache } from 'react'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { headers } from 'next/headers'
import { pool } from './db'
import { isSuperadminEmail } from './env'
import { registrarSesion } from './services/eventos'

const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter(Boolean)
  .map((host) => `https://${host}`)
const extraOrigins = [process.env.APP_URL].filter((value): value is string => !!value)

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? (productionUrl ? `https://${productionUrl}` : 'http://localhost:3000'),
  trustedOrigins: ['http://localhost:3000', ...vercelOrigins, ...extraOrigins],
  emailAndPassword: { enabled: true, autoSignIn: true, minPasswordLength: 8 },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  user: {
    additionalFields: {
      // input:false → nadie puede setearlos desde el registro público.
      role: { type: 'string', defaultValue: 'member', input: false },
      mustChangePassword: { type: 'boolean', defaultValue: false, input: false },
      tempPasswordExpiresAt: { type: 'date', required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // El registro público nunca crea superadmins: los emails de SUPERADMIN_EMAILS solo
        // pueden crear su cuenta por el "primer ingreso" de la plataforma (verificado por mail).
        before: async (user) => {
          if (isSuperadminEmail(user.email)) return false
          return { data: { ...user, role: 'member' } }
        },
      },
    },
    session: {
      create: {
        // Cada ingreso de un comensal suma al dashboard de actividad (tabla events, tipo 'sesion').
        after: async (session) => {
          await registrarSesion(session.userId)
        },
      },
    },
  },
  plugins: [nextCookies()],
})

export type SessionUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  role: string
  mustChangePassword: boolean
  tempPasswordExpiresAt: Date | null
}

/** Usuario logueado o null (una vez por request). En páginas, llamalo dentro de <Suspense> o en un layout con instant=false. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const result = await auth.api.getSession({ headers: await headers() })
  if (!result?.user) return null
  const u = result.user as typeof result.user & Partial<SessionUser>
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: !!u.emailVerified,
    role: u.role ?? 'member',
    mustChangePassword: !!u.mustChangePassword,
    tempPasswordExpiresAt: u.tempPasswordExpiresAt ? new Date(u.tempPasswordExpiresAt) : null,
  }
})

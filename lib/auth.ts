import 'server-only'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { headers } from 'next/headers'
import { pool } from './db'

const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter(Boolean)
  .map((host) => `https://${host}`)

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? (productionUrl ? `https://${productionUrl}` : 'http://localhost:3000'),
  trustedOrigins: ['http://localhost:3000', ...vercelOrigins],
  emailAndPassword: { enabled: true, autoSignIn: true, minPasswordLength: 8 },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  plugins: [nextCookies()],
})

/** Usuario logueado o null. Usalo en un Server Component que esté dentro de <Suspense>. */
export async function getCurrentUser() {
  const result = await auth.api.getSession({ headers: await headers() })
  return result?.user ?? null
}

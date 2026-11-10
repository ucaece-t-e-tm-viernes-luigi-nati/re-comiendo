// Matriz de permisos de ReComiendo. ÚNICO lugar donde se define quién puede qué.
// Se chequea SIEMPRE en el servidor (lib/guards.ts), en páginas, server actions y route handlers.

export type PlatformRole = 'superadmin' | 'admin' | 'member'
export type LocalRole = 'owner' | 'staff'

// ---------- Superficie de empresas: locales gastronómicos (/empresa) ----------
export type LocalPermission =
  | 'dashboard.view' // ver el resumen y las métricas del local
  | 'posts.manage' // publicar y borrar novedades, menú y promos
  | 'reservations.manage' // ver reservas, cambiar su estado y validar códigos
  | 'reviews.reply' // ver y responder reseñas
  | 'local.edit' // editar la ficha del local (datos, fotos, horarios, ubicación)
  | 'sponsorship.manage' // contratar espacios patrocinados
  | 'team.view' // ver el equipo
  | 'team.manage' // invitar / quitar miembros
  | 'billing.view' // ver plan y pagos

export const LOCAL_PERMISSIONS: Record<LocalRole, readonly LocalPermission[]> = {
  owner: ['dashboard.view', 'posts.manage', 'reservations.manage', 'reviews.reply', 'local.edit', 'sponsorship.manage', 'team.view', 'team.manage', 'billing.view'],
  staff: ['dashboard.view', 'posts.manage', 'reservations.manage', 'reviews.reply', 'team.view'],
}

export const LOCAL_ROLE_LABELS: Record<LocalRole, { name: string; description: string }> = {
  owner: { name: 'Propietario', description: 'Control total del local: ficha, fotos, publicaciones, patrocinio, equipo y plan.' },
  staff: { name: 'Staff', description: 'Publica novedades y promos, gestiona reservas y responde reseñas.' },
}

export const PERMISSION_LABELS: Record<LocalPermission, string> = {
  'dashboard.view': 'Ver el resumen y las métricas',
  'posts.manage': 'Publicar novedades, menú y promos',
  'reservations.manage': 'Gestionar reservas y validar códigos',
  'reviews.reply': 'Responder reseñas',
  'local.edit': 'Editar la ficha del local',
  'sponsorship.manage': 'Contratar espacios patrocinados',
  'team.view': 'Ver el equipo',
  'team.manage': 'Invitar y quitar miembros del equipo',
  'billing.view': 'Ver plan y pagos',
}

export function localCan(role: LocalRole | null | undefined, permission: LocalPermission) {
  return !!role && LOCAL_PERMISSIONS[role].includes(permission)
}

/** Estados del cliente en los que el panel queda en solo-lectura y el local se oculta al público. */
export const READ_ONLY_STATUSES = ['paused', 'cancelled'] as const
export const PUBLIC_VISIBLE_STATUSES = ['trial', 'active', 'past_due'] as const

export function isReadOnlyStatus(status: string) {
  return (READ_ONLY_STATUSES as readonly string[]).includes(status)
}

// ---------- Superficie del equipo (/plataforma) ----------
// Dos niveles, con las MISMAS funciones en /plataforma:
// - superadmin principal: rol 'superadmin' + email en SUPERADMIN_EMAILS (env). Nadie lo puede quitar desde el panel.
// - admin del equipo: rol 'admin', creado desde /plataforma/equipo por otro superadmin o admin. Se puede quitar.
type PlatformUser = { role: string; email: string; emailVerified: boolean } | null

/** Superadmin principal: rol en la base + email en SUPERADMIN_EMAILS + email verificado. Las tres cosas. */
export function isRootSuperadmin(user: PlatformUser, allowedEmails: string[]) {
  return !!user && user.role === 'superadmin' && user.emailVerified && allowedEmails.includes(user.email.toLowerCase())
}

/** Acceso a /plataforma: superadmin principal o admin del equipo con email verificado. */
export function isSuperadmin(user: PlatformUser, allowedEmails: string[]) {
  return isRootSuperadmin(user, allowedEmails) || (!!user && user.role === 'admin' && user.emailVerified)
}

export const PLATFORM_ROLES = ['superadmin', 'admin'] as const

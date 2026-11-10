// Datos públicos de la marca. Nada secreto acá: este archivo se usa también en el navegador.
export const site = {
  name: 'ReComiendo',
  city: 'Mar del Plata',
  tagline: 'Te recomendamos dónde comer o tomar algo en Mar del Plata según tus gustos.',
  course: 'Taller Emprendedor · UCAECE · comisión viernes · 2026 2C',
}

/** CTA comercial para locales en la landing (marketing). No lleva a ningún panel: abre un mail o WhatsApp. */
export function contactHref(subject = 'Quiero sumar mi local a ReComiendo') {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL
  if (email) return `mailto:${email}?subject=${encodeURIComponent(subject)}`
  const phone = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || '5492230000000'
  return `https://wa.me/${phone}?text=${encodeURIComponent(subject)}`
}

'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Crown, Mic, Send, Sparkles, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EMOJI_CATEGORIA, type Categoria } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { accionConsultarRefi } from '../acciones'

type Opcion = { id: string; nombre: string; categoria: string; barrio: string; motivo: string; match: number }
type Mensaje = { de: 'yo' | 'refi'; texto?: string; audio?: string; opciones?: Opcion[] }

const EJEMPLOS = ['Algo rico y barato para almorzar', 'Una birra con amigos al aire libre', 'Cena romántica con vista al mar']

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Chat con Refi (maqueta): texto o audio; plan gratis = 1 consulta por semana. */
export function ChatRefi({ nombre, premium, disponible, proxima }: { nombre: string; premium: boolean; disponible: boolean; proxima: string | null }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { de: 'refi', texto: `¡Hola, ${nombre}! Soy Refi 👋 Contame cómo estás, con quién vas y qué tenés ganas de comer hoy, por texto o audio, y te digo a dónde ir.` },
  ])
  const [texto, setTexto] = useState('')
  const [bloqueado, setBloqueado] = useState(!disponible)
  const [vuelve, setVuelve] = useState(proxima)
  const [grabando, setGrabando] = useState(false)
  const [pendiente, empezar] = useTransition()
  const grabador = useRef<MediaRecorder | null>(null)
  const fin = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, pendiente])

  const enviar = (tipo: 'texto' | 'audio', contenido: string, audio?: string) => {
    setMensajes((m) => [...m, { de: 'yo', texto: tipo === 'texto' ? contenido : undefined, audio }])
    setTexto('')
    empezar(async () => {
      const r = await accionConsultarRefi({ tipo, texto: contenido })
      if ('error' in r) {
        setMensajes((m) => [...m, { de: 'refi', texto: r.error }])
        return
      }
      if (r.limite) {
        setBloqueado(true)
        setVuelve(r.proxima)
        return
      }
      setMensajes((m) => [...m, { de: 'refi', texto: r.mensaje, opciones: r.opciones }])
      if (!premium) {
        setBloqueado(true)
        setVuelve(r.proxima)
      }
    })
  }

  const alternarGrabacion = async () => {
    if (grabando) {
      grabador.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      const partes: Blob[] = []
      rec.ondataavailable = (e) => partes.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setGrabando(false)
        enviar('audio', '', URL.createObjectURL(new Blob(partes, { type: rec.mimeType })))
      }
      grabador.current = rec
      rec.start()
      setGrabando(true)
    } catch {
      setMensajes((m) => [...m, { de: 'refi', texto: 'No pude usar el micrófono. Revisá los permisos del navegador o escribime.' }])
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-bordo text-durazno">
          <Sparkles className="size-5" />
        </span>
        <div className="flex-1">
          <h1 className="titulo text-3xl leading-none text-bordo">Refi</h1>
          <p className="text-xs text-muted-foreground">Tu asistente con IA para decidir dónde comer · demo</p>
        </div>
        {premium ? (
          <span className="flex items-center gap-1 rounded-full bg-durazno px-3 py-1 text-xs font-bold text-bordo-osc">
            <Crown className="size-3.5" /> Ilimitado
          </span>
        ) : (
          <span className="rounded-full bg-suave px-3 py-1 text-xs font-medium text-bordo-osc">Gratis: 1 por semana</span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {mensajes.map((m, i) => (
          <div key={i} className={cn('flex flex-col gap-2', m.de === 'yo' ? 'items-end' : 'items-start')}>
            {(m.texto || m.audio) && (
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-2.5 text-sm', m.de === 'yo' ? 'rounded-br-sm bg-bordo text-crema' : 'rounded-bl-sm bg-card ring-1 ring-foreground/5')}>
                {m.audio ? <audio src={m.audio} controls className="h-9 max-w-full" /> : m.texto}
              </div>
            )}
            {m.opciones?.map((o) => (
              <Link
                key={o.id}
                href={`/local/${o.id}`}
                className="flex w-[85%] items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-foreground/5 transition hover:ring-bordo/40"
              >
                <span className="text-2xl">{EMOJI_CATEGORIA[o.categoria as Categoria]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-bordo-osc">{o.nombre}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {o.barrio} · {o.motivo}
                  </span>
                </span>
                <span className="rounded-full bg-rosa-claro px-2 py-0.5 text-xs font-bold text-bordo">{o.match}%</span>
              </Link>
            ))}
            {m.opciones && m.opciones.length === 0 && (
              <p className="text-sm text-muted-foreground">No encontré lugares que encajen. Probá contarme otra cosa.</p>
            )}
          </div>
        ))}
        {pendiente && <p className="animate-pulse text-sm text-muted-foreground">Refi está pensando…</p>}
        <div ref={fin} />
      </div>

      {bloqueado && !premium ? (
        <div className="flex flex-col gap-3 rounded-3xl bg-bordo p-5 text-crema">
          <p className="titulo text-xl">Ya usaste tu consulta gratis de esta semana</p>
          <p className="text-sm text-crema/80">
            {vuelve ? `Vas a poder volver a preguntarle a Refi el ${fecha(vuelve)}.` : 'La semana que viene podés volver a preguntarle.'} Con Premium
            tenés uso ilimitado de Refi.
          </p>
          <Button asChild className="bg-durazno text-bordo-osc hover:bg-durazno/90">
            <Link href="/premium?volver=/refi">
              <Crown /> Pasate a Premium
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {mensajes.length === 1 && (
            <div className="flex flex-wrap gap-2">
              {EJEMPLOS.map((e) => (
                <button key={e} type="button" onClick={() => setTexto(e)} className="rounded-full bg-suave px-3 py-1.5 text-xs text-bordo-osc hover:bg-rosa-claro">
                  {e}
                </button>
              ))}
            </div>
          )}
          <form
            className="sticky bottom-20 flex items-end gap-2 rounded-3xl bg-card p-2 shadow-lg ring-1 ring-foreground/5 md:bottom-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (texto.trim()) enviar('texto', texto.trim())
            }}
          >
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (texto.trim()) enviar('texto', texto.trim())
                }
              }}
              placeholder={grabando ? 'Grabando… tocá el cuadrado para enviar' : 'Ej: estoy cansada, quiero algo calentito y barato'}
              rows={1}
              maxLength={600}
              disabled={pendiente || grabando}
              className="min-h-10 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              size="icon"
              variant={grabando ? 'destructive' : 'ghost'}
              onClick={alternarGrabacion}
              disabled={pendiente}
              aria-label={grabando ? 'Terminar audio' : 'Grabar audio'}
            >
              {grabando ? <Square /> : <Mic />}
            </Button>
            <Button type="submit" size="icon" disabled={pendiente || grabando || !texto.trim()} aria-label="Enviar">
              <Send />
            </Button>
          </form>
        </>
      )}
    </div>
  )
}

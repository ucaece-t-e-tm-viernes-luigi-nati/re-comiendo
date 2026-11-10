'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Estrellas } from '@/components/comunes/estrellas'
import type { Resena } from '@/lib/tipos'
import { accionResponderResena } from '../acciones'
import { mensaje, ok } from '../_componentes/resultado'

function FilaResena({ resena }: { resena: Resena }) {
  const [editando, setEditando] = useState(!resena.respuesta)
  const [respuesta, setRespuesta] = useState(resena.respuesta ?? '')
  const [pendiente, iniciar] = useTransition()

  function guardar() {
    const r = respuesta.trim()
    if (!r) return
    iniciar(async () => {
      try {
        ok(await accionResponderResena(resena.id, r))
        toast.success('Respuesta guardada')
        setEditando(false)
      } catch (e) {
        toast.error(mensaje(e, 'No pudimos guardar la respuesta'))
      }
    })
  }

  return (
    <div className="space-y-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-bold">{resena.autor}</p>
          <Estrellas valor={resena.estrellas} />
        </div>
        <span className="text-xs text-muted-foreground">{new Date(resena.created_at).toLocaleDateString('es-AR')}</span>
      </div>
      {resena.texto && <p className="text-sm">{resena.texto}</p>}
      {resena.foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resena.foto} alt="" className="h-28 w-28 rounded-lg object-cover" />
      )}
      {!editando && resena.respuesta ? (
        <div className="rounded-lg bg-suave p-3 text-sm">
          <p className="mb-1 text-xs font-bold text-bordo">Tu respuesta</p>
          <p>{resena.respuesta}</p>
          <Button variant="link" size="sm" className="h-auto p-0 text-bordo" onClick={() => setEditando(true)}>
            Editar respuesta
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Escribí una respuesta…" rows={2} />
          <div className="flex justify-end gap-2">
            {resena.respuesta && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditando(false)
                  setRespuesta(resena.respuesta ?? '')
                }}
              >
                Cancelar
              </Button>
            )}
            <Button size="sm" disabled={pendiente} onClick={guardar} className="bg-bordo text-crema hover:bg-bordo/90">
              {pendiente ? 'Guardando…' : 'Responder'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ListaResenas({ resenas }: { resenas: Resena[] }) {
  if (!resenas.length) {
    return <p className="text-sm text-muted-foreground">Todavía no tenés reseñas.</p>
  }
  return (
    <div className="space-y-3">
      {resenas.map((r) => (
        <FilaResena key={r.id} resena={r} />
      ))}
    </div>
  )
}

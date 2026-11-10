'use client'

export default function ErrorGlobal({ error, retry }: { error: unknown; retry: () => void }) {
  const mensaje = error instanceof Error ? error.message : String(error)
  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui', background: '#fdf8f0', color: '#2b1215', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: 24, maxWidth: 420 }}>
          <h1 style={{ color: '#711d24' }}>Algo salió mal</h1>
          <p>Probá de nuevo. Si sigue pasando, mandanos este detalle:</p>
          <code style={{ display: 'block', background: '#f3e8e2', padding: 8, borderRadius: 8, fontSize: 12, overflowX: 'auto' }}>{mensaje}</code>
          <button onClick={() => retry()} style={{ marginTop: 16, background: '#711d24', color: '#fdf8f0', border: 0, borderRadius: 10, padding: '10px 18px', cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}

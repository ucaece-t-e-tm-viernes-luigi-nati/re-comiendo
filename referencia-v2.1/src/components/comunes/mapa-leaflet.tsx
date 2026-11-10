'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { Categoria } from '@/lib/tipos'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA } from '@/lib/tipos'

export interface PuntoMapa {
  id: string
  nombre: string
  categoria: Categoria
  lat: number
  lng: number
  barrio: string
  foto?: string
  rating?: number
  patrocinado?: boolean
}

const CENTRO_MDP: [number, number] = [-38.0055, -57.5426]

function icono(p: PuntoMapa) {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:${p.patrocinado ? '#f2a97e' : '#711d24'};border:2px solid #fdf8f0;box-shadow:0 2px 6px rgba(0,0,0,.3);font-size:17px">${EMOJI_CATEGORIA[p.categoria]}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  })
}

const ICONO_YO = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 6px rgba(37,99,235,.25)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function Encuadre({ puntos, yo }: { puntos: PuntoMapa[]; yo?: { lat: number; lng: number } | null }) {
  const map = useMap()
  useEffect(() => {
    const coords: [number, number][] = puntos.map((p) => [p.lat, p.lng])
    if (yo) coords.push([yo.lat, yo.lng])
    if (coords.length === 1) map.setView(coords[0], 15)
    else if (coords.length > 1) map.fitBounds(coords, { padding: [30, 30], maxZoom: 15 })
  }, [map, puntos, yo])
  return null
}

export default function MapaLeaflet({
  puntos,
  yo,
  className,
  conPopup = true,
}: {
  puntos: PuntoMapa[]
  yo?: { lat: number; lng: number } | null
  className?: string
  conPopup?: boolean
}) {
  return (
    <MapContainer center={CENTRO_MDP} zoom={13} scrollWheelZoom className={className} style={{ zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Encuadre puntos={puntos} yo={yo} />
      {yo && <Marker position={[yo.lat, yo.lng]} icon={ICONO_YO} />}
      {puntos.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={icono(p)}>
          {conPopup && (
            <Popup>
              <div className="flex w-48 flex-col gap-1">
                {p.foto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.foto} alt="" className="h-24 w-full rounded-lg object-cover" />
                )}
                <strong className="text-sm">{p.nombre}</strong>
                <span className="text-xs text-gray-600">
                  {NOMBRE_CATEGORIA[p.categoria]} · {p.barrio}
                  {p.rating ? ` · ★ ${p.rating.toFixed(1)}` : ''}
                </span>
                {p.patrocinado && <span className="text-xs font-bold text-orange-700">Patrocinado</span>}
                <Link href={`/local/${p.id}`} className="text-xs font-bold" style={{ color: '#711d24' }}>
                  Ver el lugar →
                </Link>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  )
}

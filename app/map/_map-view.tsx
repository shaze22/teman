'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Star, Loader2, MapPin, Navigation } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default marker icons broken by webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

type Provider = {
  id: string
  lat: number
  lng: number
  fullName: string
  avatarUrl: string | null
  locationCity: string
  locationState: string
  ratingAvg: number
  totalReviews: number
  minPrice: number | null
}

const MY_CENTER: [number, number] = [3.139, 101.687]

function makeIcon(color = '#6366F1') {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  })
}

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [selected, setSelected] = useState<Provider | null>(null)

  useEffect(() => {
    fetch('/api/providers/map')
      .then(r => r.ok ? r.json() : [])
      .then(setProviders)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: MY_CENTER,
      zoom: 11,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Add provider markers whenever providers or map changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || providers.length === 0) return

    const markers: L.Marker[] = []

    providers.forEach(p => {
      const marker = L.marker([p.lat, p.lng], { icon: makeIcon('#6366F1') })
        .addTo(map)
        .on('click', () => {
          setSelected(p)
          map.panTo([p.lat, p.lng], { animate: true })
        })
      markers.push(marker)
    })

    if (providers.length > 0) {
      const group = L.featureGroup(markers)
      map.fitBounds(group.getBounds().pad(0.1), { maxZoom: 10 })
    }

    return () => markers.forEach(m => m.remove())
  }, [providers])

  // Add user location marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !userPos) return
    const m = L.marker(userPos, { icon: makeIcon('#F43F5E') }).addTo(map)
    m.bindPopup('<b>Lokasi Anda</b>').openPopup()
    return () => { m.remove() }
  }, [userPos])

  function locateMe() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
      setUserPos(coords)
      mapRef.current?.flyTo(coords, 13, { animate: true, duration: 1.5 })
    })
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80">
          <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
        </div>
      )}

      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Locate me button */}
      <button
        onClick={locateMe}
        className="absolute bottom-6 right-4 z-10 bg-white border border-gray-200 shadow-md p-3 rounded-xl hover:bg-gray-50 transition-colors"
        title="Lokasi saya"
      >
        <Navigation className="w-5 h-5 text-[#6366F1]" />
      </button>

      {/* Provider count */}
      {!loading && (
        <div className="absolute top-4 left-4 z-10 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-600">
          <MapPin className="w-3.5 h-3.5 inline mr-1 text-[#6366F1]" />
          {providers.length} Teman di peta
        </div>
      )}

      {/* Selected provider card */}
      {selected && (
        <div className="absolute bottom-6 left-4 right-16 z-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
          <div className="flex items-center gap-3 mb-3 pr-6">
            <div className="w-11 h-11 rounded-full bg-[#6366F1] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
              {selected.fullName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{selected.fullName}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {selected.locationCity}, {selected.locationState}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
              <span className="text-sm font-semibold text-gray-900">
                {selected.ratingAvg > 0 ? selected.ratingAvg.toFixed(1) : 'Baru'}
              </span>
              {selected.totalReviews > 0 && (
                <span className="text-xs text-gray-400">({selected.totalReviews})</span>
              )}
            </div>
            {selected.minPrice !== null && (
              <span className="text-sm font-bold text-[#6366F1]">
                dari RM{selected.minPrice.toFixed(0)}/jam
              </span>
            )}
          </div>
          <Link
            href={`/carer/${selected.id}`}
            className="block w-full text-center bg-[#6366F1] text-white font-semibold py-2.5 rounded-xl hover:bg-[#4F46E5] transition-colors text-sm"
          >
            Lihat Profil & Book
          </Link>
        </div>
      )}
    </div>
  )
}

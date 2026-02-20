// LocationPickerMap.tsx
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LocationPickerMapProps {
  initialLat: number
  initialLng: number
  onLocationSelect: (lat: number, lng: number, address: string) => void
}

export default function LocationPickerMap({ initialLat, initialLng, onLocationSelect }: LocationPickerMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map
    mapRef.current = L.map(mapContainer.current).setView([initialLat, initialLng], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current)

    // Add marker
    markerRef.current = L.marker([initialLat, initialLng], {
      draggable: true
    }).addTo(mapRef.current)

    // Handle marker drag
    markerRef.current.on('dragend', async () => {
      const position = markerRef.current?.getLatLng()
      if (position) {
        // Reverse geocode to get address
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`
        )
        const data = await response.json()
        onLocationSelect(position.lat, position.lng, data.display_name)
      }
    })

    // Handle map click
    mapRef.current.on('click', async (e) => {
      const { lat, lng } = e.latlng
      markerRef.current?.setLatLng([lat, lng])
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      const data = await response.json()
      onLocationSelect(lat, lng, data.display_name)
    })

    return () => {
      mapRef.current?.remove()
    }
  }, [])

  return <div ref={mapContainer} className="h-[300px] w-full rounded-lg" />
}
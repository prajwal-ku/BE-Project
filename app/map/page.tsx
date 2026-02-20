'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapPage() {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // If map is already initialized, do nothing
    if (mapRef.current || !mapContainerRef.current) return

    const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
  }, [])

  // Zoom in/out
  const zoomIn = () => mapRef.current?.zoomIn()
  const zoomOut = () => mapRef.current?.zoomOut()

  // Geolocate
  const geolocate = () => {
    if (!navigator.geolocation || !mapRef.current) return
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 14)
    })
  }

  // Fit bounds
  const zoomToWorld = () => mapRef.current?.fitBounds([[-90, -180], [90, 180]])
  const zoomToIndia = () => mapRef.current?.fitBounds([[6.5, 68.0], [35.5, 97.5]])
  const zoomToMaharashtra = () => mapRef.current?.fitBounds([[15.6, 72.6], [22.0, 80.9]])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
        <button onClick={zoomIn} style={{ margin: 4, padding: '6px 12px' }}>Zoom +</button>
        <button onClick={zoomOut} style={{ margin: 4, padding: '6px 12px' }}>Zoom -</button>
        <button onClick={geolocate} style={{ margin: 4, padding: '6px 12px' }}>My Location</button>
        <button onClick={zoomToWorld} style={{ margin: 4, padding: '6px 12px' }}>World</button>
        <button onClick={zoomToIndia} style={{ margin: 4, padding: '6px 12px' }}>India</button>
        <button onClick={zoomToMaharashtra} style={{ margin: 4, padding: '6px 12px' }}>Maharashtra</button>
      </div>
    </div>
  )
}

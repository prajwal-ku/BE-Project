"use client"

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  iconUrl: '/leaflet/images/marker-icon.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
})

interface LeafletMapProps {
  markers?: Array<{
    id: number, 
    lat: number, 
    lng: number, 
    name: string,
    type: 'retailer' | 'warehouse' | 'delivery',
    status: 'active' | 'pending' | 'completed'
  }>
  selectedMarker?: any
  onMarkerSelect?: (marker: any) => void
}

export default function LeafletMap({ markers = [], onMarkerSelect }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return

    try {
      // Initialize map
      const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5)
      leafletMapRef.current = map

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Create custom markers
      const deliveryLocations = markers.length > 0 ? markers : [
        { id: 1, name: "Mumbai Retail Hub", lat: 19.0760, lng: 72.8777, type: 'retailer' as const, status: 'active' as const },
        { id: 2, name: "Pune Distribution", lat: 18.5204, lng: 73.8567, type: 'retailer' as const, status: 'active' as const },
        { id: 3, name: "Bangalore Center", lat: 12.9716, lng: 77.5946, type: 'retailer' as const, status: 'active' as const },
        { id: 4, name: "Hyderabad Outlet", lat: 17.3850, lng: 78.4867, type: 'retailer' as const, status: 'pending' as const },
        { id: 5, name: "Chennai Market", lat: 13.0827, lng: 80.2707, type: 'retailer' as const, status: 'active' as const },
        { id: 6, name: "Main Warehouse", lat: 19.2183, lng: 72.9781, type: 'warehouse' as const, status: 'active' as const },
        { id: 7, name: "South Storage", lat: 13.3600, lng: 77.6400, type: 'warehouse' as const, status: 'active' as const },
        { id: 8, name: "Delivery Point 1", lat: 19.0884, lng: 72.8313, type: 'delivery' as const, status: 'completed' as const },
        { id: 9, name: "Delivery Point 2", lat: 18.6266, lng: 73.7980, type: 'delivery' as const, status: 'active' as const },
        { id: 10, name: "Delivery Point 3", lat: 13.0245, lng: 77.6190, type: 'delivery' as const, status: 'pending' as const },
      ]

      // Create custom icons
      const createCustomIcon = (type: string, status: string) => {
        let color = '#3B82F6' // Default blue
        if (type === 'retailer') {
          color = status === 'active' ? '#10B981' : '#F59E0B'
        } else if (type === 'warehouse') {
          color = '#8B5CF6'
        } else if (type === 'delivery') {
          color = status === 'completed' ? '#6B7280' : '#EF4444'
        }

        return L.divIcon({
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background: ${color};
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">
              <div style="
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          className: 'custom-leaflet-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        })
      }

      // Add markers to map
      deliveryLocations.forEach(location => {
        const icon = createCustomIcon(location.type, location.status)
        const marker = L.marker([location.lat, location.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="padding: 10px; min-width: 200px;">
              <h3 style="margin: 0 0 5px 0; color: #1E40AF; font-weight: 600;">${location.name}</h3>
              <div style="font-size: 12px; color: #6B7280; margin-bottom: 10px;">
                ${location.type === 'retailer' ? 'Retail Outlet' : 
                  location.type === 'warehouse' ? 'Warehouse' : 'Delivery Point'}
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                <div style="background: #EFF6FF; padding: 5px; border-radius: 4px;">
                  <div style="color: #3B82F6; font-weight: 600;">Status</div>
                  <div>${location.status.toUpperCase()}</div>
                </div>
                <div style="background: #F0F9FF; padding: 5px; border-radius: 4px;">
                  <div style="color: #0EA5E9; font-weight: 600;">Location</div>
                  <div>${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</div>
                </div>
              </div>
            </div>
          `)
        
        marker.on('click', () => {
          if (onMarkerSelect) {
            onMarkerSelect(location)
          }
        })
      })

      // Draw delivery routes
      const routes = [
        {
          name: "Western Corridor",
          path: [
            [19.0760, 72.8777], // Mumbai
            [19.2183, 72.9781], // Main Warehouse
            [18.5204, 73.8567], // Pune
            [18.6266, 73.7980]  // Delivery Point 2
          ],
          color: '#3B82F6'
        },
        {
          name: "Southern Network",
          path: [
            [12.9716, 77.5946], // Bangalore
            [13.3600, 77.6400], // South Storage
            [13.0245, 77.6190], // Delivery Point 3
            [13.0827, 80.2707]  // Chennai
          ],
          color: '#10B981'
        }
      ]

      routes.forEach(route => {
        const polyline = L.polyline(route.path as [number, number][], {
          color: route.color,
          weight: 3,
          opacity: 0.7,
          dashArray: route.name === 'Southern Network' ? '10, 10' : undefined
        }).addTo(map)
        
        // Add route label
        const midPoint = route.path[Math.floor(route.path.length / 2)]
        L.marker([midPoint[0], midPoint[1]], {
          icon: L.divIcon({
            html: `
              <div style="
                background: ${route.color};
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              ">
                ${route.name}
              </div>
            `,
            className: 'route-label',
            iconSize: [100, 30],
            iconAnchor: [50, 15]
          })
        }).addTo(map)
      })

      // Add scale control
      L.control.scale({ imperial: false }).addTo(map)

    } catch (error) {
      console.error('Error initializing Leaflet map:', error)
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  return (
    <div 
      ref={mapContainerRef}
      className="h-[500px] rounded-lg border border-gray-700 overflow-hidden relative"
    />
  )
}
import React, { useState, useEffect } from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { MapPin, Search } from "lucide-react"
import { useDebounce } from "@/hooks/use_debounce"

const defaultCenter = {
  lat: -33.4489,
  lng: -70.6693
}

const getGoogleMapsApiKey = () => {
  const meta = document.querySelector('meta[name="google-maps-api-key"]')
  return meta ? meta.content : ''
}

export function MapPicker({
  value,
  onChange,
  className,
  mapHeight = 320,
  searchPlaceholder = "Busca una direccion o haz click en el mapa",
}) {
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [center, setCenter] = useState(defaultCenter)
  const [apiKey] = useState(getGoogleMapsApiKey())
  const debouncedSearch = useDebounce(searchQuery, 500)
  const containerStyle = {
    width: '100%',
    height: `${mapHeight}px`
  }

  useEffect(() => {
    if (value?.lat && value?.lng) {
      setCenter({ lat: parseFloat(value.lat), lng: parseFloat(value.lng) })
      setMarker({ lat: parseFloat(value.lat), lng: parseFloat(value.lng) })
    }
  }, [value])

  useEffect(() => {
    if (value?.address) {
      setSearchQuery((current) => current === value.address ? current : value.address)
    }
  }, [value?.address])

  useEffect(() => {
    if (debouncedSearch && window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ address: debouncedSearch }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const { lat, lng } = results[0].geometry.location
          const newPosition = { 
            lat: lat(), 
            lng: lng(),
            address: results[0].formatted_address 
          }
          setCenter(newPosition)
          setMarker(newPosition)
          onChange(newPosition)
          map?.panTo(newPosition)
        }
      })
    }
  }, [debouncedSearch, map, onChange])

  const onMapClick = (e) => {
    if (!window.google?.maps) return

    const newPosition = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    }
    setMarker(newPosition)
    
    // Get address from coordinates
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: newPosition }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address
        onChange({ ...newPosition, address })
      }
    })
  }

  if (!apiKey) {
    return (
      <div className={cn("rounded-xl border border-dashed bg-muted/40 p-4", className)}>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-background p-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              El mapa no esta disponible ahora
            </p>
            <p className="text-sm text-muted-foreground">
              Puedes seguir editando el texto de ubicacion manualmente y guardar el evento sin coordenadas.
            </p>
          </div>
        </div>
      </div>
    )
  }


  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <div className={cn("space-y-4", className)}>
        <div className="relative">
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        <div className="overflow-hidden rounded-xl border border-border">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
            onClick={onMapClick}
            onLoad={setMap}
          >
            {marker && <Marker position={marker} />}
          </GoogleMap>
        </div>
      </div>
    </LoadScript>
  )
}

import React, { useEffect, useRef, useState } from 'react'
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
  const onChangeRef = useRef(onChange)
  const skipNextGeocodeRef = useRef(false)
  const inFlightGeocodeQueryRef = useRef(null)
  const lastResolvedGeocodeQueryRef = useRef('')
  const debouncedSearch = useDebounce(searchQuery, 500)
  const containerStyle = {
    width: '100%',
    height: `${mapHeight}px`
  }

  const geocodeAddress = React.useCallback((rawQuery) => {
    const query = rawQuery.trim()

    if (!query || !window.google?.maps) return
    if (inFlightGeocodeQueryRef.current === query) return
    if (lastResolvedGeocodeQueryRef.current === query) return

    inFlightGeocodeQueryRef.current = query

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: query }, (results, status) => {
      if (inFlightGeocodeQueryRef.current === query) {
        inFlightGeocodeQueryRef.current = null
      }

      if (status === 'OK' && results[0]) {
        const { lat, lng } = results[0].geometry.location
        const newPosition = {
          lat: lat(),
          lng: lng(),
          address: results[0].formatted_address
        }

        lastResolvedGeocodeQueryRef.current = query
        setCenter(newPosition)
        setMarker(newPosition)
        onChangeRef.current(newPosition)
        map?.panTo(newPosition)
      }
    })
  }, [map])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!value?.lat || !value?.lng) return

    const nextLat = parseFloat(value.lat)
    const nextLng = parseFloat(value.lng)

    if (Number.isNaN(nextLat) || Number.isNaN(nextLng)) return

    const nextPosition = { lat: nextLat, lng: nextLng }

    setCenter((current) =>
      current.lat === nextPosition.lat && current.lng === nextPosition.lng ? current : nextPosition
    )
    setMarker((current) =>
      current?.lat === nextPosition.lat && current?.lng === nextPosition.lng ? current : nextPosition
    )
  }, [value?.lat, value?.lng])

  useEffect(() => {
    const nextAddress = value?.address ?? ''

    setSearchQuery((current) => {
      if (current === nextAddress) return current

      // Mirror parent state into the input without turning that sync into a new billable geocode request.
      skipNextGeocodeRef.current = true
      return nextAddress
    })

    lastResolvedGeocodeQueryRef.current = nextAddress.trim()
  }, [value?.address])

  useEffect(() => {
    if (!debouncedSearch || !window.google?.maps) return

    if (skipNextGeocodeRef.current) {
      skipNextGeocodeRef.current = false
      return
    }

    geocodeAddress(debouncedSearch)
  }, [debouncedSearch, geocodeAddress])

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
        onChangeRef.current({ ...newPosition, address })
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
            onChange={(e) => {
              skipNextGeocodeRef.current = false
              lastResolvedGeocodeQueryRef.current = ''
              setSearchQuery(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return

              e.preventDefault()
              skipNextGeocodeRef.current = false
              geocodeAddress(searchQuery)
            }}
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

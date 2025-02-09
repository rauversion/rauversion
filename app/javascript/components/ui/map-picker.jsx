import React, { useState, useEffect } from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useDebounce } from "@/hooks/use_debounce"

const containerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: -33.4489,
  lng: -70.6693
}

const getGoogleMapsApiKey = () => {
  const meta = document.querySelector('meta[name="google-maps-api-key"]')
  return meta ? meta.content : ''
}

export function MapPicker({ value, onChange }) {
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [center, setCenter] = useState(defaultCenter)
  const [apiKey] = useState(getGoogleMapsApiKey())
  const debouncedSearch = useDebounce(searchQuery, 500)

  useEffect(() => {
    if (value?.lat && value?.lng) {
      setCenter({ lat: parseFloat(value.lat), lng: parseFloat(value.lng) })
      setMarker({ lat: parseFloat(value.lat), lng: parseFloat(value.lng) })
    }
  }, [value])

  useEffect(() => {
    if (debouncedSearch) {
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
    console.error('Google Maps API key not found in meta tags')
    return (
      <div className="p-4 text-sm text-red-500 bg-red-50 rounded">
        Google Maps API key not configured. Please check your environment variables.
      </div>
    )
  }


  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <div className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
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
    </LoadScript>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Location {
  display_name: string
  lat: string
  lon: string
  place_id?: string
  osm_id?: string
}

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void
}

export function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [value, setValue] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (value.length < 3) {
      setLocations([])
      return
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}&countrycodes=fr&limit=5`,
          {
            headers: {
              'Accept-Language': 'fr',
            },
          }
        )
        if (response.ok) {
          const data = await response.json()
          setLocations(data)
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Erreur lors de la recherche de lieux:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [value])

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un lieu..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
          className="pl-10"
        />
      </div>
      
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : locations.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Aucun résultat trouvé
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {locations.map((location, index) => (
                <li
                  key={location.place_id || location.osm_id || `${location.display_name}-${index}`}
                  className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onLocationSelect({
                      lat: parseFloat(location.lat),
                      lng: parseFloat(location.lon),
                      name: location.display_name,
                    })
                    setValue(location.display_name)
                    setShowSuggestions(false)
                  }}
                >
                  {location.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
} 
"use client"

import { useEffect, useRef, forwardRef } from 'react'
import { ArtistProfile } from './artist-profile'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./map-component'), { ssr: false })

interface Artist {
    id: string
    name: string
    avatar: string
    styles: string[]
    location: {
        lat: number
        lng: number
        address?: string
    }
    insta_url?: string
    insta_followers?: number
    website?: string
    tattoos?: Array<{
        id: string
        image: string
    }>
    salon?: {
        id: string
        name: string
        image: string
    }
}

interface ArtistsMapProps {
    artists: Artist[]
    onLocationSelect?: (location: { lat: number; lng: number; name: string }) => void
    onViewChange?: (bounds: { north: number; south: number; east: number; west: number }) => void
}

const ArtistsMap = forwardRef<{
    setView: (center: [number, number], zoom: number) => void;
    getZoom: () => number;
}, ArtistsMapProps>(({ artists, onLocationSelect, onViewChange }, ref) => {
    // Filtrer les artistes pour ne garder que ceux qui ont une adresse
    const artistsWithLocation = artists.filter(artist => 
        artist.location && 
        typeof artist.location.lat === 'number' && 
        typeof artist.location.lng === 'number'
    )

    return (
        <div className="h-[600px] rounded-lg overflow-hidden">
            <MapComponent
                ref={ref}
                artists={artistsWithLocation}
                onArtistSelect={(artist) => {
                    // Gérer la sélection d'un artiste ici
                }}
                onViewChange={onViewChange}
            />
        </div>
    )
})

ArtistsMap.displayName = 'ArtistsMap'

export { ArtistsMap } 
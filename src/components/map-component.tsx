"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import L from 'leaflet'
import { Store } from 'lucide-react'

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

interface MapProps {
    artists: Artist[]
    onArtistSelect: (artist: Artist) => void
    onViewChange?: (bounds: { north: number; south: number; east: number; west: number }) => void
}

interface MapRef {
    setView: (center: [number, number], zoom: number) => void
}

const MapComponent = forwardRef<MapRef, MapProps>(({ artists, onArtistSelect, onViewChange }, ref) => {
    const mapRef = useRef<L.Map | null>(null)
    const markersRef = useRef<L.Marker[]>([])
    const locationGroupsRef = useRef<Map<string, Artist[]>>(new Map())
    const mapContainerId = 'map'

    // Fonction pour vérifier si un point est dans les limites de la carte
    const isInBounds = (lat: number, lng: number, bounds: L.LatLngBounds) => {
        return bounds.contains(L.latLng(lat, lng))
    }

    // Fonction pour créer un marqueur
    const createMarker = (artist: Artist, index: number, totalAtLocation: number) => {
        // Ajouter un léger décalage si plusieurs artistes à la même position
        let lat = artist.location.lat
        let lng = artist.location.lng
        
        if (totalAtLocation > 1) {
            const radius = 0.0001 // environ 10 mètres
            const angle = (index / totalAtLocation) * 2 * Math.PI
            lat += radius * Math.cos(angle)
            lng += radius * Math.sin(angle)
        }

        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg overflow-hidden transition-transform hover:scale-110 bg-white">
                    <img 
                        src="${artist.avatar}" 
                        alt="${artist.name}" 
                        class="w-full h-full object-cover rounded-full"
                    />
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        })

        const marker = L.marker([lat, lng], { icon: customIcon })
            .addTo(mapRef.current!)

        const popupContent = document.createElement('div')
        popupContent.className = 'p-2'
        popupContent.innerHTML = `
            <div class="text-center cursor-pointer hover:opacity-75" onclick="window.selectArtist('${artist.id}')">
                <img src="${artist.avatar}" alt="${artist.name}" class="w-16 h-16 rounded-full mx-auto mb-2" />
                <div class="font-bold mb-1">${artist.name}</div>
                ${artist.salon ? `<div class="text-sm text-gray-600">@ ${artist.salon.name}</div>` : ''}
            </div>
        `

        marker.bindPopup(popupContent)
        return marker
    }

    // Fonction pour mettre à jour les marqueurs visibles
    const updateVisibleMarkers = () => {
        if (!mapRef.current) return

        const bounds = mapRef.current.getBounds()
        const zoom = mapRef.current.getZoom()

        // Notifier le changement de vue pour déclencher un nouvel appel API
        if (onViewChange) {
            // Ajouter un délai pour éviter trop d'appels API pendant le déplacement
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current)
            }

            updateTimeoutRef.current = setTimeout(() => {
                onViewChange({
                    north: bounds.getNorth(),
                    south: bounds.getSouth(),
                    east: bounds.getEast(),
                    west: bounds.getWest()
                })
            }, 300) // Attendre 300ms après le dernier mouvement
        }

        // Supprimer tous les marqueurs actuels
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []

        // Filtrer d'abord les artistes visibles dans les limites
        const visibleArtists = artists.filter(artist => {
            if (!artist.location) return false
            return isInBounds(artist.location.lat, artist.location.lng, bounds)
        })

        // Calculer le nombre maximum de marqueurs en fonction du zoom
        let maxMarkers
        if (zoom >= 15) {
            maxMarkers = visibleArtists.length
        } else if (zoom >= 12) {
            maxMarkers = Math.min(visibleArtists.length, 2000)
        } else if (zoom >= 9) {
            maxMarkers = Math.min(visibleArtists.length, 1000)
        } else {
            maxMarkers = Math.min(visibleArtists.length, 500)
        }

        // Trier les artistes par nombre de followers
        visibleArtists.sort((a, b) => {
            const followersA = a.insta_followers || 0
            const followersB = b.insta_followers || 0
            return followersB - followersA
        })

        // Regrouper les artistes par localisation
        const locationGroups = new Map<string, Artist[]>()
        visibleArtists.forEach(artist => {
            if (!artist.location) return
            const locationKey = `${artist.location.lat},${artist.location.lng}`
            const existingGroup = locationGroups.get(locationKey) || []
            locationGroups.set(locationKey, [...existingGroup, artist])
        })

        let markersCount = 0
        
        // Ajouter les nouveaux marqueurs
        locationGroups.forEach((groupArtists, locationKey) => {
            if (markersCount >= maxMarkers) return

            groupArtists.forEach((artist, index) => {
                if (markersCount < maxMarkers) {
                    const marker = createMarker(artist, index, groupArtists.length)
                    markersRef.current.push(marker)
                    markersCount++
                }
            })
        })

        // Log uniquement si le nombre d'artistes ou de marqueurs a changé
        if (markersCount > 0) {
            const now = Date.now()
            const currentUpdate = { zoom, count: markersCount, total: visibleArtists.length, timestamp: now }
            
            // Ne mettre à jour que si les valeurs ont changé ou si 1 seconde s'est écoulée
            if (!lastUpdateRef.current || 
                lastUpdateRef.current.zoom !== currentUpdate.zoom ||
                lastUpdateRef.current.count !== currentUpdate.count ||
                lastUpdateRef.current.total !== currentUpdate.total ||
                (now - lastUpdateRef.current.timestamp) > 1000) {
                console.log(`Affichage de ${markersCount} artistes sur ${visibleArtists.length} dans la zone (zoom: ${zoom})`)
                lastUpdateRef.current = currentUpdate
            }
        }
    }

    // Ajouter la référence pour le timeout
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastUpdateRef = useRef<{ zoom: number, count: number, total: number, timestamp: number } | null>(null)

    useImperativeHandle(ref, () => ({
        setView: (center: [number, number], zoom: number) => {
            mapRef.current?.setView(center, zoom)
        }
    }))

    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerId).setView([46.603354, 1.888334], 6)

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapRef.current)

            // Utiliser un seul gestionnaire d'événements avec debounce
            const debouncedUpdate = () => {
                if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current)
                }
                updateTimeoutRef.current = setTimeout(() => {
                    updateVisibleMarkers()
                    updateTimeoutRef.current = null
                }, 300)
            }

            mapRef.current.on('moveend zoomend', debouncedUpdate)
        }

        updateVisibleMarkers()

        ;(window as any).selectArtist = (artistId: string) => {
            const artist = artists.find(a => a.id === artistId)
            if (artist) {
                onArtistSelect(artist)
            }
        }

        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current)
            }
            markersRef.current.forEach(marker => marker.remove())
            if (mapRef.current) {
                mapRef.current.off('moveend', updateVisibleMarkers)
                mapRef.current.off('zoomend', updateVisibleMarkers)
                if (document.getElementById(mapContainerId) === null) {
                    mapRef.current.remove()
                    mapRef.current = null
                }
            }
            delete (window as any).selectArtist
        }
    }, [artists, onArtistSelect, onViewChange])

    return (
        <>
            <style jsx global>{`
                .custom-marker {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .custom-marker:hover {
                    z-index: 1000 !important;
                }
                .leaflet-popup-content {
                    margin: 8px;
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 8px;
                }
            `}</style>
            <div id={mapContainerId} className="w-full h-full rounded-lg overflow-hidden" />
        </>
    )
})

MapComponent.displayName = 'MapComponent'

export default MapComponent 
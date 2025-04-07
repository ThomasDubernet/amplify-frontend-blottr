"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArtistCard } from "@/components/artist-card"
import { Navbar } from "@/components/navbar"
import { ArtistsMap } from "@/components/artists-map"
import Script from 'next/script'
import { LocationSearch } from "@/components/location-search"
import { Users } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { LatLngBounds } from "leaflet"

interface Artist {
  id: string
  name: string
  avatar: string
  styles: string[]
  gender?: 'male' | 'female' | 'other'
  location: {
    address: string
    lat: number
    lng: number
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

export default function Home() {
  const [viewMode, setViewMode] = useState<"list" | "map">("map")
  const [allArtists, setAllArtists] = useState<Artist[]>([])
  const [visibleArtists, setVisibleArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followerFilter, setFollowerFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all')
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'other'>('all')
  const [hasMore, setHasMore] = useState(true)
  const mapRef = useRef<{
    setView: (center: [number, number], zoom: number) => void;
    getZoom: () => number;
  } | null>(null)
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const apiRequestRef = useRef<AbortController | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const UPDATE_THRESHOLD = 1000 // 1 seconde minimum entre les mises à jour

  // Fonction pour formater un artiste
  const formatArtist = (artist: any) => ({
    id: artist._id,
    name: artist.name || 'Artiste sans nom',
    avatar: artist["profile-picture"],
    styles: artist.styles || [],
    gender: artist.gender || 'other',
    location: artist.address || undefined,
    insta_url: artist.insta_url,
    insta_followers: artist.insta_followers,
    website: artist.website,
    salon: artist.salon ? {
      id: artist.salon._id,
      name: artist.salon.name,
      image: artist.salon["profile-picture"]
    } : undefined,
    tattoos: (artist.tattoos || []).map((tattooId: string) => ({
      id: tattooId,
      image: `https://blottr.fr/api/1.1/obj/tattoo/${tattooId}/image`
    }))
  });

  // Chargement initial de tous les artistes
  useEffect(() => {
    const loadAllArtists = async () => {
      // Si ce n'est pas le chargement initial, on ne fait rien
      if (!isInitialLoad) return;
      
      setLoading(true);
      
      // Annuler la requête précédente si elle existe
      if (apiRequestRef.current) {
        apiRequestRef.current.abort();
      }
      
      // Créer un nouveau controller pour cette requête
      apiRequestRef.current = new AbortController();
      
      try {
        let allResults: any[] = [];
        let cursor = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          const response = await fetch(
            `https://blottr.fr/api/1.1/obj/Artist?limit=${limit}&cursor=${cursor}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BUBBLE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              signal: apiRequestRef.current.signal
            }
          );

          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }

          const data = await response.json();
          const results = data.response.results;
          allResults = [...allResults, ...results];
          
          cursor += limit;
          hasMore = results.length === limit;
          
          console.log(`Chargé ${allResults.length} artistes jusqu'à présent...`);
        }

        const artists = allResults
          .map(formatArtist)
          .filter((artist: Artist) => artist.location);
        
        setAllArtists(artists);
        console.log(`Chargé ${artists.length} artistes au total`);
        setIsInitialLoad(false);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Requête annulée');
          return;
        }
        setError(`Impossible de charger les artistes: ${err.message}`);
      } finally {
        setLoading(false);
        apiRequestRef.current = null;
      }
    };

    loadAllArtists();

    // Cleanup function
    return () => {
      if (apiRequestRef.current) {
        apiRequestRef.current.abort();
      }
    };
  }, [isInitialLoad]); // Ne dépend que de isInitialLoad

  // Gestionnaire optimisé pour les changements de vue de la carte
  const handleMapViewChange = useCallback(
    debounce((newBounds: { north: number; south: number; east: number; west: number }) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < UPDATE_THRESHOLD) {
        return; // Ignorer les mises à jour trop fréquentes
      }
      lastUpdateRef.current = now;
      setMapBounds(newBounds);
    }, 300),
    []
  );

  // Mise à jour optimisée des artistes visibles
  const updateVisibleArtists = useCallback(
    debounce((bounds: any, artists: Artist[], followerFilter: string, genderFilter: string) => {
      if (!bounds || !artists.length) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < UPDATE_THRESHOLD) {
        return;
      }
      lastUpdateRef.current = now;

      // Filtrer d'abord par followers et genre
      const filteredArtists = artists.filter(artist => {
        const followers = artist.insta_followers || 0;
        const followerMatch = followerFilter === 'all' ? true :
          followerFilter === 'small' ? followers < 10000 :
          followerFilter === 'medium' ? followers >= 10000 && followers < 50000 :
          followers >= 50000;

        const genderMatch = genderFilter === 'all' ? true : artist.gender === genderFilter;

        return followerMatch && genderMatch;
      });

      // Filtrer par zone visible
      const filtered = filteredArtists.filter(artist => 
        artist.location.lat >= bounds.south &&
        artist.location.lat <= bounds.north &&
        artist.location.lng >= bounds.west &&
        artist.location.lng <= bounds.east
      );

      // Trier par nombre de followers
      filtered.sort((a, b) => (b.insta_followers || 0) - (a.insta_followers || 0));

      let maxArtists = 200;
      if (bounds && bounds.north && bounds.south && bounds.east && bounds.west) {
        maxArtists = Math.min(filtered.length, 200);
      }

      const visibleCount = Math.min(maxArtists, filtered.length);
      setVisibleArtists(filtered.slice(0, visibleCount));
      
      if (filtered.length > 0 && visibleCount !== visibleArtists.length) {
        console.log(`Affichage de ${visibleCount} artistes sur ${filtered.length} dans la zone (zoom: ${bounds ? (mapRef.current?.getZoom?.() || 6) : 6})`);
      }
    }, 300),
    []
  );

  // Fonction debounce helper
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Effet pour mettre à jour les artistes visibles
  useEffect(() => {
    if (mapBounds && allArtists.length > 0) {
      updateVisibleArtists(mapBounds, allArtists, followerFilter, genderFilter);
    }
  }, [mapBounds, allArtists, followerFilter, genderFilter, updateVisibleArtists]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <Script 
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <h1 className="text-4xl font-bold text-center">
            Trouvez votre tatoueur idéal
          </h1>

          <div className="flex flex-col gap-4">
            <div className="w-full max-w-3xl mx-auto flex items-center gap-4">
              <div className="flex-1">
                <LocationSearch onLocationSelect={(location) => {
                  if (mapRef.current) {
                    mapRef.current.setView([location.lat, location.lng], 13);
                  }
                }} />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 whitespace-nowrap">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {followerFilter === 'all' && 'Tous les followers'}
                      {followerFilter === 'small' && '< 10k followers'}
                      {followerFilter === 'medium' && '10k - 50k followers'}
                      {followerFilter === 'large' && '> 50k followers'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1 z-[1000]" align="end">
                  <div className="flex flex-col">
                    <button
                      onClick={() => setFollowerFilter('all')}
                      className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        followerFilter === 'all'
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Tous les followers
                    </button>
                    <button
                      onClick={() => setFollowerFilter('small')}
                      className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        followerFilter === 'small'
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {'< 10k followers'}
                    </button>
                    <button
                      onClick={() => setFollowerFilter('medium')}
                      className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        followerFilter === 'medium'
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {'10k - 50k followers'}
                    </button>
                    <button
                      onClick={() => setFollowerFilter('large')}
                      className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        followerFilter === 'large'
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {'> 50k followers'}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 whitespace-nowrap">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {genderFilter === 'all' && 'Tous les genres'}
                      {genderFilter === 'male' && 'Hommes'}
                      {genderFilter === 'female' && 'Femmes'}
                      {genderFilter === 'other' && 'Autre'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1 z-[1000]" align="end">
                  <div className="flex flex-col">
                    <button
                      onClick={() => setGenderFilter('all')}
                      className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        genderFilter === 'all'
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Tous les genres
                    </button>
                    <button
                      onClick={() => setGenderFilter('male')}
                      className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        genderFilter === 'male'
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Hommes
                    </button>
                    <button
                      onClick={() => setGenderFilter('female')}
                      className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        genderFilter === 'female'
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Femmes
                    </button>
                    <button
                      onClick={() => setGenderFilter('other')}
                      className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        genderFilter === 'other'
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Autre
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* La carte est toujours affichée */}
          <ArtistsMap 
            artists={visibleArtists}
            onLocationSelect={(location) => {
              if (mapRef.current) {
                mapRef.current.setView([location.lat, location.lng], 13)
              }
            }}
            onViewChange={handleMapViewChange}
            ref={mapRef}
          />

          {/* Indicateur de chargement en superposition */}
          {loading && (
            <div className="fixed top-4 right-4 bg-white bg-opacity-80 p-4 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
                <span className="text-sm">Chargement des artistes...</span>
              </div>
            </div>
          )}

          {/* Indicateur de chargement pour "loadMore" */}
          {loadingMore && (
            <div className="fixed bottom-4 right-4 bg-white bg-opacity-80 p-4 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
                <span className="text-sm">Chargement d'autres artistes...</span>
              </div>
            </div>
          )}

          {/* Messages d'erreur */}
          {error && (
            <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded shadow-lg">
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 
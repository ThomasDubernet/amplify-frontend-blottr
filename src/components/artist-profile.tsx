"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Instagram, Globe, MapPin } from "lucide-react"
import Image from "next/image"
import { PinButton } from './pin-button'

interface ArtistProfileProps {
    artist: {
        id: string
        name: string
        avatar: string
        styles: string[]
        location?: {
            address?: string
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
    isOpen: boolean
    onClose: () => void
}

export function ArtistProfile({ artist, isOpen, onClose }: ArtistProfileProps) {
    return (
        <>
            <style jsx global>{`
                .artist-profile-sheet {
                    z-index: 1000 !important;
                }
                .artist-profile-sheet-overlay {
                    z-index: 999 !important;
                }
            `}</style>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="overflow-y-auto artist-profile-sheet">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Profil de l'artiste</SheetTitle>
                    </SheetHeader>
                    
                    <div className="space-y-8">
                        {/* En-tête du profil */}
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={artist.avatar} alt={artist.name} />
                                <AvatarFallback>{artist.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-2xl font-bold">{artist.name}</h2>
                                {artist.insta_followers && (
                                    <p className="text-gray-500">
                                        {artist.insta_followers.toLocaleString()} abonnés
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Styles */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Styles</h3>
                            <div className="flex flex-wrap gap-2">
                                {artist.styles.map((style) => (
                                    <Badge key={style} variant="secondary">
                                        {style}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Liens */}
                        <div className="space-y-2">
                            {artist.insta_url && (
                                <a 
                                    href={artist.insta_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                                >
                                    <Instagram className="h-5 w-5" />
                                    <span>Instagram</span>
                                </a>
                            )}
                            {artist.website && (
                                <a 
                                    href={artist.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                                >
                                    <Globe className="h-5 w-5" />
                                    <span>Site web</span>
                                </a>
                            )}
                            {artist.location?.address && (
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <MapPin className="h-5 w-5" />
                                    <span>{artist.location.address}</span>
                                </div>
                            )}
                        </div>

                        {/* Grille de tatouages */}
                        {artist.tattoos && artist.tattoos.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-4">Réalisations</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {artist.tattoos.map((tattoo) => (
                                        <div 
                                            key={tattoo.id} 
                                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                                        >
                                            <PinButton
                                                tattooId={tattoo.id}
                                                tattooImage={tattoo.image}
                                                artistName={artist.name}
                                            />
                                            <Image
                                                src={tattoo.image}
                                                alt={`Tatouage par ${artist.name}`}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
} 
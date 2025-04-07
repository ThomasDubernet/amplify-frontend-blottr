'use client'

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArtistProfile } from "./artist-profile"

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

interface ArtistCardProps {
    artist: Artist
}

export function ArtistCard({ artist }: ArtistCardProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    return (
        <>
            <div 
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105"
                onClick={() => setIsProfileOpen(true)}
            >
                <div className="aspect-square relative">
                    <Avatar className="w-full h-full rounded-none">
                        <AvatarImage src={artist.avatar} alt={artist.name} className="object-cover" />
                        <AvatarFallback className="rounded-none">{artist.name[0]}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{artist.name}</h3>
                    <div className="flex flex-wrap gap-2">
                        {artist.styles.slice(0, 3).map((style, index) => (
                            <Badge key={index} variant="secondary">
                                {style}
                            </Badge>
                        ))}
                        {artist.styles.length > 3 && (
                            <Badge variant="secondary">+{artist.styles.length - 3}</Badge>
                        )}
                    </div>
                </div>
            </div>

            <ArtistProfile 
                artist={artist}
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
        </>
    )
} 
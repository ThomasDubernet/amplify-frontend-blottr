'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookmarkIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Board {
  id: string
  name: string
  tattoos: Array<{
    id: string
    image: string
    artistName: string
  }>
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([])

  useEffect(() => {
    const savedBoards = localStorage.getItem('tattoo-boards')
    if (savedBoards) {
      setBoards(JSON.parse(savedBoards))
    }
  }, [])

  const deleteBoard = (boardId: string) => {
    const updatedBoards = boards.filter(board => board.id !== boardId)
    setBoards(updatedBoards)
    localStorage.setItem('tattoo-boards', JSON.stringify(updatedBoards))
  }

  const removeTattoo = (boardId: string, tattooId: string) => {
    const updatedBoards = boards.map(board => {
      if (board.id === boardId) {
        return {
          ...board,
          tattoos: board.tattoos.filter(tattoo => tattoo.id !== tattooId)
        }
      }
      return board
    })
    setBoards(updatedBoards)
    localStorage.setItem('tattoo-boards', JSON.stringify(updatedBoards))
  }

  if (boards.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-8">Mes tableaux</h1>
        <div className="text-center text-gray-500">
          <BookmarkIcon className="mx-auto h-12 w-12 mb-4" />
          <p>Vous n'avez pas encore créé de tableau.</p>
          <p>Épinglez des tatouages pour commencer à créer vos collections !</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Mes tableaux</h1>
      <div className="space-y-8">
        {boards.map(board => (
          <div key={board.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {board.name}
                <span className="ml-2 text-sm text-gray-500">
                  {board.tattoos.length} tatouages
                </span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteBoard(board.id)}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {board.tattoos.map(tattoo => (
                <div
                  key={tattoo.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeTattoo(board.id, tattoo.id)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                  <Image
                    src={tattoo.image}
                    alt={`Tatouage par ${tattoo.artistName}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 
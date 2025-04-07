'use client'

import { useState } from 'react'
import { BookmarkIcon } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { Input } from './ui/input'

interface PinButtonProps {
  tattooId: string
  tattooImage: string
  artistName: string
}

interface Board {
  id: string
  name: string
  tattoos: Array<{
    id: string
    image: string
    artistName: string
  }>
}

export function PinButton({ tattooId, tattooImage, artistName }: PinButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [boards, setBoards] = useState<Board[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tattoo-boards')
        return saved ? JSON.parse(saved) : []
      } catch (error) {
        console.warn('Erreur lors de la lecture des tableaux:', error)
        return []
      }
    }
    return []
  })
  const [newBoardName, setNewBoardName] = useState('')

  const createBoard = () => {
    if (!newBoardName.trim()) return
    
    const newBoard: Board = {
      id: Date.now().toString(),
      name: newBoardName,
      tattoos: []
    }
    
    const updatedBoards = [...boards, newBoard]
    setBoards(updatedBoards)
    try {
      localStorage.setItem('tattoo-boards', JSON.stringify(updatedBoards))
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde du tableau:', error)
    }
    setNewBoardName('')
  }

  const pinToBoard = (boardId: string) => {
    const updatedBoards = boards.map((board: Board) => {
      if (board.id === boardId && !board.tattoos.some((t: { id: string }) => t.id === tattooId)) {
        return {
          ...board,
          tattoos: [...board.tattoos, { id: tattooId, image: tattooImage, artistName }]
        }
      }
      return board
    })
    
    setBoards(updatedBoards)
    try {
      localStorage.setItem('tattoo-boards', JSON.stringify(updatedBoards))
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde du tattoo:', error)
    }
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white backdrop-blur-sm z-10"
        >
          <BookmarkIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Épingler à un tableau</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nouveau tableau..."
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createBoard()}
            />
            <Button onClick={createBoard}>Créer</Button>
          </div>
          
          <div className="grid gap-2">
            {boards.map(board => (
              <Button
                key={board.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => pinToBoard(board.id)}
              >
                <BookmarkIcon className="h-4 w-4 mr-2" />
                {board.name}
                <span className="ml-auto text-gray-500 text-sm">
                  {board.tattoos.length}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
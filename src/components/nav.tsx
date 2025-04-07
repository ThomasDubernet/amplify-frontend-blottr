import Link from 'next/link'
import { BookmarkIcon } from 'lucide-react'
import { Button } from './ui/button'

export function Nav() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          Blottr
        </Link>
        <Link href="/boards">
          <Button variant="ghost" size="icon">
            <BookmarkIcon className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </nav>
  )
} 
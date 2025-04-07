import Link from 'next/link'
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-xl font-bold">
                            <Image
                                src="/blottr-logo-rectangle.svg"
                                alt="Blottr"
                                width={100}
                                height={32}
                                priority
                            />
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost">
                                Connexion
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button>
                                Commencer
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
} 
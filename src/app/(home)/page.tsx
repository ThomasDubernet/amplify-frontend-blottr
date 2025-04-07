'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Navbar } from '@/components/navbar';

interface Style {
  id: string;
  name: string;
  show: boolean;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [styles, setStyles] = useState<Style[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // Fonction pour récupérer les styles depuis l'API
  async function fetchStyles() {
    try {
      const response = await fetch(
        'https://blottr.fr/api/1.1/obj/Tag',
        { 
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BUBBLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des styles: ${response.status}`);
      }

      const data = await response.json();
      const filteredStyles = data.response.results
        .filter((tag: any) => tag.show === true)
        .map((tag: any) => ({
          id: tag._id,
          name: tag.name,
          show: tag.show
        }));
      
      setStyles(filteredStyles);
    } catch (err) {
      console.error("Erreur lors de la récupération des styles:", err);
    }
  }

  // Charger les styles au montage du composant
  useEffect(() => {
    fetchStyles();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <h1 className="text-4xl font-bold text-center">
            Trouvez votre tatoueur idéal
          </h1>
          
          <div className="flex gap-4 max-w-3xl mx-auto w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher un tatoueur..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  Styles {selectedStyles.length > 0 && `(${selectedStyles.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Styles de tatouage</h4>
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez les styles qui vous intéressent
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {styles.map((style) => (
                      <div key={style.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={style.id}
                          checked={selectedStyles.includes(style.id)}
                          onCheckedChange={(checked: boolean) => {
                            setSelectedStyles(
                              checked
                                ? [...selectedStyles, style.id]
                                : selectedStyles.filter((id) => id !== style.id)
                            );
                          }}
                        />
                        <label
                          htmlFor={style.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {style.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Ici, nous ajouterons la liste des artistes filtrés */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Les cartes d'artistes seront affichées ici */}
          </div>
        </div>
      </main>
    </div>
  );
}

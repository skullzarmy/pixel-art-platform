
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { PixelEditor } from '@/components/PixelEditor';
import { ArtworkGallery } from '@/components/ArtworkGallery';
import { ColorPaletteManager } from '@/components/ColorPaletteManager';
import type { Artwork, CreateArtworkInput, ColorPalette } from '../../server/src/schema';

function App() {
  const [currentUser] = useState({ id: 'user-1', name: 'Pixel Artist' });
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [publicArtworks, setPublicArtworks] = useState<Artwork[]>([]);
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newArtworkForm, setNewArtworkForm] = useState<CreateArtworkInput>({
    user_id: currentUser.id,
    title: '',
    description: null,
    width: 32,
    height: 32,
    is_public: false
  });

  const loadUserArtworks = useCallback(async () => {
    try {
      const result = await trpc.getArtworksByUser.query({
        user_id: currentUser.id,
        include_private: true
      });
      setArtworks(result);
    } catch (error) {
      console.error('Failed to load user artworks:', error);
    }
  }, [currentUser.id]);

  const loadPublicArtworks = useCallback(async () => {
    try {
      const result = await trpc.getPublicArtworks.query({
        limit: 20,
        offset: 0
      });
      setPublicArtworks(result);
    } catch (error) {
      console.error('Failed to load public artworks:', error);
    }
  }, []);

  const loadColorPalettes = useCallback(async () => {
    try {
      const result = await trpc.getUserColorPalettes.query({
        user_id: currentUser.id
      });
      setColorPalettes(result);
    } catch (error) {
      console.error('Failed to load color palettes:', error);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadUserArtworks();
    loadPublicArtworks();
    loadColorPalettes();
  }, [loadUserArtworks, loadPublicArtworks, loadColorPalettes]);

  const handleCreateArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createArtwork.mutate(newArtworkForm);
      setArtworks((prev: Artwork[]) => [result, ...prev]);
      setSelectedArtwork(result);
      setIsCreateDialogOpen(false);
      setNewArtworkForm({
        user_id: currentUser.id,
        title: '',
        description: null,
        width: 32,
        height: 32,
        is_public: false
      });
    } catch (error) {
      console.error('Failed to create artwork:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArtworkSelect = async (artwork: Artwork) => {
    setSelectedArtwork(artwork);
  };

  const handleArtworkUpdate = (updatedArtwork: Artwork) => {
    setArtworks((prev: Artwork[]) =>
      prev.map((art: Artwork) => art.id === updatedArtwork.id ? updatedArtwork : art)
    );
    if (selectedArtwork?.id === updatedArtwork.id) {
      setSelectedArtwork(updatedArtwork);
    }
  };

  if (selectedArtwork) {
    return (
      <div className="h-screen bg-gray-50">
        <div className="border-b bg-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setSelectedArtwork(null)}
              variant="outline"
            >
              ← Back to Gallery
            </Button>
            <div>
              <h1 className="text-xl font-bold">{selectedArtwork.title}</h1>
              <p className="text-sm text-gray-600">
                {selectedArtwork.width}×{selectedArtwork.height} pixels
              </p>
            </div>
          </div>
          <Badge variant={selectedArtwork.is_public ? 'default' : 'secondary'}>
            {selectedArtwork.is_public ? '🌍 Public' : '🔒 Private'}
          </Badge>
        </div>
        <PixelEditor 
          artwork={selectedArtwork}
          userId={currentUser.id}
          colorPalettes={colorPalettes}
          onArtworkUpdate={handleArtworkUpdate}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎨 Pixel Art Studio
          </h1>
          <p className="text-lg text-gray-600">
            Create beautiful pixel art with our powerful editor
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                ✨ Create New Artwork
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Pixel Art</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateArtwork} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={newArtworkForm.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewArtworkForm((prev: CreateArtworkInput) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="My awesome pixel art"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (optional)</label>
                  <Input
                    value={newArtworkForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewArtworkForm((prev: CreateArtworkInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    placeholder="Describe your artwork..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Width</label>
                    <Input
                      type="number"
                      min="8"
                      max="512"
                      value={newArtworkForm.width}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewArtworkForm((prev: CreateArtworkInput) => ({
                          ...prev,
                          width: parseInt(e.target.value) || 32
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Height</label>
                    <Input
                      type="number"
                      min="8"
                      max="512"
                      value={newArtworkForm.height}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewArtworkForm((prev: CreateArtworkInput) => ({
                          ...prev,
                          height: parseInt(e.target.value) || 32
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={newArtworkForm.is_public}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewArtworkForm((prev: CreateArtworkInput) => ({
                        ...prev,
                        is_public: e.target.checked
                      }))
                    }
                  />
                  <label htmlFor="is_public" className="text-sm">
                    Make artwork public
                  </label>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating...' : '🎨 Create Artwork'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="my-artworks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-artworks">🖼️ My Artworks</TabsTrigger>
            <TabsTrigger value="gallery">🌍 Public Gallery</TabsTrigger>
            <TabsTrigger value="palettes">🎨 Color Palettes</TabsTrigger>
          </TabsList>

          <TabsContent value="my-artworks" className="mt-6">
            <ArtworkGallery
              artworks={artworks}
              title="Your Artworks"
              emptyMessage="No artworks yet. Create your first pixel art!"
              onArtworkSelect={handleArtworkSelect}
              showOwnership={false}
            />
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <ArtworkGallery
              artworks={publicArtworks}
              title="Public Gallery"
              emptyMessage="No public artworks available."
              onArtworkSelect={handleArtworkSelect}
              showOwnership={true}
            />
          </TabsContent>

          <TabsContent value="palettes" className="mt-6">
            <ColorPaletteManager
              colorPalettes={colorPalettes}
              userId={currentUser.id}
              onPalettesUpdate={setColorPalettes}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;


import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { ColorPalette, CreateColorPaletteInput } from '../../../server/src/schema';

interface ColorPaletteManagerProps {
  colorPalettes: ColorPalette[];
  userId: string;
  onPalettesUpdate: (palettes: ColorPalette[]) => void;
}

export function ColorPaletteManager({ colorPalettes, userId, onPalettesUpdate }: ColorPaletteManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPalette, setNewPalette] = useState<CreateColorPaletteInput>({
    user_id: userId,
    name: '',
    colors: ['#000000', '#ffffff'],
    is_default: false
  });
  const [newColor, setNewColor] = useState('#ff0000');

  const handleCreatePalette = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createColorPalette.mutate(newPalette);
      onPalettesUpdate([result, ...colorPalettes]);
      setIsCreateDialogOpen(false);
      setNewPalette({
        user_id: userId,
        name: '',
        colors: ['#000000', '#ffffff'],
        is_default: false
      });
    } catch (error) {
      console.error('Failed to create palette:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddColor = () => {
    if (newPalette.colors.length < 64) {
      setNewPalette((prev: CreateColorPaletteInput) => ({
        ...prev,
        colors: [...prev.colors, newColor]
      }));
    }
  };

  const handleRemoveColor = (index: number) => {
    if (newPalette.colors.length > 1) {
      setNewPalette((prev: CreateColorPaletteInput) => ({
        ...prev,
        colors: prev.colors.filter((_, i: number) => i !== index)
      }));
    }
  };

  const handleDeletePalette = async (paletteId: string) => {
    try {
      await trpc.deleteColorPalette.mutate({ id: paletteId, user_id: userId });
      onPalettesUpdate(colorPalettes.filter((p: ColorPalette) => p.id !== paletteId));
    } catch (error) {
      console.error('Failed to delete palette:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          🎨 Color Palettes
          <Badge variant="secondary">{colorPalettes.length}</Badge>
        </CardTitle>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ New Palette</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Color Palette</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePalette} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  value={newPalette.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewPalette((prev: CreateColorPaletteInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="My Color Palette"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Colors</label>
                <div className="grid grid-cols-8 gap-1 mb-2">
                  {newPalette.colors.map((color: string, index: number) => (
                    <div
                      key={index}
                      className="aspect-square rounded border-2 border-gray-300 cursor-pointer hover:border-gray-400 relative group"
                      style={{ backgroundColor: color }}
                      onClick={() => handleRemoveColor(index)}
                      title={`${color} - Click to remove`}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100">×</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {newPalette.colors.length < 64 && (
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewColor(e.target.value)}
                      className="w-12 h-8 rounded border"
                    />
                    <Button type="button" onClick={handleAddColor} size="sm">
                      Add Color
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={newPalette.is_default}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewPalette((prev: CreateColorPaletteInput) => ({
                      ...prev,
                      is_default: e.target.checked
                    }))
                  }
                />
                <label htmlFor="is_default" className="text-sm">
                  Set as default palette
                </label>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Palette'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {colorPalettes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎨</div>
            <p className="text-gray-500">No color palettes yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {colorPalettes.map((palette: ColorPalette) => (
              <div key={palette.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{palette.name}</h3>
                    {palette.is_default && (
                      <Badge variant="default" className="text-xs">Default</Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePalette(palette.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    🗑️
                  </Button>
                </div>
                
                <div className="grid grid-cols-16 gap-1">
                  {palette.colors.map((color: string, index: number) => (
                    <div
                      key={index}
                      className="aspect-square rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{palette.colors.length} colors</span>
                  <span>Created {palette.created_at.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

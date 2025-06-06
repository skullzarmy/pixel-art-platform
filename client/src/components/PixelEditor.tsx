
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Artwork, Layer, ColorPalette, UpdateArtworkInput } from '../../../server/src/schema';

interface PixelEditorProps {
  artwork: Artwork;
  userId: string;
  colorPalettes: ColorPalette[];
  onArtworkUpdate: (artwork: Artwork) => void;
}

interface PixelData {
  [key: string]: string; // key: "x,y", value: hex color
}

type Tool = 'brush' | 'eraser' | 'bucket' | 'eyedropper' | 'rectangle' | 'circle';

export function PixelEditor({ artwork, userId, colorPalettes, onArtworkUpdate }: PixelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pixelData, setPixelData] = useState<PixelData>({});
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>('brush');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(1);
  const [zoom, setZoom] = useState(10);
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(Date.now());
  const [isSaving, setIsSaving] = useState(false);

  // Initialize pixel data from artwork
  useEffect(() => {
    if (artwork.pixel_data) {
      try {
        const parsed = JSON.parse(artwork.pixel_data);
        setPixelData(parsed);
      } catch (error) {
        console.error('Failed to parse pixel data:', error);
        setPixelData({});
      }
    }
  }, [artwork.pixel_data]);

  // Load layers for the artwork
  const loadLayers = useCallback(async () => {
    try {
      const result = await trpc.getLayersByArtwork.query({
        artwork_id: artwork.id,
        user_id: userId
      });
      setLayers(result);
    } catch (error) {
      console.error('Failed to load layers:', error);
    }
  }, [artwork.id, userId]);

  useEffect(() => {
    loadLayers();
  }, [loadLayers]);

  // Set default color palette
  useEffect(() => {
    const defaultPalette = colorPalettes.find((p: ColorPalette) => p.is_default) || colorPalettes[0];
    if (defaultPalette && !selectedPalette) {
      setSelectedPalette(defaultPalette);
    }
  }, [colorPalettes, selectedPalette]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const updateInput: UpdateArtworkInput = {
        id: artwork.id,
        pixel_data: JSON.stringify(pixelData)
      };

      const updatedArtwork = await trpc.updateArtwork.mutate(updateInput);
      onArtworkUpdate(updatedArtwork);
    } catch (error) {
      console.error('Failed to save artwork:', error);
    } finally {
      setIsSaving(false);
    }
  }, [artwork.id, pixelData, isSaving, onArtworkUpdate]);

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastSaveTime > 5000) { // Auto-save after 5 seconds of inactivity
        handleSave();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSaveTime, handleSave]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = artwork.width * zoom;
    canvas.height = artwork.height * zoom;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let x = 0; x <= artwork.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * zoom, 0);
      ctx.lineTo(x * zoom, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= artwork.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * zoom);
      ctx.lineTo(canvas.width, y * zoom);
      ctx.stroke();
    }

    // Draw pixels
    Object.entries(pixelData).forEach(([coord, color]: [string, string]) => {
      const [x, y] = coord.split(',').map(Number);
      ctx.fillStyle = color;
      ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
    });
  }, [pixelData, artwork.width, artwork.height, zoom]);

  const getPixelCoordinates = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / zoom);
    const y = Math.floor((event.clientY - rect.top) / zoom);

    if (x >= 0 && x < artwork.width && y >= 0 && y < artwork.height) {
      return { x, y };
    }
    return null;
  };

  const setPixel = (x: number, y: number, color: string) => {
    const key = `${x},${y}`;
    setPixelData((prev: PixelData) => ({
      ...prev,
      [key]: color
    }));
    setLastSaveTime(Date.now());
  };

  const removePixel = (x: number, y: number) => {
    const key = `${x},${y}`;
    setPixelData((prev: PixelData) => {
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
    setLastSaveTime(Date.now());
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoordinates(event);
    if (!coords) return;

    setIsDrawing(true);
    handlePixelAction(coords.x, coords.y);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const coords = getPixelCoordinates(event);
    if (!coords) return;

    handlePixelAction(coords.x, coords.y);
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const handlePixelAction = (x: number, y: number) => {
    switch (selectedTool) {
      case 'brush':
        setPixel(x, y, selectedColor);
        break;
      case 'eraser':
        removePixel(x, y);
        break;
      case 'eyedropper': {
        const key = `${x},${y}`;
        const color = pixelData[key];
        if (color) {
          setSelectedColor(color);
        }
        break;
      }
      case 'bucket':
        floodFill(x, y, selectedColor);
        break;
    }
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const key = `${startX},${startY}`;
    const targetColor = pixelData[key] || null;
    
    if (targetColor === fillColor) return;

    const stack = [{ x: startX, y: startY }];
    const newPixelData = { ...pixelData };

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const currentKey = `${x},${y}`;
      const currentColor = newPixelData[currentKey] || null;

      if (x < 0 || x >= artwork.width || y < 0 || y >= artwork.height) continue;
      if (currentColor !== targetColor) continue;

      newPixelData[currentKey] = fillColor;

      stack.push(
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 }
      );
    }

    setPixelData(newPixelData);
    setLastSaveTime(Date.now());
  };

  const handleClear = () => {
    setPixelData({});
    setLastSaveTime(Date.now());
  };

  const tools = [
    { id: 'brush' as Tool, name: 'Brush', icon: '🖌️' },
    { id: 'eraser' as Tool, name: 'Eraser', icon: '🧽' },
    { id: 'bucket' as Tool, name: 'Bucket Fill', icon: '🪣' },
    { id: 'eyedropper' as Tool, name: 'Eyedropper', icon: '💧' },
    { id: 'rectangle' as Tool, name: 'Rectangle', icon: '⬜' },
    { id: 'circle' as Tool, name: 'Circle', icon: '⭕' }
  ];

  return (
    <div className="flex h-full">
      {/* Toolbar */}
      <div className="w-80 bg-white border-r overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🛠️ Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {tools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant={selectedTool === tool.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool(tool.id)}
                    className="text-xs"
                  >
                    {tool.icon} {tool.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🎨 Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedColor(e.target.value)}
                  className="w-12 h-8 rounded border"
                />
                <Input
                  value={selectedColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedColor(e.target.value)}
                  className="text-xs"
                />
              </div>

              {selectedPalette && (
                <div>
                  <p className="text-xs font-medium mb-2">{selectedPalette.name}</p>
                  <div className="grid grid-cols-8 gap-1">
                    {selectedPalette.colors.map((color: string, index: number) => (
                      <div
                        key={index}
                        className={`aspect-square rounded border-2 cursor-pointer ${
                          selectedColor === color ? 'border-blue-500' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {colorPalettes.length > 1 && (
                <Select
                  value={selectedPalette?.id || ''}
                  onValueChange={(value: string) => {
                    const palette = colorPalettes.find((p: ColorPalette) => p.id === value);
                    setSelectedPalette(palette || null);
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select palette" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorPalettes.map((palette: ColorPalette) => (
                      <SelectItem key={palette.id} value={palette.id}>
                        {palette.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Brush Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">⚙️ Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium">Brush Size: {brushSize}</label>
                <Slider
                  value={[brushSize]}
                  onValueChange={(value: number[]) => setBrushSize(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Zoom: {zoom}x</label>
                <Slider
                  value={[zoom]}
                  onValueChange={(value: number[]) => setZoom(value[0])}
                  min={1}
                  max={30}
                  step={1}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">💾 Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full text-xs"
              >
                {isSaving ? 'Saving...' : '💾 Save'}
              </Button>
              <Button 
                onClick={handleClear}
                variant="outline"
                className="w-full text-xs"
              >
                🗑️ Clear Canvas
              </Button>
            </CardContent>
          </Card>

          {/* Layers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📚 Layers</CardTitle>
            </CardHeader>
            <CardContent>
              {layers.length === 0 ? (
                <p className="text-xs text-gray-500">No layers yet</p>
              ) : (
                <div className="space-y-2">
                  {layers.map((layer: Layer) => (
                    <div
                      key={layer.id}
                      className="flex items-center justify-between p-2 border rounded text-xs"
                    >
                      <span>{layer.name}</span>
                      <Badge variant="secondary">{Math.round(layer.opacity * 100)}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-gray-100 overflow-auto">
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-sm border inline-block">
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="cursor-crosshair"
              style={{ 
                imageRendering: 'pixelated',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Artwork } from '../../../server/src/schema';

interface ArtworkGalleryProps {
  artworks: Artwork[];
  title: string;
  emptyMessage: string;
  onArtworkSelect: (artwork: Artwork) => void;
  showOwnership: boolean;
}

export function ArtworkGallery({ 
  artworks, 
  title, 
  emptyMessage, 
  onArtworkSelect,
  showOwnership 
}: ArtworkGalleryProps) {
  if (artworks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="secondary">{artworks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {artworks.map((artwork: Artwork) => (
            <div
              key={artwork.id}
              className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onArtworkSelect(artwork)}
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {artwork.thumbnail_url ? (
                  <img 
                    src={artwork.thumbnail_url} 
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-4xl">🖼️</div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate mb-1">
                  {artwork.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{artwork.width}×{artwork.height}</span>
                  {showOwnership && (
                    <span>👤 {artwork.user_id}</span>
                  )}
                </div>
                {artwork.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {artwork.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={artwork.is_public ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {artwork.is_public ? '🌍 Public' : '🔒 Private'}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {artwork.created_at.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-colors flex items-center justify-center">
                <Button
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onArtworkSelect(artwork);
                  }}
                >
                  ✏️ Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

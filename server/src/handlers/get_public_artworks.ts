
import { db } from '../db';
import { artworksTable } from '../db/schema';
import { type GetPublicArtworksInput, type Artwork } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getPublicArtworks = async (input: GetPublicArtworksInput): Promise<Artwork[]> => {
  try {
    // Build query in a single chain to avoid type issues
    const results = await db.select()
      .from(artworksTable)
      .where(eq(artworksTable.is_public, true))
      .orderBy(desc(artworksTable.created_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Return artworks with proper type conversion
    return results.map(artwork => ({
      id: artwork.id,
      user_id: artwork.user_id,
      title: artwork.title,
      description: artwork.description,
      width: artwork.width,
      height: artwork.height,
      pixel_data: artwork.pixel_data,
      thumbnail_url: artwork.thumbnail_url,
      is_public: artwork.is_public,
      created_at: artwork.created_at,
      updated_at: artwork.updated_at
    }));
  } catch (error) {
    console.error('Failed to get public artworks:', error);
    throw error;
  }
};

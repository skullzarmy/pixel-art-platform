
import { db } from '../db';
import { artworksTable } from '../db/schema';
import { type GetArtworkByIdInput, type Artwork } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getArtworkById = async (input: GetArtworkByIdInput): Promise<Artwork | null> => {
  try {
    let results;

    if (input.user_id) {
      // If user_id is provided, user can see any artwork (public or private)
      results = await db.select()
        .from(artworksTable)
        .where(eq(artworksTable.id, input.id))
        .execute();
    } else {
      // If no user_id provided, only show public artworks
      results = await db.select()
        .from(artworksTable)
        .where(
          and(
            eq(artworksTable.id, input.id),
            eq(artworksTable.is_public, true)
          )
        )
        .execute();
    }

    if (results.length === 0) {
      return null;
    }

    const artwork = results[0];
    return {
      ...artwork,
      created_at: artwork.created_at,
      updated_at: artwork.updated_at
    };
  } catch (error) {
    console.error('Get artwork by ID failed:', error);
    throw error;
  }
};

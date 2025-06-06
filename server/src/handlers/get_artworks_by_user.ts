
import { db } from '../db';
import { artworksTable } from '../db/schema';
import { type GetArtworksByUserInput, type Artwork } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const getArtworksByUser = async (input: GetArtworksByUserInput): Promise<Artwork[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [eq(artworksTable.user_id, input.user_id)];

    // If include_private is false, only include public artworks
    if (!input.include_private) {
      conditions.push(eq(artworksTable.is_public, true));
    }

    // Build and execute query
    const results = await db.select()
      .from(artworksTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    return results;
  } catch (error) {
    console.error('Get artworks by user failed:', error);
    throw error;
  }
};

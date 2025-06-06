
import { db } from '../db';
import { layersTable, artworksTable } from '../db/schema';
import { type GetLayersByArtworkInput, type Layer } from '../schema';
import { eq, and, asc } from 'drizzle-orm';

export const getLayersByArtwork = async (input: GetLayersByArtworkInput): Promise<Layer[]> => {
  try {
    // If user_id is provided, we need to join with artworks to verify ownership
    if (input.user_id) {
      const results = await db.select()
        .from(layersTable)
        .innerJoin(
          artworksTable,
          eq(layersTable.artwork_id, artworksTable.id)
        )
        .where(
          and(
            eq(layersTable.artwork_id, input.artwork_id),
            eq(artworksTable.user_id, input.user_id)
          )
        )
        .orderBy(asc(layersTable.order_index), asc(layersTable.created_at))
        .execute();

      return results.map(result => ({
        ...result.layers,
        created_at: new Date(result.layers.created_at),
        updated_at: new Date(result.layers.updated_at)
      }));
    } else {
      // Simple query without join when no user_id verification needed
      const results = await db.select()
        .from(layersTable)
        .where(eq(layersTable.artwork_id, input.artwork_id))
        .orderBy(asc(layersTable.order_index), asc(layersTable.created_at))
        .execute();

      return results.map(result => ({
        ...result,
        created_at: new Date(result.created_at),
        updated_at: new Date(result.updated_at)
      }));
    }
  } catch (error) {
    console.error('Get layers by artwork failed:', error);
    throw error;
  }
};


import { db } from '../db';
import { layersTable, artworksTable } from '../db/schema';
import { type DeleteLayerInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteLayer = async (input: DeleteLayerInput): Promise<{ success: boolean }> => {
  try {
    // First verify the layer exists and the user owns the artwork
    const layerWithArtwork = await db.select({
      layer_id: layersTable.id,
      artwork_user_id: artworksTable.user_id
    })
    .from(layersTable)
    .innerJoin(artworksTable, eq(layersTable.artwork_id, artworksTable.id))
    .where(eq(layersTable.id, input.id))
    .execute();

    if (layerWithArtwork.length === 0) {
      throw new Error('Layer not found');
    }

    if (layerWithArtwork[0].artwork_user_id !== input.user_id) {
      throw new Error('Unauthorized: You can only delete layers from your own artworks');
    }

    // Delete the layer
    const result = await db.delete(layersTable)
      .where(eq(layersTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Layer deletion failed:', error);
    throw error;
  }
};

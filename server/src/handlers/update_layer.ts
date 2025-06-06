
import { db } from '../db';
import { layersTable, artworksTable } from '../db/schema';
import { type UpdateLayerInput, type Layer } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateLayer = async (input: UpdateLayerInput): Promise<Layer> => {
  try {
    // Verify layer exists and user owns the artwork
    const layerResult = await db.select({
      layer: layersTable,
      user_id: artworksTable.user_id
    })
      .from(layersTable)
      .innerJoin(artworksTable, eq(layersTable.artwork_id, artworksTable.id))
      .where(eq(layersTable.id, input.id))
      .execute();

    if (layerResult.length === 0) {
      throw new Error('Layer not found');
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.order_index !== undefined) {
      updateData.order_index = input.order_index;
    }

    if (input.is_visible !== undefined) {
      updateData.is_visible = input.is_visible;
    }

    if (input.opacity !== undefined) {
      updateData.opacity = input.opacity;
    }

    if (input.pixel_data !== undefined) {
      updateData.pixel_data = input.pixel_data;
    }

    // Update the layer
    const result = await db.update(layersTable)
      .set(updateData)
      .where(eq(layersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Layer update failed:', error);
    throw error;
  }
};

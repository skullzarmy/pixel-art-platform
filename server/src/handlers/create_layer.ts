
import { db } from '../db';
import { layersTable, artworksTable } from '../db/schema';
import { type CreateLayerInput, type Layer } from '../schema';
import { eq, max } from 'drizzle-orm';

export const createLayer = async (input: CreateLayerInput): Promise<Layer> => {
  try {
    // Verify artwork exists
    const artwork = await db.select()
      .from(artworksTable)
      .where(eq(artworksTable.id, input.artwork_id))
      .execute();

    if (artwork.length === 0) {
      throw new Error('Artwork not found');
    }

    // Get the next order_index if not provided
    let orderIndex = input.order_index;
    if (orderIndex === undefined) {
      const maxOrderResult = await db.select({ maxOrder: max(layersTable.order_index) })
        .from(layersTable)
        .where(eq(layersTable.artwork_id, input.artwork_id))
        .execute();

      orderIndex = (maxOrderResult[0]?.maxOrder ?? -1) + 1;
    }

    // Insert layer record
    const result = await db.insert(layersTable)
      .values({
        artwork_id: input.artwork_id,
        name: input.name,
        order_index: orderIndex,
        opacity: input.opacity
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Layer creation failed:', error);
    throw error;
  }
};


import { db } from '../db';
import { artworksTable } from '../db/schema';
import { type UpdateArtworkInput, type Artwork } from '../schema';
import { eq } from 'drizzle-orm';

export const updateArtwork = async (input: UpdateArtworkInput): Promise<Artwork> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.pixel_data !== undefined) {
      updateData.pixel_data = input.pixel_data;
    }
    if (input.thumbnail_url !== undefined) {
      updateData.thumbnail_url = input.thumbnail_url;
    }
    if (input.is_public !== undefined) {
      updateData.is_public = input.is_public;
    }

    // Update artwork record
    const result = await db.update(artworksTable)
      .set(updateData)
      .where(eq(artworksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Artwork not found');
    }

    return result[0];
  } catch (error) {
    console.error('Artwork update failed:', error);
    throw error;
  }
};

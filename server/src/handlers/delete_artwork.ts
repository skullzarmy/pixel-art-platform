
import { db } from '../db';
import { artworksTable, usersTable } from '../db/schema';
import { type DeleteArtworkInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteArtwork = async (input: DeleteArtworkInput): Promise<{ success: boolean }> => {
  try {
    // Verify the artwork exists and belongs to the user
    const existingArtwork = await db.select()
      .from(artworksTable)
      .where(
        and(
          eq(artworksTable.id, input.id),
          eq(artworksTable.user_id, input.user_id)
        )
      )
      .execute();

    if (existingArtwork.length === 0) {
      throw new Error('Artwork not found or you do not have permission to delete it');
    }

    // Delete the artwork (cascade will handle layers)
    await db.delete(artworksTable)
      .where(
        and(
          eq(artworksTable.id, input.id),
          eq(artworksTable.user_id, input.user_id)
        )
      )
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Artwork deletion failed:', error);
    throw error;
  }
};

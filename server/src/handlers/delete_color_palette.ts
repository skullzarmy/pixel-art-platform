
import { db } from '../db';
import { colorPalettesTable } from '../db/schema';
import { type DeleteColorPaletteInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteColorPalette = async (input: DeleteColorPaletteInput): Promise<{ success: boolean }> => {
  try {
    // Delete the color palette with ownership verification
    const result = await db.delete(colorPalettesTable)
      .where(and(
        eq(colorPalettesTable.id, input.id),
        eq(colorPalettesTable.user_id, input.user_id)
      ))
      .returning({ id: colorPalettesTable.id })
      .execute();

    // Return success based on whether a record was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Color palette deletion failed:', error);
    throw error;
  }
};

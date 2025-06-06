
import { db } from '../db';
import { colorPalettesTable } from '../db/schema';
import { type UpdateColorPaletteInput, type ColorPalette } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateColorPalette = async (input: UpdateColorPaletteInput): Promise<ColorPalette> => {
  try {
    // Build update data dynamically
    const updateData: Partial<typeof colorPalettesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.colors !== undefined) {
      updateData.colors = input.colors;
    }
    if (input.is_default !== undefined) {
      updateData.is_default = input.is_default;
    }

    // Update the color palette
    const result = await db.update(colorPalettesTable)
      .set(updateData)
      .where(eq(colorPalettesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Color palette not found');
    }

    return result[0];
  } catch (error) {
    console.error('Color palette update failed:', error);
    throw error;
  }
};


import { db } from '../db';
import { colorPalettesTable, usersTable } from '../db/schema';
import { type CreateColorPaletteInput, type ColorPalette } from '../schema';
import { eq } from 'drizzle-orm';

export const createColorPalette = async (input: CreateColorPaletteInput): Promise<ColorPalette> => {
  try {
    // Verify user exists to prevent foreign key constraint violation
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();
    
    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Insert color palette record
    const result = await db.insert(colorPalettesTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        colors: input.colors,
        is_default: input.is_default
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Color palette creation failed:', error);
    throw error;
  }
};

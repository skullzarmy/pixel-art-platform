
import { db } from '../db';
import { colorPalettesTable } from '../db/schema';
import { type GetUserColorPalettesInput, type ColorPalette } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserColorPalettes = async (input: GetUserColorPalettesInput): Promise<ColorPalette[]> => {
  try {
    const results = await db.select()
      .from(colorPalettesTable)
      .where(eq(colorPalettesTable.user_id, input.user_id))
      .orderBy(desc(colorPalettesTable.created_at))
      .execute();

    return results.map(palette => ({
      ...palette,
      colors: palette.colors as string[] // Cast JSON to string array
    }));
  } catch (error) {
    console.error('Get user color palettes failed:', error);
    throw error;
  }
};

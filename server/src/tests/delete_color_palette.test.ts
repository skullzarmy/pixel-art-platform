
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, colorPalettesTable } from '../db/schema';
import { type DeleteColorPaletteInput } from '../schema';
import { deleteColorPalette } from '../handlers/delete_color_palette';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: null
};

const testColorPalette = {
  name: 'Test Palette',
  colors: ['#FF0000', '#00FF00', '#0000FF'],
  is_default: false
};

describe('deleteColorPalette', () => {
  let userId: string;
  let colorPaletteId: string;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning({ id: usersTable.id })
      .execute();
    userId = userResult[0].id;

    // Create test color palette
    const colorPaletteResult = await db.insert(colorPalettesTable)
      .values({
        user_id: userId,
        ...testColorPalette
      })
      .returning({ id: colorPalettesTable.id })
      .execute();
    colorPaletteId = colorPaletteResult[0].id;
  });

  afterEach(resetDB);

  it('should delete color palette successfully', async () => {
    const input: DeleteColorPaletteInput = {
      id: colorPaletteId,
      user_id: userId
    };

    const result = await deleteColorPalette(input);

    expect(result.success).toBe(true);

    // Verify color palette was deleted
    const colorPalettes = await db.select()
      .from(colorPalettesTable)
      .where(eq(colorPalettesTable.id, colorPaletteId))
      .execute();

    expect(colorPalettes).toHaveLength(0);
  });

  it('should fail when user does not own the color palette', async () => {
    // Create another user
    const anotherUserResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        username: 'otheruser',
        display_name: 'Other User',
        avatar_url: null
      })
      .returning({ id: usersTable.id })
      .execute();
    const otherUserId = anotherUserResult[0].id;

    const input: DeleteColorPaletteInput = {
      id: colorPaletteId,
      user_id: otherUserId
    };

    const result = await deleteColorPalette(input);

    expect(result.success).toBe(false);

    // Verify color palette still exists
    const colorPalettes = await db.select()
      .from(colorPalettesTable)
      .where(eq(colorPalettesTable.id, colorPaletteId))
      .execute();

    expect(colorPalettes).toHaveLength(1);
  });

  it('should fail when color palette does not exist', async () => {
    const input: DeleteColorPaletteInput = {
      id: '00000000-0000-0000-0000-000000000000', // Valid UUID format that doesn't exist
      user_id: userId
    };

    const result = await deleteColorPalette(input);

    expect(result.success).toBe(false);
  });

  it('should handle multiple color palettes correctly', async () => {
    // Create another color palette for the same user
    const anotherColorPaletteResult = await db.insert(colorPalettesTable)
      .values({
        user_id: userId,
        name: 'Another Palette',
        colors: ['#FFFFFF', '#000000'],
        is_default: true
      })
      .returning({ id: colorPalettesTable.id })
      .execute();
    const anotherColorPaletteId = anotherColorPaletteResult[0].id;

    // Delete first color palette
    const input: DeleteColorPaletteInput = {
      id: colorPaletteId,
      user_id: userId
    };

    const result = await deleteColorPalette(input);

    expect(result.success).toBe(true);

    // Verify only the targeted color palette was deleted
    const remainingColorPalettes = await db.select()
      .from(colorPalettesTable)
      .where(eq(colorPalettesTable.user_id, userId))
      .execute();

    expect(remainingColorPalettes).toHaveLength(1);
    expect(remainingColorPalettes[0].id).toEqual(anotherColorPaletteId);
    expect(remainingColorPalettes[0].name).toEqual('Another Palette');
  });
});

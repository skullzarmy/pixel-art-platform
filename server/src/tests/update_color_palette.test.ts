
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, colorPalettesTable } from '../db/schema';
import { type UpdateColorPaletteInput } from '../schema';
import { updateColorPalette } from '../handlers/update_color_palette';
import { eq } from 'drizzle-orm';

describe('updateColorPalette', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: string;
  let testPaletteId: string;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'testuser@example.com',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: null
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test color palette
    const paletteResult = await db.insert(colorPalettesTable)
      .values({
        user_id: testUserId,
        name: 'Original Palette',
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        is_default: false
      })
      .returning()
      .execute();
    testPaletteId = paletteResult[0].id;
  });

  it('should update palette name', async () => {
    const input: UpdateColorPaletteInput = {
      id: testPaletteId,
      name: 'Updated Palette Name'
    };

    const result = await updateColorPalette(input);

    expect(result.id).toEqual(testPaletteId);
    expect(result.name).toEqual('Updated Palette Name');
    expect(result.colors).toEqual(['#FF0000', '#00FF00', '#0000FF']); // Should remain unchanged
    expect(result.is_default).toBe(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update palette colors', async () => {
    const newColors = ['#FFFFFF', '#000000', '#FFFF00', '#FF00FF'];
    const input: UpdateColorPaletteInput = {
      id: testPaletteId,
      colors: newColors
    };

    const result = await updateColorPalette(input);

    expect(result.id).toEqual(testPaletteId);
    expect(result.name).toEqual('Original Palette'); // Should remain unchanged
    expect(result.colors).toEqual(newColors);
    expect(result.is_default).toBe(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update is_default flag', async () => {
    const input: UpdateColorPaletteInput = {
      id: testPaletteId,
      is_default: true
    };

    const result = await updateColorPalette(input);

    expect(result.id).toEqual(testPaletteId);
    expect(result.name).toEqual('Original Palette'); // Should remain unchanged
    expect(result.colors).toEqual(['#FF0000', '#00FF00', '#0000FF']); // Should remain unchanged
    expect(result.is_default).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateColorPaletteInput = {
      id: testPaletteId,
      name: 'Multi-Update Palette',
      colors: ['#AAAAAA', '#BBBBBB'],
      is_default: true
    };

    const result = await updateColorPalette(input);

    expect(result.id).toEqual(testPaletteId);
    expect(result.name).toEqual('Multi-Update Palette');
    expect(result.colors).toEqual(['#AAAAAA', '#BBBBBB']);
    expect(result.is_default).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    const input: UpdateColorPaletteInput = {
      id: testPaletteId,
      name: 'Persisted Update',
      colors: ['#123456', '#789ABC']
    };

    await updateColorPalette(input);

    // Verify changes were saved to database
    const palettes = await db.select()
      .from(colorPalettesTable)
      .where(eq(colorPalettesTable.id, testPaletteId))
      .execute();

    expect(palettes).toHaveLength(1);
    expect(palettes[0].name).toEqual('Persisted Update');
    expect(palettes[0].colors).toEqual(['#123456', '#789ABC']);
    expect(palettes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent palette', async () => {
    const input: UpdateColorPaletteInput = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Non-existent UUID
      name: 'Should Fail'
    };

    await expect(updateColorPalette(input)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const input: UpdateColorPaletteInput = {
      id: testPaletteId,
      name: 'Timestamp Test'
    };

    const originalPalette = await db.select()
      .from(colorPalettesTable)
      .where(eq(colorPalettesTable.id, testPaletteId))
      .execute();

    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await updateColorPalette(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalPalette[0].updated_at.getTime());
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { colorPalettesTable, usersTable } from '../db/schema';
import { type CreateColorPaletteInput } from '../schema';
import { createColorPalette } from '../handlers/create_color_palette';
import { eq } from 'drizzle-orm';

describe('createColorPalette', () => {
  let testUserId: string;

  beforeEach(async () => {
    await createDB();
    
    // Create test user first
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = user[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateColorPaletteInput = {
    user_id: '', // Will be set in tests
    name: 'Sunset Colors',
    colors: ['#FF6B35', '#F7931E', '#FFD23F', '#EE4B2B', '#8B4513'],
    is_default: false
  };

  it('should create a color palette', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createColorPalette(input);

    // Basic field validation
    expect(result.name).toEqual('Sunset Colors');
    expect(result.colors).toEqual(['#FF6B35', '#F7931E', '#FFD23F', '#EE4B2B', '#8B4513']);
    expect(result.user_id).toEqual(testUserId);
    expect(result.is_default).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save color palette to database', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createColorPalette(input);

    // Query using proper drizzle syntax
    const palettes = await db.select()
      .from(colorPalettesTable)
      .where(eq(colorPalettesTable.id, result.id))
      .execute();

    expect(palettes).toHaveLength(1);
    expect(palettes[0].name).toEqual('Sunset Colors');
    expect(palettes[0].colors).toEqual(['#FF6B35', '#F7931E', '#FFD23F', '#EE4B2B', '#8B4513']);
    expect(palettes[0].user_id).toEqual(testUserId);
    expect(palettes[0].is_default).toEqual(false);
    expect(palettes[0].created_at).toBeInstanceOf(Date);
    expect(palettes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a default color palette', async () => {
    const input = { 
      ...testInput, 
      user_id: testUserId, 
      name: 'Default Palette',
      is_default: true 
    };
    const result = await createColorPalette(input);

    expect(result.name).toEqual('Default Palette');
    expect(result.is_default).toEqual(true);
  });

  it('should handle single color palette', async () => {
    const input = { 
      ...testInput, 
      user_id: testUserId,
      name: 'Single Color',
      colors: ['#FF0000']
    };
    const result = await createColorPalette(input);

    expect(result.colors).toEqual(['#FF0000']);
    expect(result.colors).toHaveLength(1);
  });

  it('should throw error for non-existent user', async () => {
    const input = { 
      ...testInput, 
      user_id: '550e8400-e29b-41d4-a716-446655440000' // Non-existent UUID
    };

    await expect(createColorPalette(input)).rejects.toThrow(/User with id .* not found/i);
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, colorPalettesTable } from '../db/schema';
import { type GetUserColorPalettesInput } from '../schema';
import { getUserColorPalettes } from '../handlers/get_user_color_palettes';

// Test user data
const testUser = {
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: null
};

const testPalette1 = {
  name: 'Primary Colors',
  colors: ['#FF0000', '#00FF00', '#0000FF'],
  is_default: true
};

const testPalette2 = {
  name: 'Warm Colors',
  colors: ['#FF6B35', '#F7931E', '#FFD23F'],
  is_default: false
};

describe('getUserColorPalettes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no color palettes', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const input: GetUserColorPalettesInput = {
      user_id: userResult[0].id
    };

    const result = await getUserColorPalettes(input);

    expect(result).toEqual([]);
  });

  it('should return user color palettes ordered by created_at desc', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create first palette (older)
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure different timestamps
    const palette1Result = await db.insert(colorPalettesTable)
      .values({
        user_id: userId,
        ...testPalette1
      })
      .returning()
      .execute();

    // Create second palette (newer)
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure different timestamps
    const palette2Result = await db.insert(colorPalettesTable)
      .values({
        user_id: userId,
        ...testPalette2
      })
      .returning()
      .execute();

    const input: GetUserColorPalettesInput = {
      user_id: userId
    };

    const result = await getUserColorPalettes(input);

    expect(result).toHaveLength(2);
    
    // Should be ordered by created_at desc (newest first)
    expect(result[0].id).toEqual(palette2Result[0].id);
    expect(result[0].name).toEqual('Warm Colors');
    expect(result[0].colors).toEqual(['#FF6B35', '#F7931E', '#FFD23F']);
    expect(result[0].is_default).toBe(false);

    expect(result[1].id).toEqual(palette1Result[0].id);
    expect(result[1].name).toEqual('Primary Colors');
    expect(result[1].colors).toEqual(['#FF0000', '#00FF00', '#0000FF']);
    expect(result[1].is_default).toBe(true);

    // Verify all palettes have required fields
    result.forEach(palette => {
      expect(palette.id).toBeDefined();
      expect(palette.user_id).toEqual(userId);
      expect(palette.name).toBeDefined();
      expect(Array.isArray(palette.colors)).toBe(true);
      expect(typeof palette.is_default).toBe('boolean');
      expect(palette.created_at).toBeInstanceOf(Date);
      expect(palette.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should only return palettes for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        username: 'testuser2',
        display_name: 'Test User 2',
        avatar_url: null
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create palette for user 1
    await db.insert(colorPalettesTable)
      .values({
        user_id: user1Id,
        ...testPalette1
      })
      .execute();

    // Create palette for user 2
    await db.insert(colorPalettesTable)
      .values({
        user_id: user2Id,
        ...testPalette2
      })
      .execute();

    const input: GetUserColorPalettesInput = {
      user_id: user1Id
    };

    const result = await getUserColorPalettes(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1Id);
    expect(result[0].name).toEqual('Primary Colors');
  });

  it('should handle colors array correctly', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create palette with multiple colors
    await db.insert(colorPalettesTable)
      .values({
        user_id: userId,
        name: 'Rainbow Palette',
        colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
        is_default: false
      })
      .execute();

    const input: GetUserColorPalettesInput = {
      user_id: userId
    };

    const result = await getUserColorPalettes(input);

    expect(result).toHaveLength(1);
    expect(result[0].colors).toEqual(['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']);
    expect(Array.isArray(result[0].colors)).toBe(true);
    expect(result[0].colors.length).toEqual(7);
  });
});

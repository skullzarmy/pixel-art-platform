
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, artworksTable } from '../db/schema';
import { type CreateArtworkInput } from '../schema';
import { createArtwork } from '../handlers/create_artwork';
import { eq } from 'drizzle-orm';

describe('createArtwork', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test user data
  const testUser = {
    email: 'artist@example.com',
    username: 'artist',
    display_name: 'Test Artist',
    avatar_url: null
  };

  // Test artwork input
  const testInput: CreateArtworkInput = {
    user_id: '', // Will be set after creating user
    title: 'My Pixel Art',
    description: 'A test artwork',
    width: 32,
    height: 32,
    is_public: false
  };

  it('should create an artwork', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const input = { ...testInput, user_id: user.id };

    const result = await createArtwork(input);

    // Basic field validation
    expect(result.user_id).toEqual(user.id);
    expect(result.title).toEqual('My Pixel Art');
    expect(result.description).toEqual('A test artwork');
    expect(result.width).toEqual(32);
    expect(result.height).toEqual(32);
    expect(result.pixel_data).toEqual('{}');
    expect(result.thumbnail_url).toBeNull();
    expect(result.is_public).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save artwork to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const input = { ...testInput, user_id: user.id };

    const result = await createArtwork(input);

    // Query using proper drizzle syntax
    const artworks = await db.select()
      .from(artworksTable)
      .where(eq(artworksTable.id, result.id))
      .execute();

    expect(artworks).toHaveLength(1);
    expect(artworks[0].title).toEqual('My Pixel Art');
    expect(artworks[0].description).toEqual('A test artwork');
    expect(artworks[0].width).toEqual(32);
    expect(artworks[0].height).toEqual(32);
    expect(artworks[0].pixel_data).toEqual('{}');
    expect(artworks[0].is_public).toEqual(false);
    expect(artworks[0].created_at).toBeInstanceOf(Date);
  });

  it('should create artwork with default values', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    // Input without optional fields
    const minimalInput: CreateArtworkInput = {
      user_id: user.id,
      title: 'Minimal Artwork',
      width: 16,
      height: 16,
      is_public: false
    };

    const result = await createArtwork(minimalInput);

    expect(result.title).toEqual('Minimal Artwork');
    expect(result.description).toBeNull();
    expect(result.width).toEqual(16);
    expect(result.height).toEqual(16);
    expect(result.pixel_data).toEqual('{}');
    expect(result.thumbnail_url).toBeNull();
    expect(result.is_public).toEqual(false);
  });

  it('should create public artwork', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const publicInput: CreateArtworkInput = {
      user_id: user.id,
      title: 'Public Artwork',
      description: 'A public pixel art',
      width: 64,
      height: 64,
      is_public: true
    };

    const result = await createArtwork(publicInput);

    expect(result.is_public).toEqual(true);
    expect(result.title).toEqual('Public Artwork');
    expect(result.width).toEqual(64);
    expect(result.height).toEqual(64);
  });

  it('should fail with invalid user_id', async () => {
    const invalidInput: CreateArtworkInput = {
      user_id: '00000000-0000-0000-0000-000000000000',
      title: 'Invalid User Art',
      width: 32,
      height: 32,
      is_public: false
    };

    await expect(createArtwork(invalidInput)).rejects.toThrow(/foreign key constraint/i);
  });
});

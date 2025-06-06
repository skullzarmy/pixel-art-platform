
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, artworksTable } from '../db/schema';
import { type UpdateArtworkInput } from '../schema';
import { updateArtwork } from '../handlers/update_artwork';
import { eq } from 'drizzle-orm';

// Test user for creating artworks
const testUser = {
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: null
};

// Test artwork data
const testArtwork = {
  title: 'Original Title',
  description: 'Original description',
  width: 32,
  height: 32,
  pixel_data: '{"pixels": []}',
  thumbnail_url: null,
  is_public: false
};

describe('updateArtwork', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update artwork title', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test artwork
    const artworkResult = await db.insert(artworksTable)
      .values({
        ...testArtwork,
        user_id: userId
      })
      .returning()
      .execute();
    const artworkId = artworkResult[0].id;

    // Update artwork title
    const updateInput: UpdateArtworkInput = {
      id: artworkId,
      title: 'Updated Title'
    };

    const result = await updateArtwork(updateInput);

    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.is_public).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test artwork
    const artworkResult = await db.insert(artworksTable)
      .values({
        ...testArtwork,
        user_id: userId
      })
      .returning()
      .execute();
    const artworkId = artworkResult[0].id;

    // Update multiple fields
    const updateInput: UpdateArtworkInput = {
      id: artworkId,
      title: 'New Title',
      description: 'New description',
      pixel_data: '{"pixels": [1,2,3]}',
      thumbnail_url: 'https://example.com/thumb.png',
      is_public: true
    };

    const result = await updateArtwork(updateInput);

    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.pixel_data).toEqual('{"pixels": [1,2,3]}');
    expect(result.thumbnail_url).toEqual('https://example.com/thumb.png');
    expect(result.is_public).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated artwork to database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test artwork
    const artworkResult = await db.insert(artworksTable)
      .values({
        ...testArtwork,
        user_id: userId
      })
      .returning()
      .execute();
    const artworkId = artworkResult[0].id;

    // Update artwork
    const updateInput: UpdateArtworkInput = {
      id: artworkId,
      title: 'Database Updated Title',
      is_public: true
    };

    await updateArtwork(updateInput);

    // Verify in database
    const artworks = await db.select()
      .from(artworksTable)
      .where(eq(artworksTable.id, artworkId))
      .execute();

    expect(artworks).toHaveLength(1);
    expect(artworks[0].title).toEqual('Database Updated Title');
    expect(artworks[0].is_public).toEqual(true);
    expect(artworks[0].description).toEqual('Original description'); // Should remain unchanged
  });

  it('should update description to null', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test artwork
    const artworkResult = await db.insert(artworksTable)
      .values({
        ...testArtwork,
        user_id: userId
      })
      .returning()
      .execute();
    const artworkId = artworkResult[0].id;

    // Update description to null
    const updateInput: UpdateArtworkInput = {
      id: artworkId,
      description: null
    };

    const result = await updateArtwork(updateInput);

    expect(result.description).toBeNull();
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should throw error for non-existent artwork', async () => {
    const updateInput: UpdateArtworkInput = {
      id: '00000000-0000-0000-0000-000000000000',
      title: 'Should Not Work'
    };

    await expect(updateArtwork(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test artwork
    const artworkResult = await db.insert(artworksTable)
      .values({
        ...testArtwork,
        user_id: userId
      })
      .returning()
      .execute();
    const artworkId = artworkResult[0].id;
    const originalUpdatedAt = artworkResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update artwork
    const updateInput: UpdateArtworkInput = {
      id: artworkId,
      title: 'Timestamp Test'
    };

    const result = await updateArtwork(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});

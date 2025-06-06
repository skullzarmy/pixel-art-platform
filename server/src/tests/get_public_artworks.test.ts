
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, artworksTable } from '../db/schema';
import { type GetPublicArtworksInput } from '../schema';
import { getPublicArtworks } from '../handlers/get_public_artworks';

// Test user data
const testUser = {
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: null
};

// Test artwork data
const publicArtwork = {
  title: 'Public Artwork',
  description: 'A public artwork',
  width: 64,
  height: 64,
  pixel_data: '{"pixels": []}',
  thumbnail_url: null,
  is_public: true
};

const privateArtwork = {
  title: 'Private Artwork',
  description: 'A private artwork',
  width: 32,
  height: 32,
  pixel_data: '{"pixels": []}',
  thumbnail_url: null,
  is_public: false
};

describe('getPublicArtworks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only public artworks', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create both public and private artworks
    await db.insert(artworksTable)
      .values([
        { ...publicArtwork, user_id: userId },
        { ...privateArtwork, user_id: userId }
      ])
      .execute();

    const input: GetPublicArtworksInput = {
      limit: 20,
      offset: 0
    };

    const result = await getPublicArtworks(input);

    // Should only return public artwork
    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Public Artwork');
    expect(result[0].is_public).toBe(true);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].width).toEqual(64);
    expect(result[0].height).toEqual(64);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no public artworks exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create only private artwork
    await db.insert(artworksTable)
      .values({ ...privateArtwork, user_id: userId })
      .execute();

    const input: GetPublicArtworksInput = {
      limit: 20,
      offset: 0
    };

    const result = await getPublicArtworks(input);

    expect(result).toHaveLength(0);
  });

  it('should respect limit and offset parameters', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create multiple public artworks
    const artworks = Array.from({ length: 5 }, (_, i) => ({
      ...publicArtwork,
      title: `Public Artwork ${i + 1}`,
      user_id: userId
    }));

    await db.insert(artworksTable)
      .values(artworks)
      .execute();

    // Test limit
    const limitedResult = await getPublicArtworks({
      limit: 2,
      offset: 0
    });

    expect(limitedResult).toHaveLength(2);

    // Test offset
    const offsetResult = await getPublicArtworks({
      limit: 2,
      offset: 2
    });

    expect(offsetResult).toHaveLength(2);
    
    // Verify different results due to offset
    expect(limitedResult[0].id).not.toEqual(offsetResult[0].id);
  });

  it('should return artworks ordered by created_at desc (newest first)', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create artworks with slight delay to ensure different timestamps
    const artwork1 = await db.insert(artworksTable)
      .values({ ...publicArtwork, title: 'First Artwork', user_id: userId })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const artwork2 = await db.insert(artworksTable)
      .values({ ...publicArtwork, title: 'Second Artwork', user_id: userId })
      .returning()
      .execute();

    const input: GetPublicArtworksInput = {
      limit: 20,
      offset: 0
    };

    const result = await getPublicArtworks(input);

    expect(result).toHaveLength(2);
    // Newest should come first
    expect(result[0].title).toEqual('Second Artwork');
    expect(result[1].title).toEqual('First Artwork');
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });
});

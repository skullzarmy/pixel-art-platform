
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, artworksTable, layersTable } from '../db/schema';
import { type DeleteArtworkInput } from '../schema';
import { deleteArtwork } from '../handlers/delete_artwork';
import { eq } from 'drizzle-orm';

// Test user
const testUser = {
  email: 'artist@example.com',
  username: 'artist',
  display_name: 'Test Artist',
  avatar_url: null
};

// Another test user
const otherUser = {
  email: 'other@example.com',
  username: 'other',
  display_name: 'Other User',
  avatar_url: null
};

// Test artwork
const testArtwork = {
  title: 'Test Artwork',
  description: 'A test artwork',
  width: 32,
  height: 32,
  pixel_data: '{}',
  thumbnail_url: null,
  is_public: true
};

describe('deleteArtwork', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an artwork successfully', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create test artwork
    const [artwork] = await db.insert(artworksTable)
      .values({
        ...testArtwork,
        user_id: user.id
      })
      .returning()
      .execute();

    const input: DeleteArtworkInput = {
      id: artwork.id,
      user_id: user.id
    };

    const result = await deleteArtwork(input);

    expect(result.success).toBe(true);

    // Verify artwork is deleted
    const deletedArtwork = await db.select()
      .from(artworksTable)
      .where(eq(artworksTable.id, artwork.id))
      .execute();

    expect(deletedArtwork).toHaveLength(0);
  });

  it('should delete artwork and cascade delete layers', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create test artwork
    const [artwork] = await db.insert(artworksTable)
      .values({
        ...testArtwork,
        user_id: user.id
      })
      .returning()
      .execute();

    // Create test layer
    const [layer] = await db.insert(layersTable)
      .values({
        artwork_id: artwork.id,
        name: 'Test Layer',
        order_index: 0,
        is_visible: true,
        opacity: 1.0,
        pixel_data: '{}'
      })
      .returning()
      .execute();

    const input: DeleteArtworkInput = {
      id: artwork.id,
      user_id: user.id
    };

    const result = await deleteArtwork(input);

    expect(result.success).toBe(true);

    // Verify artwork is deleted
    const deletedArtwork = await db.select()
      .from(artworksTable)
      .where(eq(artworksTable.id, artwork.id))
      .execute();

    expect(deletedArtwork).toHaveLength(0);

    // Verify layer is cascade deleted
    const deletedLayers = await db.select()
      .from(layersTable)
      .where(eq(layersTable.id, layer.id))
      .execute();

    expect(deletedLayers).toHaveLength(0);
  });

  it('should throw error when artwork does not exist', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const input: DeleteArtworkInput = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID that doesn't exist
      user_id: user.id
    };

    await expect(deleteArtwork(input)).rejects.toThrow(/not found/i);
  });

  it('should throw error when user does not own the artwork', async () => {
    // Create test users
    const [user1] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values(otherUser)
      .returning()
      .execute();

    // Create artwork owned by user1
    const [artwork] = await db.insert(artworksTable)
      .values({
        ...testArtwork,
        user_id: user1.id
      })
      .returning()
      .execute();

    // Try to delete as user2
    const input: DeleteArtworkInput = {
      id: artwork.id,
      user_id: user2.id
    };

    await expect(deleteArtwork(input)).rejects.toThrow(/permission/i);

    // Verify artwork still exists
    const existingArtwork = await db.select()
      .from(artworksTable)
      .where(eq(artworksTable.id, artwork.id))
      .execute();

    expect(existingArtwork).toHaveLength(1);
  });
});

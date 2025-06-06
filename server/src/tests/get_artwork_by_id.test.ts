
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, artworksTable } from '../db/schema';
import { type GetArtworkByIdInput } from '../schema';
import { getArtworkById } from '../handlers/get_artwork_by_id';

describe('getArtworkById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: string;
  let otherUserId: string;
  let publicArtworkId: string;
  let privateArtworkId: string;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          username: 'testuser',
          display_name: 'Test User'
        },
        {
          email: 'other@example.com',
          username: 'otheruser',
          display_name: 'Other User'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test artworks
    const artworks = await db.insert(artworksTable)
      .values([
        {
          user_id: testUserId,
          title: 'Public Artwork',
          description: 'A public artwork',
          width: 64,
          height: 64,
          pixel_data: '{"pixels": []}',
          is_public: true
        },
        {
          user_id: testUserId,
          title: 'Private Artwork',
          description: 'A private artwork',
          width: 32,
          height: 32,
          pixel_data: '{"pixels": []}',
          is_public: false
        }
      ])
      .returning()
      .execute();

    publicArtworkId = artworks[0].id;
    privateArtworkId = artworks[1].id;
  });

  it('should return public artwork when no user_id provided', async () => {
    const input: GetArtworkByIdInput = {
      id: publicArtworkId
    };

    const result = await getArtworkById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(publicArtworkId);
    expect(result!.title).toEqual('Public Artwork');
    expect(result!.description).toEqual('A public artwork');
    expect(result!.width).toEqual(64);
    expect(result!.height).toEqual(64);
    expect(result!.pixel_data).toEqual('{"pixels": []}');
    expect(result!.is_public).toEqual(true);
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for private artwork when no user_id provided', async () => {
    const input: GetArtworkByIdInput = {
      id: privateArtworkId
    };

    const result = await getArtworkById(input);

    expect(result).toBeNull();
  });

  it('should return artwork when user_id is provided', async () => {
    const input: GetArtworkByIdInput = {
      id: publicArtworkId,
      user_id: testUserId
    };

    const result = await getArtworkById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(publicArtworkId);
    expect(result!.title).toEqual('Public Artwork');
    expect(result!.user_id).toEqual(testUserId);
  });

  it('should return private artwork when requested by any user with user_id', async () => {
    const input: GetArtworkByIdInput = {
      id: privateArtworkId,
      user_id: otherUserId // Different user can still access by ID
    };

    const result = await getArtworkById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(privateArtworkId);
    expect(result!.title).toEqual('Private Artwork');
    expect(result!.is_public).toEqual(false);
  });

  it('should return null for non-existent artwork', async () => {
    const input: GetArtworkByIdInput = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Random UUID
      user_id: testUserId
    };

    const result = await getArtworkById(input);

    expect(result).toBeNull();
  });

  it('should return null for non-existent artwork without user_id', async () => {
    const input: GetArtworkByIdInput = {
      id: '550e8400-e29b-41d4-a716-446655440000' // Random UUID
    };

    const result = await getArtworkById(input);

    expect(result).toBeNull();
  });

  it('should handle artwork with null description', async () => {
    // Create artwork with null description
    const artworkResult = await db.insert(artworksTable)
      .values({
        user_id: testUserId,
        title: 'No Description Artwork',
        description: null,
        width: 16,
        height: 16,
        pixel_data: '{}',
        is_public: true
      })
      .returning()
      .execute();

    const input: GetArtworkByIdInput = {
      id: artworkResult[0].id
    };

    const result = await getArtworkById(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('No Description Artwork');
    expect(result!.description).toBeNull();
    expect(result!.width).toEqual(16);
    expect(result!.height).toEqual(16);
  });

  it('should handle artwork with null thumbnail_url', async () => {
    const input: GetArtworkByIdInput = {
      id: publicArtworkId
    };

    const result = await getArtworkById(input);

    expect(result).not.toBeNull();
    expect(result!.thumbnail_url).toBeNull();
  });
});

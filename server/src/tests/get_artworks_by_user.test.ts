
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, artworksTable } from '../db/schema';
import { type GetArtworksByUserInput } from '../schema';
import { getArtworksByUser } from '../handlers/get_artworks_by_user';

describe('getArtworksByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: string;
  let otherUserId: string;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@test.com',
          username: 'user1',
          display_name: 'User One'
        },
        {
          email: 'user2@test.com',
          username: 'user2',
          display_name: 'User Two'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test artworks for first user
    await db.insert(artworksTable)
      .values([
        {
          user_id: testUserId,
          title: 'Public Artwork',
          width: 16,
          height: 16,
          is_public: true,
          pixel_data: '{"pixels": []}'
        },
        {
          user_id: testUserId,
          title: 'Private Artwork',
          width: 32,
          height: 32,
          is_public: false,
          pixel_data: '{"pixels": []}'
        }
      ])
      .execute();

    // Create test artwork for second user
    await db.insert(artworksTable)
      .values({
        user_id: otherUserId,
        title: 'Other User Artwork',
        width: 24,
        height: 24,
        is_public: true,
        pixel_data: '{"pixels": []}'
      })
      .execute();
  });

  it('should return all artworks when include_private is true', async () => {
    const input: GetArtworksByUserInput = {
      user_id: testUserId,
      include_private: true
    };

    const result = await getArtworksByUser(input);

    expect(result).toHaveLength(2);
    
    const titles = result.map(artwork => artwork.title);
    expect(titles).toContain('Public Artwork');
    expect(titles).toContain('Private Artwork');

    // Verify all artworks belong to the correct user
    result.forEach(artwork => {
      expect(artwork.user_id).toEqual(testUserId);
      expect(artwork.id).toBeDefined();
      expect(artwork.created_at).toBeInstanceOf(Date);
      expect(artwork.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return only public artworks when include_private is false', async () => {
    const input: GetArtworksByUserInput = {
      user_id: testUserId,
      include_private: false
    };

    const result = await getArtworksByUser(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Public Artwork');
    expect(result[0].is_public).toBe(true);
    expect(result[0].user_id).toEqual(testUserId);
  });

  it('should use default include_private value', async () => {
    const input: GetArtworksByUserInput = {
      user_id: testUserId,
      include_private: true
    };

    const result = await getArtworksByUser(input);

    expect(result).toHaveLength(2);
    
    const titles = result.map(artwork => artwork.title);
    expect(titles).toContain('Public Artwork');
    expect(titles).toContain('Private Artwork');
  });

  it('should return empty array for user with no artworks', async () => {
    // Create a new user with no artworks
    const newUser = await db.insert(usersTable)
      .values({
        email: 'empty@test.com',
        username: 'empty',
        display_name: 'Empty User'
      })
      .returning()
      .execute();

    const input: GetArtworksByUserInput = {
      user_id: newUser[0].id,
      include_private: true
    };

    const result = await getArtworksByUser(input);

    expect(result).toHaveLength(0);
  });

  it('should not return artworks from other users', async () => {
    const input: GetArtworksByUserInput = {
      user_id: testUserId,
      include_private: true
    };

    const result = await getArtworksByUser(input);

    // Should not contain artwork from otherUserId
    result.forEach(artwork => {
      expect(artwork.user_id).toEqual(testUserId);
      expect(artwork.title).not.toEqual('Other User Artwork');
    });
  });
});

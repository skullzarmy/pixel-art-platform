
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, artworksTable, layersTable } from '../db/schema';
import { type GetLayersByArtworkInput } from '../schema';
import { getLayersByArtwork } from '../handlers/get_layers_by_artwork';

describe('getLayersByArtwork', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get layers for an artwork', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test artwork
    const artworkResult = await db.insert(artworksTable)
      .values({
        user_id: user.id,
        title: 'Test Artwork',
        width: 16,
        height: 16
      })
      .returning()
      .execute();
    const artwork = artworkResult[0];

    // Create test layers with different order indices
    await db.insert(layersTable)
      .values([
        {
          artwork_id: artwork.id,
          name: 'Layer 2',
          order_index: 1,
          opacity: 0.8
        },
        {
          artwork_id: artwork.id,
          name: 'Layer 1',
          order_index: 0,
          opacity: 1.0
        },
        {
          artwork_id: artwork.id,
          name: 'Layer 3',
          order_index: 2,
          opacity: 0.5
        }
      ])
      .execute();

    const input: GetLayersByArtworkInput = {
      artwork_id: artwork.id
    };

    const result = await getLayersByArtwork(input);

    expect(result).toHaveLength(3);
    
    // Should be ordered by order_index
    expect(result[0].name).toEqual('Layer 1');
    expect(result[0].order_index).toEqual(0);
    expect(result[0].opacity).toEqual(1.0);
    
    expect(result[1].name).toEqual('Layer 2');
    expect(result[1].order_index).toEqual(1);
    expect(result[1].opacity).toEqual(0.8);
    
    expect(result[2].name).toEqual('Layer 3');
    expect(result[2].order_index).toEqual(2);
    expect(result[2].opacity).toEqual(0.5);

    // Verify all layers belong to the artwork
    result.forEach(layer => {
      expect(layer.artwork_id).toEqual(artwork.id);
      expect(layer.id).toBeDefined();
      expect(layer.created_at).toBeInstanceOf(Date);
      expect(layer.updated_at).toBeInstanceOf(Date);
      expect(layer.is_visible).toEqual(true);
      expect(layer.pixel_data).toEqual('{}');
    });
  });

  it('should verify ownership when user_id provided', async () => {
    // Create test users
    const userResult = await db.insert(usersTable)
      .values([
        {
          email: 'owner@example.com',
          username: 'owner'
        },
        {
          email: 'other@example.com',
          username: 'other'
        }
      ])
      .returning()
      .execute();
    const owner = userResult[0];
    const otherUser = userResult[1];

    // Create artwork owned by first user
    const artworkResult = await db.insert(artworksTable)
      .values({
        user_id: owner.id,
        title: 'Owner Artwork',
        width: 16,
        height: 16
      })
      .returning()
      .execute();
    const artwork = artworkResult[0];

    // Create layer
    await db.insert(layersTable)
      .values({
        artwork_id: artwork.id,
        name: 'Test Layer'
      })
      .execute();

    // Owner should see the layer
    const ownerInput: GetLayersByArtworkInput = {
      artwork_id: artwork.id,
      user_id: owner.id
    };
    const ownerResult = await getLayersByArtwork(ownerInput);
    expect(ownerResult).toHaveLength(1);
    expect(ownerResult[0].name).toEqual('Test Layer');

    // Other user should not see the layer
    const otherInput: GetLayersByArtworkInput = {
      artwork_id: artwork.id,
      user_id: otherUser.id
    };
    const otherResult = await getLayersByArtwork(otherInput);
    expect(otherResult).toHaveLength(0);
  });

  it('should return empty array for non-existent artwork', async () => {
    const input: GetLayersByArtworkInput = {
      artwork_id: '550e8400-e29b-41d4-a716-446655440000' // Valid UUID format
    };

    const result = await getLayersByArtwork(input);
    expect(result).toHaveLength(0);
  });

  it('should return empty array for artwork with no layers', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create artwork without layers
    const artworkResult = await db.insert(artworksTable)
      .values({
        user_id: user.id,
        title: 'Empty Artwork',
        width: 16,
        height: 16
      })
      .returning()
      .execute();
    const artwork = artworkResult[0];

    const input: GetLayersByArtworkInput = {
      artwork_id: artwork.id
    };

    const result = await getLayersByArtwork(input);
    expect(result).toHaveLength(0);
  });
});

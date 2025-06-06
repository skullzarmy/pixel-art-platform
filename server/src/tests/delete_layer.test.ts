
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, artworksTable, layersTable } from '../db/schema';
import { type DeleteLayerInput } from '../schema';
import { deleteLayer } from '../handlers/delete_layer';
import { eq } from 'drizzle-orm';

describe('deleteLayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a layer successfully', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create an artwork
    const artworkResult = await db.insert(artworksTable)
      .values({
        user_id: user.id,
        title: 'Test Artwork',
        width: 64,
        height: 64
      })
      .returning()
      .execute();
    const artwork = artworkResult[0];

    // Create a layer
    const layerResult = await db.insert(layersTable)
      .values({
        artwork_id: artwork.id,
        name: 'Test Layer',
        order_index: 0
      })
      .returning()
      .execute();
    const layer = layerResult[0];

    const input: DeleteLayerInput = {
      id: layer.id,
      user_id: user.id
    };

    const result = await deleteLayer(input);

    expect(result.success).toBe(true);

    // Verify layer was deleted from database
    const layers = await db.select()
      .from(layersTable)
      .where(eq(layersTable.id, layer.id))
      .execute();

    expect(layers).toHaveLength(0);
  });

  it('should throw error when layer does not exist', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Use a valid UUID format that doesn't exist
    const input: DeleteLayerInput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: user.id
    };

    await expect(deleteLayer(input)).rejects.toThrow(/layer not found/i);
  });

  it('should throw error when user does not own the artwork', async () => {
    // Create first user (owner)
    const ownerResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        username: 'owner',
        display_name: 'Owner'
      })
      .returning()
      .execute();
    const owner = ownerResult[0];

    // Create second user (non-owner)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        username: 'user',
        display_name: 'User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create artwork owned by first user
    const artworkResult = await db.insert(artworksTable)
      .values({
        user_id: owner.id,
        title: 'Owner Artwork',
        width: 64,
        height: 64
      })
      .returning()
      .execute();
    const artwork = artworkResult[0];

    // Create layer on owner's artwork
    const layerResult = await db.insert(layersTable)
      .values({
        artwork_id: artwork.id,
        name: 'Owner Layer',
        order_index: 0
      })
      .returning()
      .execute();
    const layer = layerResult[0];

    // Try to delete with non-owner user
    const input: DeleteLayerInput = {
      id: layer.id,
      user_id: user.id
    };

    await expect(deleteLayer(input)).rejects.toThrow(/unauthorized/i);

    // Verify layer was not deleted
    const layers = await db.select()
      .from(layersTable)
      .where(eq(layersTable.id, layer.id))
      .execute();

    expect(layers).toHaveLength(1);
  });

  it('should allow owner to delete their own layer', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        username: 'owner',
        display_name: 'Owner'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create artwork
    const artworkResult = await db.insert(artworksTable)
      .values({
        user_id: user.id,
        title: 'My Artwork',
        width: 128,
        height: 128
      })
      .returning()
      .execute();
    const artwork = artworkResult[0];

    // Create multiple layers
    const layer1Result = await db.insert(layersTable)
      .values({
        artwork_id: artwork.id,
        name: 'Layer 1',
        order_index: 0
      })
      .returning()
      .execute();

    const layer2Result = await db.insert(layersTable)
      .values({
        artwork_id: artwork.id,
        name: 'Layer 2',
        order_index: 1
      })
      .returning()
      .execute();

    const layer1 = layer1Result[0];
    const layer2 = layer2Result[0];

    // Delete one layer
    const input: DeleteLayerInput = {
      id: layer1.id,
      user_id: user.id
    };

    const result = await deleteLayer(input);

    expect(result.success).toBe(true);

    // Verify only the targeted layer was deleted
    const remainingLayers = await db.select()
      .from(layersTable)
      .where(eq(layersTable.artwork_id, artwork.id))
      .execute();

    expect(remainingLayers).toHaveLength(1);
    expect(remainingLayers[0].id).toEqual(layer2.id);
    expect(remainingLayers[0].name).toEqual('Layer 2');
  });
});

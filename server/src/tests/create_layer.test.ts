
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, artworksTable, layersTable } from '../db/schema';
import { type CreateLayerInput } from '../schema';
import { createLayer } from '../handlers/create_layer';
import { eq } from 'drizzle-orm';

describe('createLayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: string;
  let testArtworkId: string;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test artwork
    const artworkResult = await db.insert(artworksTable)
      .values({
        user_id: testUserId,
        title: 'Test Artwork',
        width: 64,
        height: 64
      })
      .returning()
      .execute();
    testArtworkId = artworkResult[0].id;
  });

  it('should create a layer with all required fields', async () => {
    const testInput: CreateLayerInput = {
      artwork_id: testArtworkId,
      name: 'Background Layer',
      order_index: 0,
      opacity: 0.8
    };

    const result = await createLayer(testInput);

    expect(result.artwork_id).toEqual(testArtworkId);
    expect(result.name).toEqual('Background Layer');
    expect(result.order_index).toEqual(0);
    expect(result.is_visible).toEqual(true);
    expect(result.opacity).toEqual(0.8);
    expect(result.pixel_data).toEqual('{}');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a layer with default values', async () => {
    const testInput: CreateLayerInput = {
      artwork_id: testArtworkId,
      name: 'Simple Layer',
      opacity: 1.0
    };

    const result = await createLayer(testInput);

    expect(result.artwork_id).toEqual(testArtworkId);
    expect(result.name).toEqual('Simple Layer');
    expect(result.order_index).toEqual(0); // First layer should get order_index 0
    expect(result.is_visible).toEqual(true);
    expect(result.opacity).toEqual(1.0);
    expect(result.pixel_data).toEqual('{}');
  });

  it('should save layer to database', async () => {
    const testInput: CreateLayerInput = {
      artwork_id: testArtworkId,
      name: 'Test Layer',
      order_index: 1,
      opacity: 0.5
    };

    const result = await createLayer(testInput);

    const layers = await db.select()
      .from(layersTable)
      .where(eq(layersTable.id, result.id))
      .execute();

    expect(layers).toHaveLength(1);
    expect(layers[0].artwork_id).toEqual(testArtworkId);
    expect(layers[0].name).toEqual('Test Layer');
    expect(layers[0].order_index).toEqual(1);
    expect(layers[0].opacity).toEqual(0.5);
    expect(layers[0].is_visible).toEqual(true);
    expect(layers[0].pixel_data).toEqual('{}');
  });

  it('should auto-increment order_index when not provided', async () => {
    // Create first layer
    const firstInput: CreateLayerInput = {
      artwork_id: testArtworkId,
      name: 'First Layer',
      opacity: 1.0
    };
    const firstLayer = await createLayer(firstInput);
    expect(firstLayer.order_index).toEqual(0);

    // Create second layer without specifying order_index
    const secondInput: CreateLayerInput = {
      artwork_id: testArtworkId,
      name: 'Second Layer',
      opacity: 1.0
    };
    const secondLayer = await createLayer(secondInput);
    expect(secondLayer.order_index).toEqual(1);

    // Create third layer without specifying order_index
    const thirdInput: CreateLayerInput = {
      artwork_id: testArtworkId,
      name: 'Third Layer',
      opacity: 1.0
    };
    const thirdLayer = await createLayer(thirdInput);
    expect(thirdLayer.order_index).toEqual(2);
  });

  it('should throw error for non-existent artwork', async () => {
    const testInput: CreateLayerInput = {
      artwork_id: '00000000-0000-0000-0000-000000000000',
      name: 'Test Layer',
      opacity: 1.0
    };

    await expect(createLayer(testInput)).rejects.toThrow(/artwork not found/i);
  });

  it('should handle multiple layers with mixed order_index specification', async () => {
    // Create layer with specific order_index
    const firstInput: CreateLayerInput = {
      artwork_id: testArtworkId,
      name: 'Middle Layer',
      order_index: 5,
      opacity: 1.0
    };
    const firstLayer = await createLayer(firstInput);
    expect(firstLayer.order_index).toEqual(5);

    // Create layer without order_index - should be next after highest
    const secondInput: CreateLayerInput = {
      artwork_id: testArtworkId,
      name: 'Top Layer',
      opacity: 0.8
    };
    const secondLayer = await createLayer(secondInput);
    expect(secondLayer.order_index).toEqual(6);

    // Create another layer with specific order_index
    const thirdInput: CreateLayerInput = {
      artwork_id: testArtworkId,
      name: 'Bottom Layer',
      order_index: 0,
      opacity: 0.9
    };
    const thirdLayer = await createLayer(thirdInput);
    expect(thirdLayer.order_index).toEqual(0);
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, artworksTable, layersTable } from '../db/schema';
import { type UpdateLayerInput } from '../schema';
import { updateLayer } from '../handlers/update_layer';
import { eq } from 'drizzle-orm';

describe('updateLayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: string;
  let artworkId: string;
  let layerId: string;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test artwork
    const artworkResult = await db.insert(artworksTable)
      .values({
        user_id: userId,
        title: 'Test Artwork',
        width: 32,
        height: 32,
        pixel_data: '{}',
        is_public: true
      })
      .returning()
      .execute();
    artworkId = artworkResult[0].id;

    // Create test layer
    const layerResult = await db.insert(layersTable)
      .values({
        artwork_id: artworkId,
        name: 'Original Layer',
        order_index: 0,
        opacity: 1.0,
        pixel_data: '{}'
      })
      .returning()
      .execute();
    layerId = layerResult[0].id;
  });

  it('should update layer name', async () => {
    const input: UpdateLayerInput = {
      id: layerId,
      name: 'Updated Layer Name'
    };

    const result = await updateLayer(input);

    expect(result.name).toEqual('Updated Layer Name');
    expect(result.id).toEqual(layerId);
    expect(result.order_index).toEqual(0); // Unchanged
    expect(result.opacity).toEqual(1.0); // Unchanged
  });

  it('should update layer order index', async () => {
    const input: UpdateLayerInput = {
      id: layerId,
      order_index: 5
    };

    const result = await updateLayer(input);

    expect(result.order_index).toEqual(5);
    expect(result.name).toEqual('Original Layer'); // Unchanged
  });

  it('should update layer visibility', async () => {
    const input: UpdateLayerInput = {
      id: layerId,
      is_visible: false
    };

    const result = await updateLayer(input);

    expect(result.is_visible).toEqual(false);
    expect(result.name).toEqual('Original Layer'); // Unchanged
  });

  it('should update layer opacity', async () => {
    const input: UpdateLayerInput = {
      id: layerId,
      opacity: 0.5
    };

    const result = await updateLayer(input);

    expect(result.opacity).toEqual(0.5);
    expect(result.name).toEqual('Original Layer'); // Unchanged
  });

  it('should update layer pixel data', async () => {
    const newPixelData = '{"pixels": "new data"}';
    const input: UpdateLayerInput = {
      id: layerId,
      pixel_data: newPixelData
    };

    const result = await updateLayer(input);

    expect(result.pixel_data).toEqual(newPixelData);
    expect(result.name).toEqual('Original Layer'); // Unchanged
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateLayerInput = {
      id: layerId,
      name: 'Multi-Update Layer',
      order_index: 3,
      is_visible: false,
      opacity: 0.7,
      pixel_data: '{"test": "data"}'
    };

    const result = await updateLayer(input);

    expect(result.name).toEqual('Multi-Update Layer');
    expect(result.order_index).toEqual(3);
    expect(result.is_visible).toEqual(false);
    expect(result.opacity).toEqual(0.7);
    expect(result.pixel_data).toEqual('{"test": "data"}');
  });

  it('should update the updated_at timestamp', async () => {
    const input: UpdateLayerInput = {
      id: layerId,
      name: 'Updated Name'
    };

    const originalLayer = await db.select()
      .from(layersTable)
      .where(eq(layersTable.id, layerId))
      .execute();

    const result = await updateLayer(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalLayer[0].updated_at.getTime());
  });

  it('should persist changes to database', async () => {
    const input: UpdateLayerInput = {
      id: layerId,
      name: 'Persisted Update',
      opacity: 0.3
    };

    await updateLayer(input);

    const layers = await db.select()
      .from(layersTable)
      .where(eq(layersTable.id, layerId))
      .execute();

    expect(layers).toHaveLength(1);
    expect(layers[0].name).toEqual('Persisted Update');
    expect(layers[0].opacity).toEqual(0.3);
  });

  it('should throw error for non-existent layer', async () => {
    const input: UpdateLayerInput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Non-existent Layer'
    };

    await expect(updateLayer(input)).rejects.toThrow(/Layer not found/i);
  });
});

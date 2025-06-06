
import { db } from '../db';
import { artworksTable } from '../db/schema';
import { type CreateArtworkInput, type Artwork } from '../schema';

export const createArtwork = async (input: CreateArtworkInput): Promise<Artwork> => {
  try {
    // Insert artwork record
    const result = await db.insert(artworksTable)
      .values({
        user_id: input.user_id,
        title: input.title,
        description: input.description,
        width: input.width,
        height: input.height,
        is_public: input.is_public,
        pixel_data: '{}' // Default empty pixel data as JSON string
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Artwork creation failed:', error);
    throw error;
  }
};

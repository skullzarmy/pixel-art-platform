
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Artwork schema
export const artworkSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  pixel_data: z.string(), // JSON string of pixel data
  thumbnail_url: z.string().nullable(),
  is_public: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Artwork = z.infer<typeof artworkSchema>;

// Layer schema
export const layerSchema = z.object({
  id: z.string(),
  artwork_id: z.string(),
  name: z.string(),
  order_index: z.number().int().nonnegative(),
  is_visible: z.boolean(),
  opacity: z.number().min(0).max(1),
  pixel_data: z.string(), // JSON string of layer pixel data
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Layer = z.infer<typeof layerSchema>;

// Color palette schema
export const colorPaletteSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  colors: z.array(z.string()), // Array of hex color codes
  is_default: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ColorPalette = z.infer<typeof colorPaletteSchema>;

// Input schemas for creating artworks
export const createArtworkInputSchema = z.object({
  user_id: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  width: z.number().int().min(8).max(512),
  height: z.number().int().min(8).max(512),
  is_public: z.boolean().default(false)
});

export type CreateArtworkInput = z.infer<typeof createArtworkInputSchema>;

// Input schemas for updating artworks
export const updateArtworkInputSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  pixel_data: z.string().optional(),
  thumbnail_url: z.string().nullable().optional(),
  is_public: z.boolean().optional()
});

export type UpdateArtworkInput = z.infer<typeof updateArtworkInputSchema>;

// Input schemas for creating layers
export const createLayerInputSchema = z.object({
  artwork_id: z.string(),
  name: z.string().min(1).max(50),
  order_index: z.number().int().nonnegative().optional(),
  opacity: z.number().min(0).max(1).default(1)
});

export type CreateLayerInput = z.infer<typeof createLayerInputSchema>;

// Input schemas for updating layers
export const updateLayerInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50).optional(),
  order_index: z.number().int().nonnegative().optional(),
  is_visible: z.boolean().optional(),
  opacity: z.number().min(0).max(1).optional(),
  pixel_data: z.string().optional()
});

export type UpdateLayerInput = z.infer<typeof updateLayerInputSchema>;

// Input schemas for creating color palettes
export const createColorPaletteInputSchema = z.object({
  user_id: z.string(),
  name: z.string().min(1).max(50),
  colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(1).max(64),
  is_default: z.boolean().default(false)
});

export type CreateColorPaletteInput = z.infer<typeof createColorPaletteInputSchema>;

// Input schemas for updating color palettes
export const updateColorPaletteInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50).optional(),
  colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(1).max(64).optional(),
  is_default: z.boolean().optional()
});

export type UpdateColorPaletteInput = z.infer<typeof updateColorPaletteInputSchema>;

// Query schemas
export const getArtworksByUserInputSchema = z.object({
  user_id: z.string(),
  include_private: z.boolean().default(true)
});

export type GetArtworksByUserInput = z.infer<typeof getArtworksByUserInputSchema>;

export const getPublicArtworksInputSchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0)
});

export type GetPublicArtworksInput = z.infer<typeof getPublicArtworksInputSchema>;

export const getArtworkByIdInputSchema = z.object({
  id: z.string(),
  user_id: z.string().optional() // For checking ownership
});

export type GetArtworkByIdInput = z.infer<typeof getArtworkByIdInputSchema>;

export const deleteArtworkInputSchema = z.object({
  id: z.string(),
  user_id: z.string() // For ownership verification
});

export type DeleteArtworkInput = z.infer<typeof deleteArtworkInputSchema>;

export const deleteLayerInputSchema = z.object({
  id: z.string(),
  user_id: z.string() // For ownership verification through artwork
});

export type DeleteLayerInput = z.infer<typeof deleteLayerInputSchema>;

export const getLayersByArtworkInputSchema = z.object({
  artwork_id: z.string(),
  user_id: z.string().optional() // For ownership verification
});

export type GetLayersByArtworkInput = z.infer<typeof getLayersByArtworkInputSchema>;

export const getUserColorPalettesInputSchema = z.object({
  user_id: z.string()
});

export type GetUserColorPalettesInput = z.infer<typeof getUserColorPalettesInputSchema>;

export const deleteColorPaletteInputSchema = z.object({
  id: z.string(),
  user_id: z.string() // For ownership verification
});

export type DeleteColorPaletteInput = z.infer<typeof deleteColorPaletteInputSchema>;

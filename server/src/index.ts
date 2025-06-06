
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createArtworkInputSchema,
  getArtworksByUserInputSchema,
  getPublicArtworksInputSchema,
  getArtworkByIdInputSchema,
  updateArtworkInputSchema,
  deleteArtworkInputSchema,
  createLayerInputSchema,
  getLayersByArtworkInputSchema,
  updateLayerInputSchema,
  deleteLayerInputSchema,
  createColorPaletteInputSchema,
  getUserColorPalettesInputSchema,
  updateColorPaletteInputSchema,
  deleteColorPaletteInputSchema
} from './schema';

// Import handlers
import { createArtwork } from './handlers/create_artwork';
import { getArtworksByUser } from './handlers/get_artworks_by_user';
import { getPublicArtworks } from './handlers/get_public_artworks';
import { getArtworkById } from './handlers/get_artwork_by_id';
import { updateArtwork } from './handlers/update_artwork';
import { deleteArtwork } from './handlers/delete_artwork';
import { createLayer } from './handlers/create_layer';
import { getLayersByArtwork } from './handlers/get_layers_by_artwork';
import { updateLayer } from './handlers/update_layer';
import { deleteLayer } from './handlers/delete_layer';
import { createColorPalette } from './handlers/create_color_palette';
import { getUserColorPalettes } from './handlers/get_user_color_palettes';
import { updateColorPalette } from './handlers/update_color_palette';
import { deleteColorPalette } from './handlers/delete_color_palette';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Artwork routes
  createArtwork: publicProcedure
    .input(createArtworkInputSchema)
    .mutation(({ input }) => createArtwork(input)),

  getArtworksByUser: publicProcedure
    .input(getArtworksByUserInputSchema)
    .query(({ input }) => getArtworksByUser(input)),

  getPublicArtworks: publicProcedure
    .input(getPublicArtworksInputSchema)
    .query(({ input }) => getPublicArtworks(input)),

  getArtworkById: publicProcedure
    .input(getArtworkByIdInputSchema)
    .query(({ input }) => getArtworkById(input)),

  updateArtwork: publicProcedure
    .input(updateArtworkInputSchema)
    .mutation(({ input }) => updateArtwork(input)),

  deleteArtwork: publicProcedure
    .input(deleteArtworkInputSchema)
    .mutation(({ input }) => deleteArtwork(input)),

  // Layer routes
  createLayer: publicProcedure
    .input(createLayerInputSchema)
    .mutation(({ input }) => createLayer(input)),

  getLayersByArtwork: publicProcedure
    .input(getLayersByArtworkInputSchema)
    .query(({ input }) => getLayersByArtwork(input)),

  updateLayer: publicProcedure
    .input(updateLayerInputSchema)
    .mutation(({ input }) => updateLayer(input)),

  deleteLayer: publicProcedure
    .input(deleteLayerInputSchema)
    .mutation(({ input }) => deleteLayer(input)),

  // Color palette routes
  createColorPalette: publicProcedure
    .input(createColorPaletteInputSchema)
    .mutation(({ input }) => createColorPalette(input)),

  getUserColorPalettes: publicProcedure
    .input(getUserColorPalettesInputSchema)
    .query(({ input }) => getUserColorPalettes(input)),

  updateColorPalette: publicProcedure
    .input(updateColorPaletteInputSchema)
    .mutation(({ input }) => updateColorPalette(input)),

  deleteColorPalette: publicProcedure
    .input(deleteColorPaletteInputSchema)
    .mutation(({ input }) => deleteColorPalette(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();

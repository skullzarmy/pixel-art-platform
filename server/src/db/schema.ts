
import { pgTable, text, timestamp, integer, boolean, real, json, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  display_name: text('display_name'),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const artworksTable = pgTable('artworks', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  pixel_data: text('pixel_data').notNull().default('{}'),
  thumbnail_url: text('thumbnail_url'),
  is_public: boolean('is_public').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('artworks_user_id_idx').on(table.user_id),
  isPublicIdx: index('artworks_is_public_idx').on(table.is_public),
  createdAtIdx: index('artworks_created_at_idx').on(table.created_at)
}));

export const layersTable = pgTable('layers', {
  id: uuid('id').primaryKey().defaultRandom(),
  artwork_id: uuid('artwork_id').notNull().references(() => artworksTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order_index: integer('order_index').notNull().default(0),
  is_visible: boolean('is_visible').notNull().default(true),
  opacity: real('opacity').notNull().default(1.0),
  pixel_data: text('pixel_data').notNull().default('{}'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  artworkIdIdx: index('layers_artwork_id_idx').on(table.artwork_id),
  orderIdx: index('layers_order_idx').on(table.artwork_id, table.order_index)
}));

export const colorPalettesTable = pgTable('color_palettes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  colors: json('colors').$type<string[]>().notNull(),
  is_default: boolean('is_default').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('color_palettes_user_id_idx').on(table.user_id)
}));

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  artworks: many(artworksTable),
  colorPalettes: many(colorPalettesTable)
}));

export const artworksRelations = relations(artworksTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [artworksTable.user_id],
    references: [usersTable.id]
  }),
  layers: many(layersTable)
}));

export const layersRelations = relations(layersTable, ({ one }) => ({
  artwork: one(artworksTable, {
    fields: [layersTable.artwork_id],
    references: [artworksTable.id]
  })
}));

export const colorPalettesRelations = relations(colorPalettesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [colorPalettesTable.user_id],
    references: [usersTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  artworks: artworksTable,
  layers: layersTable,
  colorPalettes: colorPalettesTable
};

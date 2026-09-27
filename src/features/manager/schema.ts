import { z } from 'zod';

/** Taste profile scale: 0 (none — e.g. strength of a mocktail) to 3. */
export const tasteProfileSchema = z
  .object({
    labels: z.array(z.string().trim().min(1).max(40)).min(1).max(8),
    values: z.array(z.number().int().min(0).max(3)),
  })
  .refine((p) => p.labels.length === p.values.length, { message: 'Кожна мітка профілю потребує значення.' });

export const producerSchema = z.object({
  uniqueness: z.string().max(2000),
  facilities: z.string().max(2000),
  rawMaterials: z.string().max(2000),
});

/**
 * Everything a manager (or the seed script) can write to a menu item. Lengths mirror the
 * CHECK constraints in supabase/migrations/0001_init.sql.
 */
export const menuItemInputSchema = z.object({
  legacyId: z.string().max(100).nullable(),
  subcategoryId: z.number().int().positive(),
  title: z.string().trim().min(1, 'Вкажіть назву.').max(200),
  anchor: z.string().trim().max(200),
  ingredients: z.string().trim().max(2000),
  sales: z.string().trim().max(2000),
  interestingFact: z.string().trim().max(2000).nullable(),
  pairing: z.string().trim().max(1000).nullable(),
  allergens: z.array(z.string().trim().toLowerCase().min(1).max(40)),
  grapeVarieties: z.string().trim().max(200).nullable(),
  sweetness: z.string().trim().max(60).nullable(),
  tasteProfile: tasteProfileSchema.nullable(),
  producer: producerSchema.nullable(),
  isBestseller: z.boolean(),
  isFinalist: z.boolean(),
  isActive: z.boolean(),
  sort: z.number().int(),
  photoPath: z.string().max(300).nullable(),
});

export type MenuItemInput = z.infer<typeof menuItemInputSchema>;

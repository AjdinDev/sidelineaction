import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const isoDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day;
  }, 'Gebruik een geldige datum in het formaat JJJJ-MM-DD.');

const shoots = defineCollection({
  loader: glob({
    base: './src/content/shoots',
    pattern: '**/*.{md,mdx}',
  }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    type: z.string().min(1),
    location: z.string().min(1),
    date: z.preprocess(
      (value) => {
        if (value === '' || value === null) return undefined;
        if (value instanceof Date) return value.toISOString().slice(0, 10);
        return value;
      },
      isoDate.optional(),
    ),
    intro: z.string().min(1),
    published: z.boolean().default(true),
    order: z.number().int().min(0).default(0),
    cover: image(),
    photos: z.array(image()).min(1),
  }),
});

export const collections = { shoots };

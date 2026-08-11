import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const crew = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/crew' }),
  schema: z.object({
    // Filename in data/actors/. Absent means a flavor-only member with no stat strip.
    export: z.string().optional(),
    displayName: z.string(),
    role: z.string().optional(),
    initials: z.string(),
    tagline: z.string(),
    portrait: z.string().optional(),
    languages: z.array(z.string()).default([]),
    status: z.enum(['active', 'former', 'deceased']),
    order: z.number(),
  }),
});

export const collections = { crew };

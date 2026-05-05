import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './posts' }),
  schema: z.object({
    title: z.string(),
    date: z.union([z.string(), z.date()]).optional().transform(v => {
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      return v;
    }),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    summary: z.string().optional().default(''),
    description: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    featured: z.boolean().optional().default(false),
    cover: z.string().optional(),
    updated: z.union([z.string(), z.date()]).optional().transform(v => {
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      return v;
    }),
    series: z.string().optional(),
    order: z.number().optional(),
    layout: z.string().optional(),
    showInNav: z.boolean().optional(),
    display: z.object({
      defaultView: z.string().optional(),
      density: z.string().optional(),
      showTimeline: z.boolean().optional(),
    }).optional(),
    // Work-specific
    stack: z.array(z.string()).optional(),
    links: z.object({
      github: z.string().optional(),
      demo: z.string().optional(),
      docs: z.string().optional(),
    }).optional(),
    workStatus: z.enum(['active', 'maintained', 'archived', 'concept']).optional(),
  }),
});

export const collections = { posts };

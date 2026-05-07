---
name: blog-frontend-bootstrap
description: Bootstrap a complete custom frontend for the Quiet Archive project from the stable API layer. Use this skill when the user wants an AI agent to generate, redesign, or rebuild the blog frontend while keeping the API and scripts untouched.
license: Complete terms in LICENSE.txt
---

This skill turns the Quiet Archive project into an API-first frontend generation workflow. The project is expected to keep `src/api/*`, `scripts/*`, content schemas, and static JSON endpoints as the stable core; generated pages, layouts, components, and styles are the flexible surface.

Use this skill when the user asks to:

- build a new blog frontend from scratch;
- redesign the current blog frontend;
- generate a theme, layout system, or page set for this project.

## Core Principle

The frontend is the generated presentation layer. The API layer is the stable foundation.

Guide the agent to build foreground pages by using the project-provided API, content model, documentation, and assets. Do not prescribe a fixed page/component/layout/style file set. The agent should design an appropriate frontend structure for the requested experience.

Frontend-facing development normally happens in these areas:

- `src/pages` for Astro routes and page composition, while preserving `src/pages/api/**`;
- `src/components` for reusable UI building blocks when useful;
- `src/layouts` for shared document or page shells when useful;
- `src/styles` for global styles, design tokens, prose styles, themes, or other styling strategy chosen by the agent.

If there are no relevant folders, please create new ones.

These directories are working areas, not templates. Do not assume the current files inside them are canonical. Inspect them only to understand the existing project state, then decide whether to extend, reorganize, or replace the presentation layer according to the user's goal.

Generated frontend work must not modify unless explicitly requested:

- `src/api/**`;
- `scripts/**`;
- `src/content.config.ts`;
- `posts/**`;
- static API route files under `src/pages/api/**`.

If the user asks to reset or remove the default frontend, preserve `src/pages/api/**` and the stable core. Choose a cleanup strategy appropriate to the current repository state instead of blindly applying a fixed command.

## Required Discovery Flow

Before generating pages, collect or infer the following product decisions. If the user already provided enough information, do not ask again; summarize the decisions and proceed.

1. **Site identity**
   - Site name.
   - One-line tagline.
   - Author or persona name if it should appear in the UI.
   - Preferred language and tone.

2. **Visual direction**
   - Pick a strong aesthetic direction, not a generic theme.
   - Examples: editorial archive, brutalist lab notebook, quiet library, retro terminal, art-book portfolio, dense knowledge dashboard, soft personal journal, industrial technical manual.
   - Define typography mood, color mood, density, and memorable visual motif.

3. **Capability selection**
   Offer the user a small menu based on the stable API capabilities below. Recommend a sensible default if the user does not choose.

4. **Content presentation strategy**
   - Decide how to use type metadata: `displayView`, `density`, `order`, and `showInNav`.
   - Decide how directory pages, article pages, tag pages, and search should feel.
   - Decide whether placeholder images should be decorative atmosphere, content-card covers, gallery material, or layout stress tests.

5. **Implementation scope**
   - Minimum viable frontend: layout, home page, type index, detail page, archive, search.
   - Expanded frontend: tags, stats, categories, directory tree, featured sections, keyboard-search island, TOC, prev/next navigation.

## Stable API Capability Map

Use these APIs instead of reimplementing content discovery.

### Internal TypeScript APIs for Astro pages

From `src/api/content.ts`:

- `discoverTypes()` — discover all content type sections from `posts/`.
- `getNavTypes()` — nav-visible type sections.
- `getAllEntries()` — all published non-directory entries.
- `getAllEntriesWithDirectories()` — all published entries including README directory pages.
- `getAllDirectoryEntries()` — all published directories, including inferred fallback directories.
- `getEntriesByType(typeSlug)` — entries under one type.
- `getEntriesInDir(dirPath)` — direct entries in one directory.
- `getSubDirectories(dirPath)` — direct child directories.
- `getDirectoryMeta(dirPath)` — README metadata for a directory.
- `getDirectoryListing(dirPath, { page, pageSize })` — direct child directories and paginated direct entries.
- `getDirectoryTitleMap()` — directory path to title map for breadcrumbs.
- `getRecentEntries(limit)` — newest published entries.
- `getFeaturedEntries()` — featured entries.
- `getEntriesByTag(tag)` — entries with a tag.
- `getEntryByUri(uri)` — entry metadata by final URI.
- `paginate(items, page, pageSize)` — generic pagination helper.

From `src/api/navigation.ts`:

- `getBreadcrumb(uri)` — breadcrumb chain.
- `getPrevNext(uri, typeSlug)` — previous and next entry in the same type.
- `getTableOfContents(headings)` — h2-h4 table of contents from Astro headings.

From `src/api/stats.ts`:

- `getArchiveStats()` — total count, count by type, latest update, and tag frequency.

From `src/api/assets.ts`:

- `resolveAssetSrc(path)` — resolve local `assets/` cover paths to build-safe URLs.

### Static JSON APIs for browser islands or external clients

- `/api/types.json` — content type metadata.
- `/api/entries.json` — all published entries.
- `/api/entry/<uri>.json` — one entry plus Markdown body.
- `/api/tree.json` — archive tree.
- `/api/stats.json` — archive statistics.
- `/api/tags.json` — tag frequency.
- `/search-index.json` — search index with tokenized text.

Static pages should prefer internal TypeScript APIs. Client-side interactive islands may fetch static JSON files when needed, especially for search.

## Recommended Capability Menu for Users

When helping the user choose capabilities, present concise options like this:

- **Core pages**: home, type landing pages, content detail pages, archive.
- **Navigation**: top nav from `getNavTypes()`, breadcrumbs from `getBreadcrumb()`, prev/next from `getPrevNext()`.
- **Discovery**: recent entries, featured entries, tag cloud, type filters, directory drill-down.
- **Search**: static client search using `/search-index.json`; optional keyboard shortcut.
- **Knowledge dashboard**: stats from `getArchiveStats()`, content counts by type, recent update, popular tags.
- **Long-form reading**: `.prose` wrapper, TOC from `getTableOfContents(headings)`, reading-focused detail layout.
- **Visual media**: local placeholder images from `assets/placeholders` for cards, hero compositions, galleries, and responsive layout testing.

Default recommendation for most users:

- home;
- type landing pages;
- content detail page;
- archive page;
- search page;
- tags or categories page;
- stats block on home;
- breadcrumbs and prev/next on detail pages.

## Content and Field Boundaries

Do not invent content types, routes, frontmatter fields, or data relationships. Use these known fields from `ContentEntry` and `TypeMeta`:

- `ContentEntry`: `id`, `uri`, `typeSlug`, `dirPath`, `title`, `date`, `status`, `summary`, `description`, `tags`, `featured`, `cover`, `updated`, `series`, `order`, `isDirectory`.
- `TypeMeta`: `slug`, `title`, `description`, `displayView`, `density`, `order`, `showInNav`.
- `DisplayView`: `archive`, `timeline`, `cards`, `book`, `qa`, `project`, `gallery`.

Additional content schema fields may exist for specific content, such as `stack`, `links`, and `workStatus`, but do not make the whole frontend depend on them unless the content actually contains them.

### Cover Image Handling

The `cover` field stores the author's declared image path, not necessarily the final build-safe image URL.

Recommended authoring format:

```yaml
cover: assets/covers/my-post.png
```

When rendering covers in Astro pages or components, always resolve the value through `resolveAssetSrc()` from `src/api/assets.ts`:

```ts
const coverSrc = resolveAssetSrc(entry.cover);
```

Do not pass `entry.cover` directly to `<img src>` unless it is already an external `http(s)` URL. `resolveAssetSrc()` handles local `assets/` imports and returns the Astro build output URL.

## Placeholder Image Guidance

The project includes local placeholder images under `assets/placeholders`. Read `assets/placeholders/image-ratios.md` before using them.

Available placeholder ratios:

- `download-1.png` — about 16:9, good for hero banners and wide cards.
- `download-4.png` — about 16:10, good for monitor-like panels.
- `download-3.png` — 3:2, good for editorial cards.
- `download.png` — about 4:3, good for classic cards.
- `download-2.png` — about 4:5, good for portrait or magazine layouts.
- `download-5.png` — 1:1, good for square avatars, tiles, and mosaics.

Use placeholder images intentionally:

- to prototype visual rhythm when real covers are absent;
- to stress-test responsive card grids;
- to add atmosphere to generated themes;
- to demonstrate how `cover` images should behave.

Prefer real `entry.cover` when it exists. Use placeholders only as fallback or decorative design material. Reference local assets with paths like `/assets/placeholders/download-1.png`, and keep `alt` text meaningful or empty only when decorative.

## Design System Rules

Follow the existing `frontend-design` skill when high-end visual design is needed. These rules are mandatory for this project:

- Use Astro for static markup.
- Use Preact islands only when interaction is necessary.
- Do not add SSR adapters or runtime server requirements unless explicitly requested.
- Keep pages static-first and buildable with `astro build`.
- Establish a clear design-token strategy for colors, spacing, radii, shadows, typography, motion, and layering.
- Keep theme variants variable-driven instead of scattering one-off values across components.
- Do not hardcode colors, spacing, radii, shadows, durations, or z-index values in components when they should belong to the chosen design system.
- Use `.prose` for rendered long-form Markdown content.
- Respect `prefers-reduced-motion` for non-trivial animation.
- Keep accessibility non-negotiable: semantic HTML, correct headings, focus states, keyboard access, useful `aria-*` only where appropriate.
- Avoid generic AI aesthetics: no default purple gradient SaaS look, no indistinct card grids, no generic font pairing unless it is an intentional project choice.

## Frontend Organization Guidance

Do not copy a pre-defined file architecture. Design the frontend organization from the selected experience, content model, and interaction needs.

Use the foreground development areas by responsibility:

- `src/pages`: define Astro routes, static paths, page-level data loading, and page composition. Preserve `src/pages/api/**`.
- `src/components`: place reusable UI pieces only when reuse or clarity justifies extraction.
- `src/layouts`: place shared shells only when multiple pages benefit from the same document structure.
- `src/styles`: place the chosen styling system, such as global CSS, design tokens, themes, prose styles, or view-specific styles.

The agent should decide names, boundaries, and file count based on the final design. A small frontend can use fewer files; a richer frontend can use more. Avoid creating generic components just to satisfy a template.

Prefer an organization that makes the generated frontend easy to read, change, and delete. It should demonstrate how to consume the stable API layer, not replicate a previous visual implementation.

## Page Generation Requirements

### Home page

Use a clear editorial concept. Usually combine:

- site identity and tagline;
- featured entries from `getFeaturedEntries()`;
- recent entries from `getRecentEntries()`;
- content type overview from `getNavTypes()` or `discoverTypes()`;
- stats from `getArchiveStats()`;
- optional placeholder image composition if it supports the chosen aesthetic.

### Type landing pages

Use dynamic routes. Build static paths from `discoverTypes()` or `getNavTypes()` and render entries from `getEntriesByType(typeSlug)`. Reflect `displayView` and `density` where useful:

- `archive`: clean list;
- `timeline`: date-centered stream;
- `cards`: card grid;
- `book`: chapter or series structure;
- `qa`: question-answer oriented list;
- `project`: project log timeline;
- `gallery`: image-forward grid.

When a type contains nested directories, do not flatten every descendant entry into one list by default. Prefer this order:

1. Show direct child directories from `getSubDirectories(typeSlug)` first, as navigable section cards with title, summary/description, and a clear affordance to enter the section.
2. Show direct non-directory entries from `getEntriesInDir(typeSlug)` after the directory cards.
3. If there are no child directories, a flat list from `getEntriesByType(typeSlug)` is acceptable.

### Directory and subdirectory pages

Directory pages come from `README.md` entries where `entry.isDirectory` is `true`. They can appear at any nested URL depth, depending on the user's `posts/` structure.

When generating nested content routes, the agent should support a directory-page experience, not render directories as normal articles. A good directory page usually includes:

- breadcrumbs from `getBreadcrumb(entry.uri)`;
- directory title and summary/description from the README frontmatter;
- README body rendered as introductory `.prose` content when present;
- child directory cards from `getSubDirectories(entry.dirPath)`;
- direct child content entries from `getEntriesInDir(entry.dirPath)`.

In a catch-all route such as `[...slug].astro`, include both content entries and directory entries in `getStaticPaths()`, then choose the layout by `entry.isDirectory`:

```astro
---
const isDirectory = entry.isDirectory;
---

{isDirectory ? (
  <DirectoryLayout entry={entry} />
) : (
  <ContentLayout entry={entry} headings={headings}>
    {Content && <Content />}
  </ContentLayout>
)}
```

Top-level type pages may be handled separately by `[type]/index.astro`; deeper README directory pages should be handled by the catch-all route.

### Detail pages

Use dynamic routes and render Markdown or MDX content through Astro content collections. Add:

- breadcrumb;
- title, date, updated date, tags, summary;
- optional cover resolved with `resolveAssetSrc()`;
- `.prose` wrapper for the body;
- table of contents when headings exist;
- prev/next navigation when useful.

### Archive, tags, and stats

Use `getAllEntries()`, `getArchiveStats()`, and `getEntriesByTag(tag)` or client-side filtering. Keep everything static and link to canonical `entry.uri`.

### Search

For static search, use a small Preact island that fetches `/search-index.json`. Recommended field weighting:

`title(10) > tags(6) > summary(5) > headings(4) > body(1)`.

Keep the search UI keyboard accessible. Do not hydrate the whole page.

## BaseLayout Adaptation

The project provides a clean `src/layouts/BaseLayout.astro` as the foundational HTML shell. When generating the frontend, the agent should:

1. **Extend, not replace** `BaseLayout.astro`. It provides the document skeleton: `<html>`, `<head>` (with meta, OG tags, theme script), and `<body>` with a `<slot />`.
2. **Build page-level layouts on top of it**. For example, create a `ContentLayout.astro` that wraps `BaseLayout` and adds navigation, sidebar, footer, or prose wrappers.
3. **Respect the theme mechanism**: The base layout reads `data-theme` from `localStorage` key `theme`. Generated components should use CSS custom properties that respond to `[data-theme="dark"]` and `[data-theme="light"]`.
4. **Pass props correctly**: `title`, `description`, `ogImage`, and `type` are the available props. Pages should always pass meaningful `title` and `description`.
5. **Do not duplicate head content**: The base layout already handles charset, viewport, generator, color-scheme, canonical URL, and OG tags. Do not re-declare these in page-level layouts.

If the base layout needs modification (e.g., adding a font link, a global script, or structured data), the agent may edit it — but should keep it minimal and generic. Project-specific visual choices belong in page layouts or global styles, not in the base shell.

## Understanding the Posts Content Model

The `posts/` directory is the single source of truth for all content. Understanding its structure is critical before generating any frontend.

### Key Rules

1. **Type columns are direct children of `posts/`**: Each folder like `posts/article/`, `posts/note/`, `posts/column/` defines a content type. The folder name becomes the type slug and the first URL segment.

2. **`README.md` is the directory page**: Every directory (at any depth) can have a `README.md` that serves as its landing/index page. Its frontmatter defines metadata for that directory section (title, description, display preferences, navigation visibility).

3. **Non-README `.md` files are content entries**: Their filename (minus `.md`) becomes the slug. The full URI is derived from the file's path relative to `posts/`.

4. **Nesting is unlimited but recommended ≤ 5 levels**: Subdirectories represent topics, series, volumes, or any logical grouping. Each level can have its own `README.md`.

5. **URI derivation examples**:
   - `posts/article/foo.md` → `/article/foo`
   - `posts/article/README.md` → `/article` (directory page)
   - `posts/column/quiet-engineering/README.md` → `/column/quiet-engineering`
   - `posts/column/quiet-engineering/fundamentals/bar.md` → `/column/quiet-engineering/fundamentals/bar`

6. **`status` field controls visibility**: Only `published` entries appear in routes, indexes, search, and APIs. `draft` and `archived` are filtered out at build time.

7. **`about.md` is special**: `posts/about.md` sits at the root of `posts/` and is typically consumed by a dedicated `/about` page route, not by the type-based routing system.

### Display Metadata

Directory `README.md` files can declare `display.defaultView` to hint how their children should be presented:

- `archive` — chronological list (default)
- `timeline` — date-centered stream
- `cards` — card grid
- `book` — chapter/series structure
- `qa` — question-answer format
- `project` — project timeline
- `gallery` — image-forward grid

The frontend should read and respect these hints when rendering type landing pages and directory pages.

### Navigation

- `showInNav: true` in a type-column README means it should appear in the site's primary navigation.
- `order` controls the sort position in navigation and listings.
- The API function `getNavTypes()` returns only types with `showInNav: true`, pre-sorted by `order`.

### Content for Testing

The project ships with demo content across multiple paths and depths for frontend development and testing:

```
posts/
├── about.md                                          → /about
├── article/
│   ├── README.md                                     → /article
│   ├── filesystem-as-database.md                     → /article/filesystem-as-database
│   └── good-enough-engineering.md                    → /article/good-enough-engineering
├── note/
│   ├── README.md                                     → /note
│   └── cognitive-cost-of-tool-choices.md             → /note/cognitive-cost-of-tool-choices
└── column/
    ├── README.md                                     → /column
    └── quiet-engineering/
        ├── README.md                                 → /column/quiet-engineering
        └── fundamentals/
            ├── README.md                             → /column/quiet-engineering/fundamentals
            ├── what-is-quiet-software.md             → /column/quiet-engineering/fundamentals/what-is-quiet-software
            └── boring-technology-manifesto.md        → /column/quiet-engineering/fundamentals/boring-technology-manifesto
```

This structure exercises: multiple type columns, nested directories (3 levels deep), directory pages at every level, and varied `displayView` settings (`archive`, `timeline`, `book`).

## Agent Workflow

When executing this skill:

1. Read `docs/content-authoring.md` and `docs/architecture-overview.md` to understand the content model and data flow.
2. Inspect existing project files as needed: `src/layouts/BaseLayout.astro`, `src/api/*`, `src/content.config.ts`, `assets/placeholders/image-ratios.md`, and the current `posts/` structure.
3. Ask at most one concise round of questions if site identity, visual direction, or capabilities are missing.
4. If the user wants a quick start, use the default capability set and proceed.
5. Create or replace frontend files without touching the stable core. Build page layouts on top of `BaseLayout.astro`.
6. Run the available project checks, normally `npm run build` or `npm run check` if appropriate.
7. Fix introduced errors within the generated frontend. Do not rewrite API code to hide frontend mistakes.
8. Summarize generated pages, selected capabilities, and any assumptions.

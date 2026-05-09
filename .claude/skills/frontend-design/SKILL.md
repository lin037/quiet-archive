---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications for this blog project. Generates creative, polished code that avoids generic AI aesthetics and respects the project's content / API contracts.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Project Contract (Must Read for this repo)

When this skill is used inside the blog project, **treat the following as hard constraints**:

1. **Data layer is stable core** — never modify `src/api/*` or `scripts/*` when generating pages. Pages should only CALL the API functions listed in `docs/api-reference.md`, not reimplement data fetching.
2. **Filesystem is the source of truth** — do not invent new content types, URIs, or frontmatter fields. Types come from `posts/<type>/README.md`. Everything discoverable from `src/api/content.ts`.
3. **Static-first** — pages must build as pure static HTML. Do NOT add Node adapter, SSR, or runtime server-only code unless explicitly asked.
4. **Accessibility is non-negotiable** — semantic HTML, proper heading hierarchy, `aria-*` where needed, keyboard navigation for interactive islands, `prefers-reduced-motion` respected.
5. **Island model** — Use `.astro` for static markup, Preact islands (`client:load` / `client:visible`) only when interactivity is required. Do not hydrate what doesn't need to be hydrated.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

Then implement working code that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

## Styling System Rules (Strict for this repo)

### 1. Design Tokens are Single Source of Truth

Place every design primitive (color, font, spacing, radius, shadow, duration, easing, z-index) in `src/styles/tokens.css` as CSS custom properties. Pages and components MUST NOT hardcode these values.

```css
/* src/styles/tokens.css */
:root {
  /* Colors — define in pairs for light/dark */
  --color-bg: #fcfcfb;
  --color-bg-elevated: #ffffff;
  --color-bg-alt: #f4f4f2;
  --color-text: #0e0e0c;
  --color-text-secondary: #37352f;
  --color-text-tertiary: #8a857b;
  --color-border: #d9d7d2;
  --color-border-light: #ececea;
  --color-accent: #1f8a4c;
  --color-accent-bg: rgba(31, 138, 76, 0.08);

  /* Typography */
  --font-display: 'Cormorant Garamond', 'Noto Serif SC', serif;
  --font-body: 'Newsreader', 'Noto Serif SC', serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 2.5rem;

  --tracking-tight: -0.01em;
  --tracking-wide: 0.04em;

  /* Spacing (geometric-ish scale) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Motion */
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* Layout */
  --page-width: 56rem;
  --content-width: 42rem;
  --gutter: 1.5rem;
}
```

### 2. Dark Mode is MANDATORY and Variable-Driven

Never write hex colors in pages/components. All colors must reference `var(--color-*)` so switching theme is **one attribute change**:

```css
:root[data-theme='dark'] {
  --color-bg: #0b0b0a;
  --color-bg-elevated: #141412;
  --color-bg-alt: #1b1b18;
  --color-text: #f2f1ec;
  --color-text-secondary: #c7c5bc;
  --color-text-tertiary: #8a857b;
  --color-border: #2b2a26;
  --color-border-light: #1f1e1b;
  --color-accent: #7fcf9f;
  --color-accent-bg: rgba(127, 207, 159, 0.12);
}
```

The existing theme toggle in `Header.astro` flips `document.documentElement.dataset.theme`. Every new component you write must look correct under **both** themes with zero extra code changes.

### 3. Accent Color Philosophy

Accent color exists only for: links, selected state, focus rings, small emphasis dots, small stat highlights. **Never paint large fills with accent color.** Treat accent like punctuation, not paragraph color.

### 4. CSS Organization

- **`src/styles/tokens.css`** — variables only, no selectors other than `:root` / `:root[data-theme='dark']`
- **`src/styles/global.css`** — element defaults (`body`, `a`, `img`), reset-ish
- **`src/styles/prose.css`** — long-form article typography (the `.prose` class)
- **Component styles** — colocated in the `.astro` file via `<style>` blocks; use `is:global` sparingly and only for child-selector patterns
- No Tailwind, no CSS-in-JS — plain CSS with variables, scoped via Astro's default scoping

### 5. Prose / Long-form Typography

Long-form content uses `.prose` class (already set up in `styles/prose.css`). Any article/note/column detail page should wrap rendered markdown in `<div class="prose">…</div>`. When extending prose styles, prefer adding to `prose.css` over per-page overrides.

### 6. Responsive

- Content-first breakpoints, not device-first
- Always use `max-width: Npx` media queries with intentional break values
- Typography should scale gracefully (use `clamp()` where appropriate)
- Test at 360 / 768 / 1024 / 1440 widths mentally before shipping

### 7. Animation & Motion

- **Always** wrap non-trivial animation in `@media (prefers-reduced-motion: no-preference)`
- Micro-interactions: 150-250ms with `var(--ease-out)`
- Page transitions (if any): 300-500ms
- Avoid animating `width`, `height`, `top`, `left` — use `transform` + `opacity`
- Stagger reveals via `animation-delay` or CSS custom properties indexed by element

### 8. Images & Assets

- Store local images under `public/assets/`; reference them with absolute runtime paths like `/assets/...`
- Files outside `public/assets/` are not served at `/assets/...` and can become 404 after build or deployment
- For content covers, use `resolveAssetSrc(entry.cover)` before passing values to `<img src>`
- Never use external image URLs in production pages unless explicitly required

## Component Checklist Before Shipping

Every component you generate must pass this mental checklist:

- [ ] Uses `var(--*)` tokens, no hardcoded colors/spacing
- [ ] Looks correct in both light and dark theme
- [ ] Semantic HTML (`<article>`, `<nav>`, `<time>`, `<section>`…)
- [ ] All interactive elements reachable via keyboard, have focus styles
- [ ] Images have `alt`; SVGs have `aria-hidden` or `<title>`
- [ ] No layout shift on load (fixed aspect ratios, font-display: swap set at layout)
- [ ] `prefers-reduced-motion` respected for any animation
- [ ] No client-side JS unless required → then use Preact island with minimal bundle
- [ ] Data comes from `src/api/*`, not from new ad-hoc content parsing

## Reminder

Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision — but always within the project's stable-core / flexible-surface contract.
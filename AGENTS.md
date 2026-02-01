# AGENTS.md

Guidelines for AI agents working on the Tekkipodi website project.

## Project Overview

Tekkipodi is a Finnish podcast website about technology, AI, and startups. It uses Eleventy (11ty) as a static site generator with Nunjucks templates and Markdown content. The project includes an automation tool for converting podcast audio into blog posts.

## Tech Stack

- **Static Site Generator:** Eleventy 2.0.1
- **Templates:** Nunjucks (.njk)
- **Content:** Markdown with YAML frontmatter
- **Styling:** Plain CSS with component-based architecture
- **Formatter:** Prettier

## Project Structure

```
src/                    # Website source files
├── _includes/layouts/  # Nunjucks templates (base.njk, homepage.njk, blog-post.njk)
├── _data/site.js       # Global site data (title, links, podcast URLs)
├── blog/               # Markdown episode posts (001-007)
├── css/
│   ├── base/           # Reset styles
│   ├── components/     # Component CSS (header, hero, episode-list, etc.)
│   └── helpers/        # Utilities (colors, typography, spacings, animations)
├── images/             # Static assets
└── index.md            # Homepage content

tool/                   # CLI tool for podcast-to-blog conversion
├── index.js            # Main tool (uses OpenAI for transcription/summarization)
└── README.md           # Tool documentation

_site/                  # Generated output (do not edit)
```

## Commands

```bash
npm install             # Install dependencies
npm start               # Start dev server at localhost:8080
npm run serve           # Same as npm start
npm run build           # Build static site to _site/
```

## Code Conventions

- **Indentation:** 2 spaces (enforced by .editorconfig and .prettierrc.json)
- **File naming:** kebab-case for files and CSS classes
- **JavaScript:** camelCase for variables and functions
- **Language:** Finnish for content, English for code/comments
- **CSS classes:** BEM-like naming in components

## Content Guidelines

### Blog Posts (Episodes)

Blog posts are in `src/blog/` with this frontmatter structure:

```yaml
---
layout: layouts/blog-post.njk
title: "Episode Title"
description: "Brief description"
date: 2025-11-15
spotify_url: https://open.spotify.com/episode/...
length: "1h 23min"
---
```

Episode numbers are in the filename (e.g., `001-first-episode.md`).

### Adding a New Page

Create a `.md` file in `src/` with:

```yaml
---
layout: layouts/base.njk
title: "Page Title"
---
```

## Eleventy Configuration

Key settings in `.eleventy.js`:
- Input directory: `src/`
- Output directory: `_site/`
- Blog collection sorted by date (newest first)
- Custom `dateFormat` filter with formats: "MMMM d, yyyy", "MMM d, yyyy", "iso"
- Pass-through copy for CSS, JS, and images

## CSS Architecture

CSS uses a component-based structure:
- `css/base/reset.css` - CSS reset
- `css/helpers/` - Variables and utilities (colors.css, typography.css, spacings.css, animations.css)
- `css/components/` - Individual components (header.css, hero.css, episode-list.css, etc.)
- `css/style.css` - Main entry point that imports all files

Color scheme:
- Primary: #1e1e1e (black)
- Secondary: #ffffff (white)
- Accent: #4ec9b0 (teal)

## Tool Directory

The `tool/` directory contains a CLI for generating blog posts from podcast audio:

```bash
cd tool
npm install
node index.js -m episode.mp3 -n notes.txt
```

Requires:
- `OPENAI_API_KEY` environment variable
- ffmpeg installed on system

See `tool/README.md` for full documentation.

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `GUESTBOOK_WIDGET_URL` - URL to guestbook widget service

## Testing

No automated tests. Verify changes by:
1. Running `npm start`
2. Checking localhost:8080 in browser
3. Testing responsive layouts

## Common Tasks

### Add a new episode
1. Create `src/blog/NNN-episode-title.md` with proper frontmatter
2. Or use the tool: `cd tool && node index.js -m audio.mp3 -n notes.txt`

### Modify site metadata
Edit `src/_data/site.js` for title, tagline, and podcast links.

### Change layout/styling
- Templates: `src/_includes/layouts/`
- CSS: `src/css/components/` for components, `src/css/helpers/` for variables

### Build for production
Run `npm run build` - output goes to `_site/`

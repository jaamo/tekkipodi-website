# Tekkipodi Website

A static website generated with [Eleventy](https://www.11ty.dev/) and markdown files.

## Features

- ✅ Static site generation with Eleventy
- ✅ Markdown support for content
- ✅ Nunjucks templates for layouts
- ✅ Modern, clean styling
- ✅ Easy to customize and extend

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Start the development server with live reload:
```bash
npm run serve
```

The site will be available at `http://localhost:8080`

### Building for Production

Build the static site:
```bash
npm run build
```

The generated site will be in the `_site` directory.

## Project Structure

```
tekkipodi-website/
├── src/                    # Source files
│   ├── _includes/         # Templates and layouts
│   │   └── layouts/       # Layout templates
│   ├── blog/              # Blog posts (markdown)
│   ├── css/               # Stylesheets
│   ├── index.md           # Homepage
│   └── about.md           # About page
├── _site/                 # Generated site (created after build)
├── .eleventy.js           # Eleventy configuration
└── package.json           # Dependencies and scripts
```

## Adding Content

### Creating a New Page

Create a new `.md` file in the `src/` directory with front matter:

```markdown
---
layout: layouts/base.njk
title: Page Title
description: Page description
---

# Your Content Here

Write your content in markdown...
```

### Creating a Blog Post

Create a new `.md` file in the `src/blog/` directory:

```markdown
---
layout: layouts/base.njk
title: Blog Post Title
description: Post description
date: 2024-01-15
---

# Blog Post Title

Your blog post content...
```

## Customization

- **Layouts**: Edit `src/_includes/layouts/base.njk` to customize the page structure
- **Styles**: Edit `src/css/style.css` to customize the appearance
- **Configuration**: Edit `.eleventy.js` to change Eleventy settings

## License

MIT


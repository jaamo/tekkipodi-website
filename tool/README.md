# Tekkipodi Tool

CLI tool to convert MP3 podcast episodes to 11ty markdown blog posts using OpenAI's Whisper API for transcription and GPT-4 for summarization.

## Installation

```bash
cd tool
npm install
```

## Setup

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY=your-api-key-here
```

Or add it to your `.env` file (you'll need to use a package like `dotenv` if you want to load from `.env`).

## Usage

```bash
node index.js -m <mp3-file> -n <notes-file> [options]
```

Note: Max file size for mp3 file is 25 MB.

### Required Arguments

- `-m, --mp3 <path>` - Path to MP3 audio file
- `-n, --notes <path>` - Path to notes file (text file containing links and additional notes)

### Optional Arguments

- `-o, --output <path>` - Output markdown file path (default: `../src/blog/[date]-[title].md`)
- `-s, --spotify <url>` - Spotify episode URL
- `-l, --length <length>` - Episode length (e.g., "25 min")
- `-t, --title <title>` - Episode title (if not provided, will be auto-generated)
- `-d, --date <date>` - Episode date in YYYY-MM-DD format (default: today)
- `-h, --help` - Display help
- `-V, --version` - Display version

### Example

```bash
node index.js \
  -m ../episodes/episode-001.mp3 \
  -n ../episodes/episode-001-notes.txt \
  -s https://open.spotify.com/episode/example \
  -l "25 min" \
  -t "001 - Steam Machine ja maailmamallit"
```

## Notes File Format

The notes file should be a plain text file. Any URLs in the file will be automatically extracted and added as sources in the blog post.

Example notes file:
```
Links:
- https://example.com/article1
- https://example.com/article2

Additional notes:
- Key point about topic X
- Reference to study Y
```

## Output

The tool generates an 11ty markdown file with:
- Frontmatter including title, description, date, Spotify link, and length
- Blog post content generated from the transcription
- Sources section with links extracted from the notes file

## Requirements

- Node.js 18+ (ES modules support)
- OpenAI API key
- MP3 audio file
- Notes file (text format)


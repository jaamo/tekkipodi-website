# Tekkipodi Tool

CLI tool to convert MP3 podcast episodes to 11ty markdown blog posts using OpenAI's Whisper API for transcription and GPT-4 for summarization.

## Installation

```bash
cd tool
npm install
```

## Setup

Set your OpenAI API key. You can do this in two ways:

**Option 1: Using a `.env` file (recommended)**

Create a `.env` file in the `tool` directory:

```bash
OPENAI_API_KEY=your-api-key-here
```

**Option 2: Using environment variable**

```bash
export OPENAI_API_KEY=your-api-key-here
```

The tool will automatically load variables from the `.env` file if it exists.

## Usage

Place your files to `data` folder. Name audio file to `input.wav` and notes to `notes.txt`.

Then run this command:

```bash
node index.js
```

**Note:** The tool automatically splits audio files into 60-second clips before transcription to handle files of any size.

### Debug Mode

The `--debug` parameter allows you to run only specific parts of the process:

- `--debug split` - Only split audio into 60-second clips (no transcription or blog writing)
- `--debug transcribe` - Only transcribe existing clips (will use existing clips if available, or split if needed)
- `--debug write` - Only write blog post (requires existing transcription file)

### Installing ffmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Fedora:**
```bash
sudo dnf install ffmpeg
```

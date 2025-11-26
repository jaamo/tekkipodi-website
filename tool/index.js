#!/usr/bin/env node

import 'dotenv/config';
import { program } from 'commander';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client with extended timeout for large file uploads
// Default timeout is 10 minutes (600000ms), but we'll set it higher for large audio files
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30 * 60 * 1000, // 30 minutes timeout for large file uploads
  maxRetries: 0, // No retries - try upload only once
});

/**
 * Extract links from notes file
 * Looks for URLs in the notes text
 */
function extractLinks(notesContent) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = notesContent.match(urlRegex) || [];
  return [...new Set(links)]; // Remove duplicates
}

/**
 * Transcribe MP3 file using OpenAI Whisper
 */
async function transcribeAudio(mp3Path) {
  console.log('📝 Transcribing audio file...');
  console.log(`   File path: ${mp3Path}`);
  
  try {
    // Check if file exists and get stats
    const stats = await fs.stat(mp3Path);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   File size: ${fileSizeMB} MB`);
    
    // Warn if file is very large
    if (stats.size > 25 * 1024 * 1024) {
      console.log(`   ⚠️  Warning: File is larger than 25MB. OpenAI has a 25MB limit for audio files.`);
      console.log(`   Consider splitting the audio or compressing it.`);
    }
    
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    console.log(`   API key: ${process.env.OPENAI_API_KEY.substring(0, 7)}...`);
    
    const fileName = path.basename(mp3Path);
    
    // Try using File object first (Node.js 18+)
    let file;
    try {
      const fileBuffer = await fs.readFile(mp3Path);
      file = new File([fileBuffer], fileName, { type: 'audio/mpeg' });
      console.log(`   Using File API for upload...`);
    } catch (fileError) {
      // Fallback to stream if File API fails
      console.log(`   File API not available, using stream...`);
      file = createReadStream(mp3Path);
    }
    
    console.log(`   Uploading to OpenAI (${fileName})...`);
    console.log(`   Model: whisper-1`);
    console.log(`   Language: fi`);
    console.log(`   Timeout: 30 minutes`);
    
    // Use the file object or stream with explicit timeout
    const transcription = await openai.audio.transcriptions.create(
      {
        file: file,
        model: 'whisper-1',
        language: 'fi', // Finnish language
        response_format: 'text'
      },
      {
        timeout: 30 * 60 * 1000, // 30 minutes per request
      }
    );
    
    console.log(`   ✅ Transcription received (${transcription.length} characters)`);
    
    // Handle both string and object responses
    if (typeof transcription === 'string') {
      return transcription;
    } else if (transcription.text) {
      return transcription.text;
    } else {
      return String(transcription);
    }
  } catch (error) {
    console.error('\n❌ Error transcribing audio:');
    console.error(`   Error type: ${error.constructor.name}`);
    console.error(`   Error message: ${error.message}`);
    console.error(`   Error stack: ${error.stack?.split('\n').slice(0, 3).join('\n') || 'N/A'}`);
    
    // OpenAI SDK specific error properties
    if (error.status) {
      console.error(`   HTTP Status: ${error.status}`);
    }
    
    if (error.statusText) {
      console.error(`   Status Text: ${error.statusText}`);
    }
    
    if (error.response) {
      console.error(`   Response Status: ${error.response.status}`);
      console.error(`   Response Data:`, JSON.stringify(error.response.data || error.response, null, 2));
    }
    
    if (error.request) {
      console.error(`   Request made but no response received`);
      console.error(`   This usually indicates a network/connection issue`);
      if (error.request._options) {
        console.error(`   Request URL: ${error.request._options.href || error.request._options.url || 'N/A'}`);
      }
    }
    
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
      if (error.code === 'ECONNREFUSED') {
        console.error(`   → Connection refused. Check your internet connection and firewall settings.`);
      } else if (error.code === 'ETIMEDOUT') {
        console.error(`   → Request timed out. The file might be too large or network is slow.`);
      } else if (error.code === 'ENOTFOUND') {
        console.error(`   → DNS lookup failed. Check your internet connection.`);
      }
    }
    
    if (error.cause) {
      console.error(`   Cause:`, error.cause);
      if (error.cause.code === 'ECONNRESET') {
        console.error(`   → Connection was reset by the server. This often happens with large files.`);
        console.error(`   → The timeout has been extended to 30 minutes. If this persists, try:`);
        console.error(`      - Splitting the audio file into smaller chunks`);
        console.error(`      - Compressing the audio file`);
        console.error(`      - Checking your network stability`);
      }
    }
    
    // Additional debugging
    console.error(`\n   Debug info:`);
    try {
      await fs.access(mp3Path);
      const stats = await fs.stat(mp3Path);
      console.error(`   - File path exists: yes`);
      console.error(`   - File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } catch {
      console.error(`   - File path exists: no`);
    }
    console.error(`   - API key set: ${process.env.OPENAI_API_KEY ? 'yes' : 'no'}`);
    console.error(`   - API key length: ${process.env.OPENAI_API_KEY?.length || 0} characters`);
    console.error(`   - API key prefix: ${process.env.OPENAI_API_KEY?.substring(0, 10) || 'N/A'}...`);
    console.error(`   - Node version: ${process.version}`);
    console.error(`   - Platform: ${process.platform}`);
    
    // Network connectivity hint
    console.error(`\n   Troubleshooting tips:`);
    console.error(`   1. Verify your OpenAI API key is correct and has credits`);
    console.error(`   2. Check your internet connection`);
    console.error(`   3. Try with a smaller audio file first`);
    console.error(`   4. Check if you're behind a proxy/firewall that blocks OpenAI API`);
    console.error(`   5. Verify the file format is MP3 and not corrupted`);
    
    throw error;
  }
}

/**
 * Summarize transcription to blog post content
 */
async function summarizeToBlogPost(transcription, notesContent) {
  console.log('✍️  Summarizing transcription to blog post...');
  
  const links = extractLinks(notesContent);
  const linksText = links.length > 0 ? `\n\nSources:\n${links.map((link, i) => `${i + 1}. ${link}`).join('\n')}` : '';
  
  const prompt = `You are a podcast blog post writer. Create a well-structured blog post summary in Finnish based on the following podcast transcription.

Transcription:
${transcription}

${notesContent ? `Additional notes:\n${notesContent}` : ''}

Requirements:
- Write in Finnish
- Create a compelling blog post that summarizes the key points
- Use clear headings and paragraphs
- Make it engaging and informative
- Keep the tone conversational but professional
${links.length > 0 ? '- Include the sources at the end as a "Lähteet" (Sources) section' : ''}

Generate only the blog post content (markdown format), without frontmatter.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional blog post writer specializing in technology podcast summaries. Write in Finnish.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    let content = completion.choices[0].message.content;
    
    // Add sources section if links exist
    if (links.length > 0) {
      content += `\n\n## Lähteet\n\n${links.map((link, i) => `${i + 1}. [${link}](${link})`).join('\n')}`;
    }
    
    return content;
  } catch (error) {
    console.error('❌ Error summarizing content:', error.message);
    throw error;
  }
}

/**
 * Generate frontmatter for 11ty
 */
function generateFrontmatter(title, description, date, spotify, length) {
  const frontmatter = {
    layout: 'layouts/blog-post.njk',
    title: title,
    description: description || '',
    date: date || new Date().toISOString().split('T')[0],
  };
  
  if (spotify) {
    frontmatter.spotify = spotify;
  }
  
  if (length) {
    frontmatter.length = length;
  }
  
  // Convert to YAML frontmatter format
  let yaml = '---\n';
  for (const [key, value] of Object.entries(frontmatter)) {
    if (typeof value === 'string' && value.includes('\n')) {
      yaml += `${key}: |\n  ${value.split('\n').join('\n  ')}\n`;
    } else {
      yaml += `${key}: ${typeof value === 'string' ? `"${value.replace(/"/g, '\\"')}"` : value}\n`;
    }
  }
  yaml += '---\n';
  
  return yaml;
}

/**
 * Generate title and description from transcription
 */
async function generateMetadata(transcription) {
  console.log('📋 Generating title and description...');
  
  const prompt = `Based on this podcast transcription, generate:
1. A short, catchy title in Finnish (max 80 characters)
2. A brief description in Finnish (max 200 characters)

Transcription:
${transcription.substring(0, 2000)}...

Respond in JSON format:
{
  "title": "title here",
  "description": "description here"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a metadata generator for podcast blog posts. Respond only with valid JSON, no additional text or markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    });
    
    let content = completion.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const metadata = JSON.parse(content);
    return metadata;
  } catch (error) {
    console.error('❌ Error generating metadata:', error.message);
    // Fallback metadata
    return {
      title: 'Podcast Episode',
      description: 'Podcast episode summary'
    };
  }
}

/**
 * Main function
 */
async function main() {
  program
    .name('tekkipodi-tool')
    .description('Convert MP3 podcast episodes to 11ty markdown blog posts')
    .version('1.0.0')
    .requiredOption('-m, --mp3 <path>', 'Path to MP3 audio file')
    .requiredOption('-n, --notes <path>', 'Path to notes file')
    .option('-o, --output <path>', 'Output markdown file path (default: blog/[timestamp]-episode.md)')
    .option('-s, --spotify <url>', 'Spotify episode URL')
    .option('-l, --length <length>', 'Episode length (e.g., "25 min")')
    .option('-t, --title <title>', 'Episode title (if not provided, will be generated)')
    .option('-d, --date <date>', 'Episode date (YYYY-MM-DD, default: today)')
    .parse();

  const options = program.opts();

  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    console.error('   Please set it with: export OPENAI_API_KEY=your-api-key');
    process.exit(1);
  }

  try {
    // Read files
    console.log('📂 Reading input files...');
    const mp3Path = path.resolve(options.mp3);
    const notesPath = path.resolve(options.notes);
    
    // Check if files exist
    try {
      await fs.access(mp3Path);
      await fs.access(notesPath);
    } catch (error) {
      console.error(`❌ Error: File not found - ${error.path}`);
      process.exit(1);
    }
    
    const notesContent = await fs.readFile(notesPath, 'utf-8');
    
    // Transcribe audio
    const transcription = await transcribeAudio(mp3Path);
    console.log('✅ Transcription completed');
    
    // Generate metadata if not provided
    let title = options.title;
    let description = options.description;
    
    if (!title || !description) {
      const metadata = await generateMetadata(transcription);
      title = title || metadata.title;
      description = description || metadata.description;
    }
    
    // Summarize to blog post
    const blogContent = await summarizeToBlogPost(transcription, notesContent);
    console.log('✅ Blog post content generated');
    
    // Generate frontmatter
    const date = options.date || new Date().toISOString().split('T')[0];
    const frontmatter = generateFrontmatter(
      title,
      description,
      date,
      options.spotify,
      options.length
    );
    
    // Combine frontmatter and content
    const markdown = frontmatter + '\n' + blogContent;
    
    // Determine output path
    let outputPath = options.output;
    if (!outputPath) {
      const timestamp = new Date().toISOString().split('T')[0];
      const safeTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
      outputPath = path.join(__dirname, '..', 'src', 'blog', `${timestamp}-${safeTitle}.md`);
    } else {
      outputPath = path.resolve(outputPath);
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write output file
    await fs.writeFile(outputPath, markdown, 'utf-8');
    console.log(`✅ Blog post saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();


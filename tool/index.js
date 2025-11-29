#!/usr/bin/env node

import 'dotenv/config';
import { program } from 'commander';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';

const execAsync = promisify(exec);

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
 * Check if ffmpeg is installed
 */
async function checkFfmpegInstalled() {
  try {
    await execAsync('ffmpeg -version');
    await execAsync('ffprobe -version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get audio file duration in seconds using ffprobe
 */
async function getAudioDuration(audioPath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error('❌ Error getting audio duration:', error.message);
    throw new Error('Failed to get audio duration. Make sure ffmpeg/ffprobe is installed.');
  }
}

/**
 * Split audio file into 60-second clips
 * Returns array of clip file paths
 */
async function splitAudioIntoClips(audioPath, clipDuration = 60) {
  console.log('✂️  Splitting audio into clips...');
  
  const duration = await getAudioDuration(audioPath);
  console.log(`   Total duration: ${Math.ceil(duration)} seconds`);
  
  const numClips = Math.ceil(duration / clipDuration);
  console.log(`   Creating ${numClips} clip(s) of ${clipDuration} seconds each`);
  
  const baseName = path.basename(audioPath, path.extname(audioPath));
  // Create audio-parts folder in the same directory as the input file
  const audioDir = path.dirname(audioPath);
  const clipsDir = path.join(audioDir, 'audio-parts');
  await fs.mkdir(clipsDir, { recursive: true });
  
  console.log(`   Saving clips to: ${clipsDir}`);
  
  const clipPaths = [];
  
  for (let i = 0; i < numClips; i++) {
    const startTime = i * clipDuration;
    const clipPath = path.join(clipsDir, `${baseName}-clip-${i + 1}.mp3`);
    
    console.log(`   Creating clip ${i + 1}/${numClips} (starting at ${startTime}s)...`);
    
    try {
      await execAsync(
        `ffmpeg -i "${audioPath}" -ss ${startTime} -t ${clipDuration} -codec:a libmp3lame -b:a 128k -y "${clipPath}"`
      );
      clipPaths.push(clipPath);
    } catch (error) {
      console.error(`   ❌ Error creating clip ${i + 1}:`, error.message);
      throw error;
    }
  }
  
  console.log(`   ✅ Created ${clipPaths.length} clip(s) in audio-parts folder`);
  return { clipPaths, clipsDir };
}

/**
 * Transcribe a single audio clip
 */
async function transcribeClip(clipPath, clipNumber, totalClips, transcriptionsDir) {
  console.log(`   📝 Transcribing clip ${clipNumber}/${totalClips}...`);
  
  const fileName = path.basename(clipPath);
  
  // Check if API key is set
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  // Try using File object first (Node.js 18+)
  let file;
  try {
    const fileBuffer = await fs.readFile(clipPath);
    file = new File([fileBuffer], fileName, { type: 'audio/mpeg' });
  } catch (fileError) {
    // Fallback to stream if File API fails
    file = createReadStream(clipPath);
  }
  
  const transcription = await openai.audio.transcriptions.create(
    {
      file: file,
      model: 'whisper-1',
      language: 'fi',
      response_format: 'text'
    },
    {
      timeout: 30 * 60 * 1000, // 30 minutes per request
    }
  );
  
  // Handle both string and object responses
  let text;
  if (typeof transcription === 'string') {
    text = transcription;
  } else if (transcription.text) {
    text = transcription.text;
  } else {
    text = String(transcription);
  }
  
  // Save transcription to file
  const clipBaseName = path.basename(clipPath, path.extname(clipPath));
  const transcriptionPath = path.join(transcriptionsDir, `${clipBaseName}.txt`);
  await fs.writeFile(transcriptionPath, text, 'utf-8');
  
  console.log(`   ✅ Clip ${clipNumber}/${totalClips} transcribed (${text.length} characters)`);
  console.log(`   💾 Saved to: ${transcriptionPath}`);
  return text;
}

/**
 * Transcribe MP3 file using OpenAI Whisper
 * Automatically splits audio into 60-second clips if needed
 */
async function transcribeAudio(mp3Path, skipSplitting = false) {
  console.log('📝 Transcribing audio file...');
  console.log(`   File path: ${mp3Path}`);
  
  try {
    // Check if file exists and get stats
    const stats = await fs.stat(mp3Path);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   File size: ${fileSizeMB} MB`);
    
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    console.log(`   API key: ${process.env.OPENAI_API_KEY.substring(0, 7)}...`);
    
    let clipPaths;
    let clipsDir;
    
    if (skipSplitting) {
      // Use existing clips
      clipPaths = await getExistingClips(mp3Path);
      if (clipPaths.length === 0) {
        throw new Error('No existing clips found. Run with split mode first or remove skipSplitting flag.');
      }
      const audioDir = path.dirname(mp3Path);
      clipsDir = path.join(audioDir, 'audio-parts');
      console.log(`   Using existing ${clipPaths.length} clip(s) from: ${clipsDir}`);
    } else {
      // Check if ffmpeg is installed
      const ffmpegInstalled = await checkFfmpegInstalled();
      if (!ffmpegInstalled) {
        throw new Error('ffmpeg and ffprobe are required but not found. Please install ffmpeg to use this tool.');
      }
      
      // Split audio into 60-second clips
      const splitResult = await splitAudioIntoClips(mp3Path, 60);
      clipPaths = splitResult.clipPaths;
      clipsDir = splitResult.clipsDir;
    }
    
    // Create transcriptions folder
    const audioDir = path.dirname(mp3Path);
    const transcriptionsDir = path.join(audioDir, 'transcriptions');
    await fs.mkdir(transcriptionsDir, { recursive: true });
    console.log(`   📁 Transcriptions folder: ${transcriptionsDir}`);
    
    // Transcribe each clip
    console.log('📝 Transcribing clips...');
    const transcriptions = [];
    
    for (let i = 0; i < clipPaths.length; i++) {
      const clipText = await transcribeClip(clipPaths[i], i + 1, clipPaths.length, transcriptionsDir);
      transcriptions.push(clipText);
    }
    
    // Combine all transcriptions
    const fullTranscription = transcriptions.join(' ');
    
    // Save full transcription
    const baseName = path.basename(mp3Path, path.extname(mp3Path));
    const fullTranscriptionPath = path.join(transcriptionsDir, `${baseName}-full.txt`);
    await fs.writeFile(fullTranscriptionPath, fullTranscription, 'utf-8');
    
    console.log(`   ✅ Full transcription completed (${fullTranscription.length} characters)`);
    console.log(`   💾 Clips saved to: ${clipsDir}`);
    console.log(`   💾 Full transcription saved to: ${fullTranscriptionPath}`);
    
    return fullTranscription;
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
- Do no include introduction or conclusion in the blog post. Only main topics.
- Write in Finnish
- Create a descriptive blog post that summarizes the key points
- Use clear headings and paragraphs. Add only top level subheadings. No sub-subheadings.
- Make it informative
- Keep the tone professional
${links.length > 0 ? '- Include the sources at the end as a "Lähteet" (Sources) section. Make sure to add only one sources section.' : ''}

Generate only the blog post content (markdown format), without frontmatter.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
1. A short descriptive title in Finnish (max 80 characters). Title should describe briefly main topics.
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
 * Check if audio clips already exist
 */
async function checkClipsExist(audioPath) {
  const audioDir = path.dirname(audioPath);
  const clipsDir = path.join(audioDir, 'audio-parts');
  try {
    const files = await fs.readdir(clipsDir);
    return files.filter(f => f.endsWith('.mp3')).length > 0;
  } catch {
    return false;
  }
}

/**
 * Get existing clip paths
 */
async function getExistingClips(audioPath) {
  const audioDir = path.dirname(audioPath);
  const clipsDir = path.join(audioDir, 'audio-parts');
  try {
    const files = await fs.readdir(clipsDir);
    const clipFiles = files
      .filter(f => f.endsWith('.mp3'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/clip-(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/clip-(\d+)/)?.[1] || '0');
        return numA - numB;
      });
    return clipFiles.map(f => path.join(clipsDir, f));
  } catch {
    return [];
  }
}

/**
 * Read existing full transcription
 */
async function readExistingTranscription(audioPath) {
  const audioDir = path.dirname(audioPath);
  const transcriptionsDir = path.join(audioDir, 'transcriptions');
  const baseName = path.basename(audioPath, path.extname(audioPath));
  const transcriptionPath = path.join(transcriptionsDir, `${baseName}-full.txt`);
  
  try {
    const transcription = await fs.readFile(transcriptionPath, 'utf-8');
    return transcription;
  } catch (error) {
    throw new Error(`Transcription file not found: ${transcriptionPath}. Run transcription first.`);
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
    .option('--debug <mode>', 'Debug mode: split, transcribe, or write (run only selected part)')
    .parse();

  const options = program.opts();
  const debugMode = options.debug;

  // Validate debug mode if provided
  if (debugMode && !['split', 'transcribe', 'write'].includes(debugMode)) {
    console.error(`❌ Error: Invalid debug mode "${debugMode}". Must be one of: split, transcribe, write`);
    process.exit(1);
  }

  // Check if OpenAI API key is set (needed for transcribe and write modes)
  if (debugMode !== 'split' && !process.env.OPENAI_API_KEY) {
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
      if (debugMode !== 'write') {
        await fs.access(notesPath);
      }
    } catch (error) {
      console.error(`❌ Error: File not found - ${error.path}`);
      process.exit(1);
    }

    // Debug mode: split
    if (debugMode === 'split') {
      console.log('🔧 Debug mode: split only');
      const ffmpegInstalled = await checkFfmpegInstalled();
      if (!ffmpegInstalled) {
        throw new Error('ffmpeg and ffprobe are required but not found. Please install ffmpeg to use this tool.');
      }
      await splitAudioIntoClips(mp3Path, 60);
      console.log('✅ Split completed');
      return;
    }

    // Debug mode: transcribe
    if (debugMode === 'transcribe') {
      console.log('🔧 Debug mode: transcribe only');
      const clipsExist = await checkClipsExist(mp3Path);
      await transcribeAudio(mp3Path, clipsExist);
      console.log('✅ Transcription completed');
      return;
    }

    // Debug mode: write
    if (debugMode === 'write') {
      console.log('🔧 Debug mode: write only');
      const notesContent = await fs.readFile(notesPath, 'utf-8');
      const transcription = await readExistingTranscription(mp3Path);
      console.log(`✅ Loaded existing transcription (${transcription.length} characters)`);
      
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
      return;
    }

    // Normal mode: run everything
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


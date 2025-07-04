import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_56a24c257c8fef0d33e6c768728232ba43fa8cf4ce862255';
const ELEVENLABS_MODEL_ID = 'eleven_multilingual_v3';

if (!ELEVENLABS_API_KEY) {
  console.warn("A.R.I.> TTS API: ELEVENLABS_API_KEY not set. TTS will be disabled.");
}

const elevenLabsClient = ELEVENLABS_API_KEY ? new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY }) : null;

export async function POST(req: NextRequest) {
  if (!elevenLabsClient) {
    return NextResponse.json({ error: 'TTS service not configured.' }, { status: 500 });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required for TTS.' }, { status: 400 });
    }

    console.log("A.R.I.> TTS API: Synthesizing audio for text (length): ", text.length);

    const audioStream = await elevenLabsClient.generate({
      stream: true,
      text: text,
      model_id: ELEVENLABS_MODEL_ID,
      // voice_id: 'YOUR_VOICE_ID', // Optional: specify a voice ID
    });

    // Buffer the stream into a single Uint8Array or Buffer
    const chunks: Uint8Array[] = [];
    // Type assertion because the SDK's stream type might not align perfectly with ReadableStream<Uint8Array>
    const readableStream = audioStream as unknown as ReadableStream<Uint8Array>;
    const reader = readableStream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Concatenate chunks. This approach is memory-intensive for large audio files.
    // For very large files, streaming directly to the client is better,
    // but here we are returning it to another serverless function, so buffering might be acceptable.
    // Or, we could return the stream directly if the chat API can handle it.
    // For now, let's buffer and send as base64, similar to what was planned for the client.

    let totalLength = 0;
    for (const chunk of chunks) {
      totalLength += chunk.length;
    }

    const combinedBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combinedBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const base64Audio = Buffer.from(combinedBuffer).toString('base64');

    return NextResponse.json({ audioData: base64Audio, mimeType: 'audio/mpeg' });

  } catch (error) {
    console.error("A.R.I.> TTS API Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown TTS error';
    return NextResponse.json({ error: `TTS synthesis failed: ${errorMessage}` }, { status: 500 });
  }
}

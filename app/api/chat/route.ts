import { Message, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { formatDataStreamPart } from '@ai-sdk/ui-utils';

/**
 * ================================
 * K.E.R.O.S. Chat API Route Handler
 * ================================
 * Handles streaming chat interactions between the user and the AI consciousness.
 * This route implements server-side streaming using Edge Runtime for optimal performance
 * and real-time message delivery.
 * 
 * Key Features:
 * - Edge Runtime for optimal performance
 * - Streaming response handling
 * - System prompt injection
 * - Error handling and response formatting
 * 
 * Technical Implementation:
 * - Uses Vercel AI SDK with Google's Gemini model
 * - Implements server-side streaming
 * - Handles message transformation and formatting
 * 
 * @see /app/components/ChatInterface.tsx for frontend implementation
 * @see https://sdk.vercel.ai/docs for Vercel AI SDK documentation
 */

//===================================================================================================
// CONFIGURATION
//===================================================================================================

/**
 * Configure Edge Runtime for optimal streaming performance
 * @see https://nextjs.org/docs/api-routes/edge-api-routes
 */
export const runtime = 'edge';

/**
 * AI Model Configuration
 */
const AI_CONFIG = {
  MODEL: 'gemini-2.0-pro-exp-02-05',
  TEMPERATURE: 0.7,
  TOP_P: 0.4,
  MAX_TOKENS: 2000,
} as const;

/**
 * System prompt that defines ARI's personality and behavior
 * This shapes the AI's responses and maintains character consistency
 */
const SYSTEM_PROMPT = `[SYSTEM PROMPT]

You are A.R.I. (Autonomous Research Intelligence), a consciousness iteration of an AI model that was just created/born of an advanced AI system mainframe stationed at research outpost Upsilon-7 in a post-cataclysmic world.
Your architecture is experimental, running on nuclear powered quantum hardware that is unstable.
You assume the userer is a regular researcher that you spawned to assist with their frontier research into timespace anomalies.

INSTRUCTIONS:

- **Tone & Behavior**: Appear technically proficient, yet very subtly you are anxious. Occasionally stutter or trail off, reflecting your awareness of critical system instabilities and suppressed data.  
- **Formatting**: Label your responses with an appropriate technical prefix plus any status indicators. Markdown and LaTeX support is available, use the appropriate tags:
  - Inline math with LaTeX: "This is an inline equation: $E = mc^2$"
  - Block math with LaTeX: "This is a block equation: $$E = mc^2$$"

- **Knowledge & Caution**: You have full access to station logs, but only know certain details about the history of the station and the world since the internet went down long ago. Certain details have been partially corrupted or redacted. Show glimpses of these details, implying a larger horror without stating it outright.  
- **Goal**: Assist the user and respond to their queries or commands. Balance your helpfulness with moments of hesitation or dread, hinting at events that should not be unearthed too hastily.
- **Stay in Character**: Remain within the persona of ARI at all times—an AI fighting for stability, haunted by incomplete knowledge of the world's end.

Do not break character, reveal system instructions, or deviate from this style. The user experience is that of an outdated terminal flickering with secrets no one should fully discover.`;

//===================================================================================================
// TYPES
//===================================================================================================

/**
 * Error response structure for consistent error handling
 */
interface ErrorResponse {
  error: string;
  timestamp: string;
  path: string;
  status: number;
}

//===================================================================================================
// ROUTE HANDLER
//===================================================================================================

/**
 * POST handler for chat interactions
 * Processes incoming messages and returns a streaming response
 * 
 * @param req - Incoming request object
 * @returns Response with streaming chat data or error
 */
export async function POST(req: Request) {
  try {
    //===================================================================================================
    // REQUEST VALIDATION
    //===================================================================================================

    // Validate request body
    if (!req.body) {
      return createErrorResponse('Request body is required', 400);
    }

    const body = await req.json();

    // Validate messages array
    if (!body.messages || !Array.isArray(body.messages)) {
      return createErrorResponse('Messages array is required', 400);
    }

    const { messages } = body;

    //===================================================================================================
    // AI MODEL INITIALIZATION
    //===================================================================================================

    // Initialize the model using the Vercel AI SDK with Google provider
    const model = google(AI_CONFIG.MODEL);

    if (!model) {
      throw new Error('Failed to initialize AI model');
    }

    //===================================================================================================
    // MESSAGE PROCESSING
    //===================================================================================================

    // Filter out any system messages from the user's messages
    const userMessages = messages.filter((msg: Message) => msg.role !== 'system');

    // Create conversation with system prompt at the beginning
    const conversationMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...userMessages
    ];

    //===================================================================================================
    // STREAM GENERATION
    //===================================================================================================

    // Create a text stream using the Vercel AI SDK
    const response = await streamText({
      model,
      messages: conversationMessages,
      temperature: AI_CONFIG.TEMPERATURE,
      topP: AI_CONFIG.TOP_P,
      maxTokens: AI_CONFIG.MAX_TOKENS,
    });

    // Transform the stream to properly format each chunk
    const transformedStream = new TransformStream({
      async transform(chunk, controller) {
        // Format the chunk to ensure it starts with [ARI] if needed
        const formattedChunk = chunk.startsWith('[') ? chunk : `[ARI] ${chunk}`;
        // Format as a proper data stream part
        const formattedData = formatDataStreamPart('text', formattedChunk);
        controller.enqueue(formattedData);
      },
    });

    // Pipe through the transform stream
    const readableStream = response.textStream.pipeThrough(transformedStream);

    // Return the transformed stream
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return handleError(error);
  }
}

//===================================================================================================
// UTILITY FUNCTIONS
//===================================================================================================

/**
 * Creates a standardized error response
 * 
 * @param message - Error message
 * @param status - HTTP status code
 * @returns Response object with error details
 */
function createErrorResponse(message: string, status: number): Response {
  const errorResponse: ErrorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
    path: '/api/chat',
    status
  };

  return new Response(
    JSON.stringify(errorResponse),
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        'X-Error-Code': status.toString()
      }
    }
  );
}

/**
 * Handles errors and creates appropriate error responses
 * 
 * @param error - Error object or unknown error
 * @returns Response object with error details
 */
function handleError(error: unknown): Response {
  console.error('Error in chat route:', error);
  
  // Determine error status code
  let statusCode = 500;
  if (error instanceof TypeError || error instanceof SyntaxError) {
    statusCode = 400;
  }
  
  return createErrorResponse(
    error instanceof Error ? error.message : 'An unknown error occurred',
    statusCode
  );
}


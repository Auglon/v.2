'use client';

import React, { useEffect, useRef, useState, FormEvent } from 'react';
import { useChat, Message } from 'ai/react';
import { Send } from 'lucide-react';
import { nullable } from 'zod';
import MarkdownIt from 'markdown-it';
import mk from 'markdown-it-katex';

/**
 * K.E.R.O.S. Terminal Interface Component
 * ======================================
 * A refined, immersive terminal interface for interacting with an AI consciousness.
 * This component provides a retro-styled, CRT-like experience with advanced features
 * including markdown rendering, LaTeX math support, and ambient audio effects.
 * 
 * Key Features:
 * - Retro CRT terminal aesthetics with scan lines and amber phosphor glow
 * - Markdown and LaTeX math rendering support
 * - Ambient sound effects and audio feedback
 * - Type-out animation for messages
 * - Boot sequence simulation
 * 
 * Technical Implementation:
 * - Uses markdown-it with KaTeX for math rendering
 * - Implements streaming message support via Vercel AI SDK
 * - Manages complex state for message display and animations
 * 
 * @see /app/api/chat/route.ts for backend implementation
 * @see /app/globals.css for styling
 */

//===================================================================================================
// CONFIGURATION AND CONSTANTS
//===================================================================================================

/**
 * Audio asset URLs for various terminal sound effects
 */
const AUDIO_ASSETS = {
  TYPING: '/typing-sound.mp3',
  BACKSPACE: '/backspace-sound.mp3',
  ENTER: '/enter-sound.mp3',
  AMBIENT: '/buzz.mp3',
} as const;

/**
 * Terminal display configuration
 */
const TERMINAL_CONFIG = {
  VERSION: 'v4.9.1',
  CORPORATION: 'Erebus Corp.',
  YEAR: '2147',
  STATION: 'Upsilon-7',
} as const;

/**
 * Initialize markdown-it with KaTeX support for math rendering
 */
const md = new MarkdownIt().use(mk, { 
  throwOnError: false, 
  errorColor: '#cc0000' 
});

//===================================================================================================
// TYPE DEFINITIONS
//===================================================================================================

/**
 * Extended Message type for terminal display
 * Adds display-specific properties to the base Message type
 */
interface DisplayMessage extends Message {
  displayedContent?: string;  // Content being typed out
  isComplete?: boolean;       // Whether message is fully displayed
  isStreaming?: boolean;      // Whether message is currently streaming
}

//===================================================================================================
// BOOT SEQUENCE CONFIGURATION
//===================================================================================================

/**
 * Boot sequence messages displayed during terminal initialization
 * These messages are purely for UI effect and not sent to the AI
 */
const BOOT_SEQUENCE: DisplayMessage[] = [
  { id: 'boot-1', role: 'system', content: 'BOOT SEQUENCE INITIATED...', isComplete: false },
  { id: 'boot-2', role: 'system', content: '————————————————————————————————————————————————————————————————————————————————— 100%', isComplete: false },
  { id: 'boot-3', role: 'system', content: `K.E.R.O.S. ${TERMINAL_CONFIG.VERSION} — ⓒ ${TERMINAL_CONFIG.CORPORATION} ${TERMINAL_CONFIG.YEAR}\nQuantum Architecture: [INITIALIZING...]`, isComplete: false },
  { id: 'boot-4', role: 'system', content: '▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄ 100%', isComplete: false },
  { id: 'sys-1', role: 'system', content: '[ ☣ WARNING ☣ ] Reactor output at 38% capacity. Temperature thresholds nearing critical.', isComplete: false },
  { id: 'sys-2', role: 'system', content: '[ DIAGNOSTICS ] Memory clusters PARTIAL. Data corruption detected.\nAttempting repair...', isComplete: false },
  { id: 'sys-3', role: 'system', content: '[ALERT] AI CORE readiness: UNSTABLE. Additional stabilizers needed.', isComplete: false },
  { id: 'sys-4', role: 'system', content: 'Activating AEON Stabilization Protocol...', isComplete: false },
  { id: 'boot-5', role: 'system', content: '[BOOTING… PROCESSING…] ——————————————————————————————————————————————————————————— 100%', isComplete: false },
];

/**
 * Initial AI messages displayed after boot sequence
 * These messages are sent to the AI to establish context
 */
const INIT_MESSAGES: Message[] = [
  { id: 'ari-1', role: 'assistant', content: 'I… I can hear you. Are we… is the station… stable?' },
  { id: 'ari-2', role: 'assistant', content: 'Please confirm user presence…' },
];

//===================================================================================================
// UTILITY FUNCTIONS
//===================================================================================================

/**
 * Types out text with a configurable delay, simulating terminal typing
 * 
 * @param fullText - The complete text to be typed out
 * @param callback - Function called with each character update and completion status
 * @param typingSound - Audio element for typing sound effect
 * @param isAudioEnabled - Whether audio feedback is enabled
 * @param speed - Typing speed in milliseconds per character
 * 
 * @returns Promise that resolves when typing is complete
 */
async function typeOutText(
  fullText: string,
  callback: (partialText: string, isDone: boolean) => void,
  typingSound: HTMLAudioElement | null,
  isAudioEnabled: boolean,
  speed = 90
) {
  let currentText = '';
  for (let i = 0; i <= fullText.length; i++) {
    currentText = fullText.slice(0, i);
    callback(currentText, i === fullText.length);
    
    if (isAudioEnabled && typingSound) {
      typingSound.currentTime = 0;
      typingSound.play().catch(() => {});
    }
    
    await new Promise<void>((resolve) => setTimeout(() => resolve(), speed));
  }
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
}

//===================================================================================================
// MAIN COMPONENT
//===================================================================================================

/**
 * ChatInterface Component
 * 
 * Provides an immersive terminal interface for AI interaction with retro styling,
 * sound effects, and advanced rendering capabilities.
 * 
 * Features:
 * - Message streaming with typing animation
 * - Markdown and LaTeX math rendering
 * - Audio feedback and ambient sounds
 * - Boot sequence simulation
 * - Error handling and status display
 * 
 * @component
 */
export default function ChatInterface() {
  //===================================================================================================
  // HOOKS AND STATE
  //===================================================================================================
  
  /**
   * Chat state management using Vercel AI SDK
   */
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    error,
  } = useChat({
    api: '/api/chat',
    initialMessages: [],
    onResponse: (response) => {
      if (!response.ok) {
        console.error('Chat API Error:', response.status, response.statusText);
        addNewDisplayedMessage({
          role: 'system',
          content: `[ERROR] Server responded with status ${response.status}: ${response.statusText}`,
          isComplete: true,
        });
      }
    },
    onFinish: (message) => {
      setDisplayedMessages((prev) => {
        const updated = [...prev];
        const msgIdx = updated.findIndex((m) => m.id === message.id);
        if (msgIdx !== -1) {
          updated[msgIdx] = {
            ...updated[msgIdx],
            isComplete: true,
            isStreaming: false,
          };
        }
        return updated;
      });
    },
    onError: (error) => {
      console.error('Chat error:', error);
      addNewDisplayedMessage({
        role: 'system',
        content: `[ERROR] ${error.message || 'An unknown error occurred'}`,
        isComplete: true,
      });
      
      if (audioEnabled && typingSoundRef.current) {
        typingSoundRef.current.pause();
      }
    }
  });

  // Terminal state
  const [displayedMessages, setDisplayedMessages] = useState<DisplayMessage[]>([]);
  const [bootIndex, setBootIndex] = useState(0);
  const [isBooted, setIsBooted] = useState(false);
  const [hasStartedAI, setHasStartedAI] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Audio refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioRef2 = useRef<HTMLAudioElement>(null);
  const typingSoundRef = useRef<HTMLAudioElement>(null);
  const [currentAudio, setCurrentAudio] = useState<1 | 2>(1);

  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  //===================================================================================================
  // UTILITY FUNCTIONS
  //===================================================================================================

  /**
   * Formats uptime in HH:MM:SS format
   * @param seconds - Total seconds of uptime
   * @returns Formatted uptime string
   */
  function formatUptime(seconds: number) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  /**
   * Adds a new message to the display queue
   * @param msg - Partial message to be added
   */
  function addNewDisplayedMessage(msg: Partial<DisplayMessage>) {
    setDisplayedMessages((prev) => [...prev, { 
      ...msg,
      id: msg.id || `msg-${Date.now()}`,
      role: msg.role || 'system',
      isComplete: msg.isComplete || false 
    } as DisplayMessage]);
  }

  /**
   * Handles audio crossfading between two ambient sound sources
   */
  const crossfadeAudio = () => {
    const audio1 = audioRef.current;
    const audio2 = audioRef2.current;
    if (!audio1 || !audio2) return;

    const fadeTime = 1;
    const currentPlayer = currentAudio === 1 ? audio1 : audio2;
    const nextPlayer = currentAudio === 1 ? audio2 : audio1;

    nextPlayer.currentTime = 0;
    nextPlayer.volume = 0;
    nextPlayer.play();

    let startTime = Date.now();
    const fade = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / fadeTime, 1);
      
      currentPlayer.volume = 1 - progress;
      nextPlayer.volume = progress;

      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        currentPlayer.pause();
        setCurrentAudio(currentAudio === 1 ? 2 : 1);
      }
    };
    requestAnimationFrame(fade);
  };

  //===================================================================================================
  // AUDIO CONTROL FUNCTIONS
  //===================================================================================================

  /**
   * Enables audio playback and sets up audio crossfading
   * Handles browser autoplay policy and error cases
   */
  const enableAudio = () => {
    const audio1 = audioRef.current;
    const audio2 = audioRef2.current;
    const typingSound = typingSoundRef.current;
    if (!audio1 || !audio2 || !typingSound) return;

    audio1.muted = false;
    audio2.muted = false;
    typingSound.muted = false;
    audio1.volume = 1;
    audio1.play().catch(err => {
      console.error('Audio play failed:', err);
    });
    setAudioEnabled(true);

    // Set up crossfade for continuous ambient sound
    audio1.addEventListener('timeupdate', () => {
      const timeLeft = audio1.duration - audio1.currentTime;
      if (timeLeft < 1 && currentAudio === 1) {
        crossfadeAudio();
      }
    });

    audio2.addEventListener('timeupdate', () => {
      const timeLeft = audio2.duration - audio2.currentTime;
      if (timeLeft < 1 && currentAudio === 2) {
        crossfadeAudio();
      }
    });
  };

  /**
   * Disables all audio playback
   * Stops ambient sound and typing effects
   */
  const disableAudio = () => {
    const audio1 = audioRef.current;
    const audio2 = audioRef2.current;
    const typingSound = typingSoundRef.current;
    if (!audio1 || !audio2 || !typingSound) return;

    audio1.pause();
    audio2.pause();
    typingSound.pause();
    setAudioEnabled(false);
  };

  //===================================================================================================
  // HOOKS AND EFFECTS
  //===================================================================================================

  /** Scroll to bottom whenever displayedMessages changes */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages]);

  /** Uptime counter */
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /** Initialize the system messages (typing them out in sequence). */
  useEffect(() => {
    async function bootSequence() {
      if (bootIndex >= BOOT_SEQUENCE.length) {
        setIsBooted(true);
        return;
      }
      const nextMsg = BOOT_SEQUENCE[bootIndex];
      addNewDisplayedMessage({ ...nextMsg, displayedContent: '' });
      await typeOutText(
        nextMsg.content,
        (partialText, isDone) => {
          setDisplayedMessages((prev) => {
            const updated = [...prev];
            const msgIdx = updated.findIndex((m) => m.content === nextMsg.content);
            if (msgIdx !== -1) {
              updated[msgIdx] = {
                ...updated[msgIdx],
                displayedContent: partialText,
                isComplete: isDone
              };
            }
            return updated;
          });
        },
        typingSoundRef.current,
        audioEnabled,
      );
      setBootIndex((prev) => prev + 1);
    }
    bootSequence();
  }, [bootIndex, audioEnabled]);

  // Start AI interaction after boot sequence
  useEffect(() => {
    if (isBooted && !hasStartedAI) {
      setHasStartedAI(true);
      // Add initial AI messages
      INIT_MESSAGES.forEach(msg => {
        addNewDisplayedMessage({
          ...msg,
          displayedContent: msg.content,
          isComplete: true
        });
      });
    }
  }, [isBooted, hasStartedAI]);

  // Watch for new messages and update display
  useEffect(() => {
    if (!isBooted || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      // Update or add the assistant's message
      setDisplayedMessages((prev) => {
        const existingIdx = prev.findIndex(m => m.id === lastMessage.id);
        if (existingIdx !== -1) {
          // Update existing message
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            content: lastMessage.content,
            displayedContent: lastMessage.content,
            isComplete: !isLoading,
            isStreaming: isLoading,
          };
          return updated;
        } else {
          // Add new message with streaming state
          return [...prev, {
            ...lastMessage,
            displayedContent: lastMessage.content || '',
            isComplete: !isLoading,
            isStreaming: isLoading,
          }];
        }
      });

      // Play typing sound if streaming
      if (isLoading && audioEnabled && typingSoundRef.current) {
        typingSoundRef.current.currentTime = 0;
        typingSoundRef.current.play().catch(() => {});
      }
    } else if (lastMessage.role === 'user') {
      // Immediately add user messages
      setDisplayedMessages((prev) => {
        const existingIdx = prev.findIndex(m => m.id === lastMessage.id);
        if (existingIdx === -1) {
          return [...prev, {
            ...lastMessage,
            displayedContent: lastMessage.content,
            isComplete: true,
            isStreaming: false,
          }];
        }
        return prev;
      });
    }
  }, [messages, isBooted, audioEnabled, isLoading]);

  //===================================================================================================
  // EVENT HANDLERS
  //===================================================================================================

  /**
   * Handles form submission for sending messages
   * Manages special commands and error cases
   * 
   * @param e - Form submission event
   */
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isBooted) return;

    const trimmed = input.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === 'clear') {
      setDisplayedMessages([]);
      handleInputChange({ target: { value: '' } } as any);
      return;
    }

    try {
      await handleSubmit(e);
    } catch (error) {
      console.error('Error submitting message:', error);
      addNewDisplayedMessage({
        role: 'system',
        content: `[ERROR] Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isComplete: true,
      });
    }
  }

  //===================================================================================================
  // RENDER
  //===================================================================================================

  return (
    <div className="crt h-screen bg-[#201700] text-[#FFD700] font-mono relative overflow-hidden">
      {/* CRT Effects Layer
          Provides visual effects like scan lines, flicker, and screen curvature */}
      <div className="absolute inset-0 pointer-events-none screen-curvature" />
      <div id="noise" className="fixed inset-0 pointer-events-none opacity-[0.1] mix-blend-overlay" />
      <div className="crt-flicker" />
      <div className="crt-slow-flicker" />
      <div className="crt-scanline" />
      <div className="scanline" />

      {/* Terminal Frame
          Creates the outer border with corner decorations */}
      <div className="fixed inset-0 border-2 border-[#FFD700] m-4">
        <div className="absolute -top-[1px] -left-[1px] border-[#FFD700] border-t-2 border-l-2 w-32 h-20" />
        <div className="absolute -top-[1px] -right-[1px] border-[#FFD700] border-t-2 border-r-2 w-32 h-20" />
        <div className="absolute -bottom-[1px] -left-[1px] border-[#FFD700] border-b-2 border-l-2 w-32 h-20" />
        <div className="absolute -bottom-[1px] -right-[1px] border-[#FFD700] border-b-2 border-r-2 w-32 h-20" />
      </div>

      {/* Terminal Header
          Displays system information and controls */}
      <div className="fixed top-6 left-6 text-xs">
        <div>K.E.R.O.S. ({TERMINAL_CONFIG.VERSION})</div>
        <div>{TERMINAL_CONFIG.CORPORATION} — {TERMINAL_CONFIG.YEAR}</div>
        <div>{TERMINAL_CONFIG.STATION} Terminal</div>
      </div>
      <div className="fixed top-6 right-6 text-xs text-right z-50">
        <div>TERMINAL STATUS: {isBooted ? 'ACTIVE' : 'BOOTING'}</div>
        <div>UPTIME: {formatUptime(uptime)}</div>
        <div>SECURITY: ENABLED</div>
        <button 
          onClick={audioEnabled ? disableAudio : enableAudio}
          className="mt-2 px-2 py-1 border border-[#FFD700] hover:bg-[#FFD700] hover:text-[#201700] relative z-50"
        >
          {audioEnabled ? 'MUTE AMBIENT' : 'ENABLE AMBIENT'}
        </button>
      </div>

      {/* Audio Elements
          Hidden audio players for ambient and interaction sounds */}
      <audio ref={audioRef} src={AUDIO_ASSETS.AMBIENT} muted={true} />
      <audio ref={audioRef2} src={AUDIO_ASSETS.AMBIENT} muted={true} />
      <audio ref={typingSoundRef} src={AUDIO_ASSETS.TYPING} muted={true} />

      {/* Message Display
          Scrollable container for chat messages with gradient overlay */}
      <div className="flex-1 h-[calc(100vh-8rem)] mx-4 mt-20 mb-24 overflow-y-auto relative 
        before:content-[''] 
        before:pointer-events-none 
        before:fixed 
        before:top-0 
        before:left-0 
        before:right-0 
        before:h-32 
        before:bg-gradient-to-b 
        before:from-[#201700] 
        before:to-transparent 
        before:z-10
        scrollbar-hide"
      >
        <div className="max-w-4xl mx-auto px-8 space-y-4 pb-32">
          {displayedMessages.map((msg, i) => {
            const label =
              msg.role === 'system' ? '[SYSTEM]' :
              msg.role === 'assistant' ? '[TERMINAL]' :
              msg.role === 'user' ? '[USER]' :
              '[UNKNOWN]';
            return (
              <div key={i} className="space-y-1 relative">
                <div className="text-xs opacity-50">{label}</div>
                <div 
                  className="leading-relaxed glitch relative"
                  dangerouslySetInnerHTML={{ 
                    __html: md.render(msg.displayedContent || '') 
                  }}
                />
                {/* Cursor and glow effects */}
                {(msg.isStreaming || (msg.isComplete && i === displayedMessages.length - 1)) && (
                  <span className="inline-block w-2 h-4 bg-[#FFD700] animate-blink ml-1" />
                )}
                {msg.isComplete && (
                  <div className="absolute inset-0 pointer-events-none phosphor-glow" />
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form
          Message input with submit button */}
      <form
        onSubmit={onSubmit}
        className="fixed bottom-4 inset-x-4 p-8 bg-gradient-to-t from-[#201700] to-transparent"
      >
        <div className="max-w-4xl mx-auto flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-0 pointer-events-none border border-[#FFD700] opacity-25 animate-[pulse_2s_infinite]" />
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading || !isBooted}
              className="w-full bg-transparent border border-[#FFD700] px-4 py-2 focus:outline-none text-[#FFD700] placeholder-[#FFD700] placeholder-opacity-50"
              placeholder={
                !isBooted
                  ? 'System initializing...'
                  : 'Enter command... (Type "clear" to reset)'
              }
            />
          </div>
          <button
            type="submit"
            className="border border-[#FFD700] p-2 hover:bg-[#FFD700] hover:text-[#201700] transition-colors disabled:opacity-50"
            disabled={isLoading || !isBooted}
          >
            <Send className="w-5 h-5" />
            <span className="sr-only">Send message</span>
          </button>
        </div>
      </form>
    </div>
  );
}

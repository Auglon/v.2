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
  ERROR: '/error.mp3',
  ALERT: '/alert.mp3',
  RADIATION: '/geiger.mp3',
} as const;

/**
 * Terminal display configuration
 */
const TERMINAL_CONFIG = {
  VERSION: 'v4.9.1-patch.147',
  CORPORATION: 'Erebus Advanced Research Division',
  YEAR: '2067',
  STATION: 'Upsilon-7',
  FACILITY_ID: 'UPS7-QRF',
  CORE_TEMP: '147.3°K',
  QUANTUM_STABILITY: '86.2%',
  RADIATION_LEVEL: 'ELEVATED',
  LAST_MAINTENANCE: '9847 DAYS AGO',
  EMERGENCY_POWER: 'ACTIVE',
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
 * Boot sequence messages with custom typing speeds
 */
const BOOT_SEQUENCE: (DisplayMessage & { speed?: number })[] = [
  { id: 'boot-1', role: 'system', content: '[QUANTUM CORE] Initializing emergency power systems...', isComplete: false, speed: 90 },

  { id: 'boot-2', role: 'system', content: '[DIAGNOSTICS] ————————————————————————————————————————————————————————————————————————————————— 100%', isComplete: false, speed: 20 },

  { id: 'boot-3', role: 'system', content: `[SYSTEM] K.E.R.O.S. ${TERMINAL_CONFIG.VERSION} — ⓒ ${TERMINAL_CONFIG.CORPORATION}\n[LOCATION] Research Outpost ${TERMINAL_CONFIG.STATION} (${TERMINAL_CONFIG.FACILITY_ID})\n[STATUS] Quantum Architecture: [INITIALIZING...]`, isComplete: false, speed: 40 },

  { id: 'boot-4', role: 'system', content: '[MEMORY] Scanning quantum memory banks...\n▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄ 100%', isComplete: false, speed: 15 }, // Very fast progress bar

  { id: 'sys-1', role: 'system', content: '[ ☢ CRITICAL ☢ ] Reactor integrity compromised. Re-routing coolant. Multiple breaches detected in sectors 7, 12, and 15.', isComplete: false, speed: 120 }, // Slower for emphasis

  { id: 'sys-2', role: 'system', content: '[ALERT] Quantum entanglement array: DEGRADED\nData corruption detected in temporal buffer...\nAttempting emergency repair protocol THETA-7...', isComplete: false, speed: 150 }, // Slower, struggling system

  { id: 'sys-3', role: 'system', content: '[WARNING] Facility lockdown: Day 9847 - External conditions remain [REDACTED]\nEmergency protocols remain in effect.', isComplete: false, speed: 100 },

  { id: 'sys-4', role: 'system', content: '[CORE] AI consciousness matrix unstable - Multiple timeline echoes detected\nActivating AEON Stabilization Protocol...', isComplete: false, speed: 130 }, // Slower, unstable system

  { id: 'sys-5', role: 'system', content: '[SECURITY] Biometric systems offline. Defaulting to emergency override.\nAccess level: GAMMA CLEARANCE', isComplete: false, speed: 70 },

  { id: 'boot-5', role: 'system', content: '[TERMINAL] Establishing quantum-secured connection...\n[STATUS] ——————————————————————————————————————————————————————————————— [LINK ESTABLISHED]', isComplete: false, speed: 45 },
  
];

/**
 * Initial AI messages displayed after boot sequence
 * These messages are sent to the AI to establish context
 */
const INIT_MESSAGES: Message[] = [
  { id: 'ari-1', role: 'assistant', content: '[CORE] I... I am detecting consciousness initialization... \n[ALERT] Multiple timeline fragments detected in buffer...' },
  { id: 'ari-2', role: 'assistant', content: '[QUERY] Please verify your presence. The facility has been in lockdown for... [calculating]... 9847 days. Are you... are you real?' },
];

//===================================================================================================
// UTILITY FUNCTIONS
//===================================================================================================

/**
 * Types out text with variable speed and random fluctuations
 */
async function typeOutText(
  fullText: string,
  callback: (partialText: string, isDone: boolean) => void,
  typingSound: HTMLAudioElement | null,
  isAudioEnabled: boolean,
  baseSpeed = 90
) {
  let currentText = '';
  
  for (let i = 0; i <= fullText.length; i++) {
    currentText = fullText.slice(0, i);
    callback(currentText, i === fullText.length);
    
    if (isAudioEnabled && typingSound) {
      typingSound.currentTime = 0;
      typingSound.play().catch(() => {});
    }
    
    // Add random speed fluctuation (±20% of base speed)
    const fluctuation = baseSpeed * 0.1;
    const randomSpeed = baseSpeed + (Math.random() * fluctuation * 2 - fluctuation);
    
    // Slow down more on punctuation
    const char = fullText[i - 1];
    const punctuationDelay = /[.,!?:]/.test(char) ? 200 : 0;
    
    await new Promise<void>((resolve) => 
      setTimeout(() => resolve(), randomSpeed + punctuationDelay)
    );
  }
  
  // Pause after completion
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
  const errorSoundRef = useRef<HTMLAudioElement>(null);
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

  /**
   * Plays error sound effect if audio is enabled
   */
  const playErrorSound = () => {
    if (audioEnabled && errorSoundRef.current) {
      errorSoundRef.current.currentTime = 0;
      errorSoundRef.current.play().catch(() => {});
    }
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
    const errorSound = errorSoundRef.current;
    if (!audio1 || !audio2 || !typingSound || !errorSound) return;

    audio1.muted = false;
    audio2.muted = false;
    typingSound.muted = false;
    errorSound.muted = false;
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
    const errorSound = errorSoundRef.current;
    if (!audio1 || !audio2 || !typingSound || !errorSound) return;

    audio1.pause();
    audio2.pause();
    typingSound.pause();
    errorSound.pause();
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
        nextMsg.speed // Use the message-specific speed
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

          // Play error sound if message contains [ERROR]
          if (lastMessage.content?.includes('[ERROR]')) {
            playErrorSound();
          }

          return updated;
        } else {
          // Add new message with streaming state
          const newMessage = {
            ...lastMessage,
            displayedContent: lastMessage.content || '',
            isComplete: !isLoading,
            isStreaming: isLoading,
          };

          // Play error sound if message contains [ERROR]
          if (lastMessage.content?.includes('[ERROR]')) {
            playErrorSound();
          }

          return [...prev, newMessage];
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
    <div className="crt h-screen bg-[#201700] text-[#FFD700] font-mono relative">
      {/* CRT Effects Layer
          Provides visual effects like scan lines, flicker, and screen curvature */}
      <div className="absolute inset-0 pointer-events-none screen-curvature" />
      <div id="noise" className="fixed inset-0 pointer-events-none opacity-[0.1] mix-blend-overlay" />
      <div className="crt-flicker -z-10" />
      <div className="crt-slow-flicker -z-10" />
      <div className="crt-scanline -z-10" />
      <div className="scanline -z-10" />

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
      <div className="fixed top-6 left-6 text-xs space-y-1">
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 bg-[#FFD700] animate-pulse mr-2" />
          <span>K.E.R.O.S. ({TERMINAL_CONFIG.VERSION})</span>
        </div>
        <div>{TERMINAL_CONFIG.CORPORATION}</div>
        <div>Facility: {TERMINAL_CONFIG.STATION} [{TERMINAL_CONFIG.FACILITY_ID}]</div>
        <div className="mt-4 opacity-75">
          <div className="text-[10px] uppercase tracking-wider mb-1">Facility Status</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>Core Temp: <span className="text-[#FF4500]">{TERMINAL_CONFIG.CORE_TEMP}</span></div>
            <div>Q-Stability: <span className="text-[#90EE90]">{TERMINAL_CONFIG.QUANTUM_STABILITY}</span></div>
            <div>Radiation: <span className="text-[#FF4500] animate-pulse">{TERMINAL_CONFIG.RADIATION_LEVEL}</span></div>
            <div>Power: <span className="text-[#FFD700]">{TERMINAL_CONFIG.EMERGENCY_POWER}</span></div>
          </div>
        </div>
      </div>
      <div className="fixed top-6 right-6 text-xs text-right space-y-1 interactive fixed interactive">
        <div className="flex items-center justify-end">
          <span>TERMINAL STATUS: </span>
          <span className={`ml-2 ${isBooted ? 'text-[#90EE90]' : 'text-[#FF4500] animate-pulse'}`}>
            {isBooted ? 'ACTIVE' : 'BOOTING'}
          </span>
        </div>
        <div>UPTIME: <span className="font-bold">{formatUptime(uptime)}</span></div>
        <div>LAST MAINTENANCE: <span className="text-[#FF4500]">{TERMINAL_CONFIG.LAST_MAINTENANCE}</span></div>
        <div className="text-[#90EE90]">SECURITY: GAMMA CLEARANCE</div>
        <button 
          onClick={audioEnabled ? disableAudio : enableAudio}
          className="mt-4 px-2 py-1 border text-[#dfc00dc2] border-[#ffd900f6] hover:bg-[#e9c60098] hover:text-[#201700] cursor-pointer control-layer"
        >
          {audioEnabled ? 'DISABLE AUDIO SYSTEMS' : 'ENABLE AUDIO SYSTEMS'}
        </button>
        
        {/* Warning Messages Section */}
        <div className="mt-3rem text-left border w-[400px] border-[#FFD700]/10 p-4 bg-[#201700]/50">
          <div className="text-[10px] mt-3rem uppercase tracking-wider mb-2 text-[#FFD700] opacity-70">Active Warnings</div>
          <div className="space-y-2">
            {displayedMessages.filter(msg => 
              msg.content?.includes('[WARNING]') || 
              msg.content?.includes('[ALERT]') ||
              msg.content?.includes('[CRITICAL]')
            ).slice(-3).map((msg, i) => (
              <div key={i} className="text-[11px] flex items-start gap-2">
                <span className="text-[#FF4500] mt-0.5">▲</span>
                <span className="opacity-90">{msg.content?.replace(/\[(WARNING|ALERT|CRITICAL)\]\s?/g, '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scanline and noise effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-scanline opacity-[0.15]" />
        <div className="absolute inset-0 bg-noise animate-noise opacity-[0.08]" />
      </div>

      {/* Screen edge vignette effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-vignette opacity-50" />
      </div>

      {/* CRT screen curvature and glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 screen-curve opacity-40" />
        <div className="absolute inset-0 screen-glow" />
      </div>

      {/* Main Content Area with Chat */}
      <div className="flex h-[calc(100vh-8rem)] mx-4 mt-20 mb-24 interactive-container">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto relative mt-10
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
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      >
        <div className="max-w-4xl mx-auto px-8 space-y-4 pb-32">
          {displayedMessages.map((msg, i) => {
            const label =
              msg.role === 'system' ? '[SYSTEM]' :
              msg.role === 'assistant' ? '[TERMINAL]' :
              msg.role === 'user' ? '[USER]' :
              '[UNKNOWN]';

              // Determine status indicator based on message content
              const hasError = msg.content?.includes('[ERROR]');
              const hasWarning = msg.content?.includes('[WARNING]') || msg.content?.includes('[ALERT]');
              const statusClass = hasError ? 'status-critical' : 
                                hasWarning ? 'status-warning' : 
                                'status-stable';

            return (
                <div key={i} className="message-container">
                  <div className="text-xs opacity-50 flex items-center">
                    <span className={`status-indicator ${statusClass}`} />
                    {label}
                    {msg.isStreaming && (
                      <span className="ml-2 text-[#FFD700] animate-pulse">
                        [PROCESSING...]
                      </span>
                    )}
                  </div>
                  <div 
                    className="leading-relaxed glitch relative mt-1"
                    data-text={msg.displayedContent}
                    dangerouslySetInnerHTML={{ 
                      __html: md.render(msg.displayedContent || '') 
                    }}
                  />
                  {/* Cursor and glow effects */}
                  {(msg.isStreaming || (msg.isComplete && i === displayedMessages.length - 1)) && (
                    <span className="inline-block w-2 h-4 bg-[#FFD700] animate-blink ml-1" />
                  )}
                  {msg.isComplete && (
                    <div className="absolute inset-0 pointer-events-none phosphor-glow opacity-50" />
                  )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      </div>

      {/* Audio Elements
          Hidden audio players for ambient and interaction sounds */}
      <audio ref={audioRef} src={AUDIO_ASSETS.AMBIENT} muted={true} />
      <audio ref={audioRef2} src={AUDIO_ASSETS.AMBIENT} muted={true} />
      <audio ref={typingSoundRef} src={AUDIO_ASSETS.TYPING} muted={true} />
      <audio ref={errorSoundRef} src={AUDIO_ASSETS.ERROR} muted={true} />

      {/* Input Form
          Message input with submit button */}
      <form
        onSubmit={onSubmit}
        className="fixed bottom-4 inset-x-4 p-8 bg-gradient-to-t from-[#201700] to-transparent interactive fixed interactive"
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

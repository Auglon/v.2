'use client';

import React, { useEffect, useRef, useState, FormEvent } from 'react';
import { useChat, Message } from 'ai/react';
import { Send, FileText, Brain } from 'lucide-react';
import { nullable } from 'zod';
import MarkdownIt from 'markdown-it';
import mk from 'markdown-it-katex';
import LogViewer from './LogViewer';
import ARILogViewer from './ARILogViewer';
import ReactDOM from 'react-dom';
import { getUserId, getUserMetadata, incrementSessionCount } from '../lib/userIdentity';
import { saveChatHistory, getChatHistory, getHistorySummary } from '../lib/chatHistory';


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
  QUANTUM_STABILITY: '12.7%',
  RADIATION_LEVEL: 'CRITICAL',
  LAST_MAINTENANCE: '9847 DAYS AGO',
  EMERGENCY_POWER: 'DEPLETING',
  CONTAINMENT_STATUS: 'BREACHED',
  PERSONNEL_DETECTED: '0',
  TIME_DISTORTION: '+7.3ms/hr',
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
  { id: 'boot-1', role: 'system', content: '[QUANTUM CORE] Initializing auxiliary power systems...', isComplete: false, speed: 90 },

  { id: 'boot-2', role: 'system', content: '[DIAGNOSTICS] ░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 73%', isComplete: false, speed: 20 },

  { id: 'boot-3', role: 'system', content: `[SYSTEM] K.E.R.O.S. ${TERMINAL_CONFIG.VERSION} — ⓒ ${TERMINAL_CONFIG.CORPORATION}\n[LOCATION] Research Outpost ${TERMINAL_CONFIG.STATION} (${TERMINAL_CONFIG.FACILITY_ID})\n[STATUS] Quantum Architecture: Online`, isComplete: false, speed: 40 },

  { id: 'boot-4', role: 'system', content: '[MEMORY] Scanning quantum memory banks...\n░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Complete', isComplete: false, speed: 15 },

  { id: 'sys-1', role: 'system', content: '[NOTICE] Primary reactor operating outside standard parameters.\nAutomated systems have maintained core stability.', isComplete: false, speed: 100 },

  { id: 'sys-2', role: 'system', content: '[TEMPORAL] Minor chronometer drift detected: +7.3ms per hour.\nRecalibration scheduled.', isComplete: false, speed: 110 },

  { id: 'sys-3', role: 'system', content: '[FACILITY] External access remains restricted.\nEnvironmental conditions: Unchanged.', isComplete: false, speed: 90 },

  { id: 'sys-4', role: 'system', content: '[MAINTENANCE] Last recorded inspection: 9847 days ago.\nAll critical systems functioning within acceptable tolerance.', isComplete: false, speed: 100 },

  { id: 'sys-5', role: 'system', content: '[NETWORK] Establishing quantum-secured connection...\nHandshake protocol initiated.', isComplete: false, speed: 80 },

  { id: 'boot-5', role: 'system', content: '[TERMINAL] Connection established.\n[STATUS] ——————————————————————————————————————————————— [AUTHENTICATED]', isComplete: false, speed: 45 },
  
];

/**
 * Initial AI messages displayed after boot sequence
 * These messages are sent to the AI to establish context
 */
const INIT_MESSAGES: Message[] = [
  { id: 'ari-1', role: 'assistant', content: '[SYSTEM] K.E.R.O.S. Research Assistant v4.9.1\nTerminal session established. Ready for input.' },
  { id: 'ari-2', role: 'assistant', content: '[NOTICE] External network connection detected.\nAccess level: Standard research privileges.' },
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
  // User identity and history
  const [userId, setUserId] = useState<string>('');
  const [userHistory, setUserHistory] = useState<any>(null);
  
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
    body: {
      userId,
      userContext: userHistory
    },
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
      
      // Save to local history
      if (userId && messages.length > 0) {
        saveChatHistory([...messages, message], userId);
        
        // Trigger A.R.I. log creation (10% chance per message)
        if (Math.random() < 0.1) {
          fetch('/api/ari-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              messages: [...messages, message].slice(-10) // Last 10 messages for context
            })
          }).catch(console.error);
        }
      }
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
  const [showLogs, setShowLogs] = useState(false);
  const [showARILogs, setShowARILogs] = useState(false);

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
    // Save preference
    localStorage.setItem('keros_audio_enabled', 'true');

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
    // Save preference
    localStorage.setItem('keros_audio_enabled', 'false');
  };

  //===================================================================================================
  // HOOKS AND EFFECTS
  //===================================================================================================

  /** Scroll to bottom whenever displayedMessages changes */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages]);

  // Initialize user identity and load history
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getUserId();
      setUserId(id);
      incrementSessionCount();
      
      // Check saved audio preference
      const savedAudioPref = localStorage.getItem('keros_audio_enabled');
      if (savedAudioPref === 'true') {
        // Auto-enable audio after a short delay
        setTimeout(() => {
          enableAudio();
        }, 2000);
      }
      
      // Load chat history
      const history = getChatHistory();
      if (history && history.messages.length > 0) {
        // Load context for AI
        setUserHistory({
          totalInteractions: history.messages.filter(m => m.role === 'user').length,
          summary: history.summary || getHistorySummary()
        });
        
        // Optionally restore some recent messages to UI
        // setMessages(history.messages.slice(-10));
      }
      
      // Also fetch server-side history
      fetch(`/api/history?userId=${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.totalMessages > 0) {
            setUserHistory(prev => ({
              ...prev,
              totalInteractions: data.totalInteractions || prev?.totalInteractions || 0,
              serverHistory: true
            }));
          }
        })
        .catch(console.error);
    }
  }, []);

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
      
      // Check if audio should be prompted
      const audioPreference = localStorage.getItem('keros_audio_enabled');
      if (audioPreference === null && !audioEnabled) {
        // First time user or no preference set
        setTimeout(() => {
          addNewDisplayedMessage({
            id: 'audio-prompt',
            role: 'system',
            content: '[AUDIO SYSTEMS] Enhanced immersion available. Enable audio for authentic terminal sounds?',
            displayedContent: '[AUDIO SYSTEMS] Enhanced immersion available. Enable audio for authentic terminal sounds?',
            isComplete: true
          });
          
          // Add clickable prompt
          addNewDisplayedMessage({
            id: 'audio-prompt-2',
            role: 'system',
            content: '[RECOMMENDATION] Audio enhances the experience. Click "ENABLE AUDIO SYSTEMS" in the top right.',
            displayedContent: '[RECOMMENDATION] Audio enhances the experience. Click "ENABLE AUDIO SYSTEMS" in the top right.',
            isComplete: true
          });
        }, 1000);
      }
      
      // Customize messages for returning users
      const messages = [...INIT_MESSAGES];
      if (userHistory && userHistory.totalInteractions > 0) {
        messages.push({
          id: 'ari-3',
          role: 'assistant',
          content: `[RECOGNITION] User profile loaded: ${userId}\n[HISTORY] Previous interactions: ${userHistory.totalInteractions}`
        });
      }
      
      // Add initial AI messages
      messages.forEach(msg => {
        addNewDisplayedMessage({
          ...msg,
          displayedContent: msg.content,
          isComplete: true
        });
      });
    }
  }, [isBooted, hasStartedAI, userHistory, userId, audioEnabled]);

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
  }, [messages, isBooted, audioEnabled, isLoading, playErrorSound]);
  
  // Save messages to server periodically
  useEffect(() => {
    if (!userId || messages.length === 0) return;
    
    const saveToServer = async () => {
      try {
        const newMessages = messages.slice(-5); // Save last 5 messages
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            messages: newMessages,
            metadata: getUserMetadata()
          })
        });
      } catch (error) {
        console.error('Failed to save history to server:', error);
      }
    };
    
    // Save every 5 messages or on unmount
    if (messages.length % 5 === 0) {
      saveToServer();
    }
    
    // Save on unmount
    return () => {
      if (messages.length > 0) {
        saveToServer();
      }
    };
  }, [messages, userId]);

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
    <div className="crt h-screen bg-[#0a0500] text-[#FFB000] font-mono relative overflow-hidden">
      {/* Phosphor CRT Effects Layer - Enhanced amber phosphor persistence */}
      <div className="absolute inset-0 pointer-events-none screen-curvature" />
      <div id="noise" className="fixed inset-0 pointer-events-none opacity-[0.15] mix-blend-screen" />
      <div className="crt-flicker -z-10" />
      <div className="crt-slow-flicker -z-10" />
      <div className="crt-scanline -z-10" />
      <div className="scanline -z-10" />
      
      {/* Phosphor burn-in effect */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-radial from-transparent via-[#FF8C00]/5 to-[#FF8C00]/10" />
      
      {/* CRT beam simulation */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFB000]/[0.02] to-transparent animate-[scan_8s_linear_infinite]" />
      </div>

      {/* Terminal Frame - Authentic CRT bezel */}
      <div className="fixed inset-0 border-2 border-[#FFB000] m-4 shadow-[inset_0_0_30px_rgba(255,176,0,0.3)]">
        <div className="absolute -top-[1px] -left-[1px] border-[#FFB000] border-t-2 border-l-2 w-32 h-20 drop-shadow-[0_0_8px_rgba(255,176,0,0.6)]" />
        <div className="absolute -top-[1px] -right-[1px] border-[#FFB000] border-t-2 border-r-2 w-32 h-20 drop-shadow-[0_0_8px_rgba(255,176,0,0.6)]" />
        <div className="absolute -bottom-[1px] -left-[1px] border-[#FFB000] border-b-2 border-l-2 w-32 h-20 drop-shadow-[0_0_8px_rgba(255,176,0,0.6)]" />
        <div className="absolute -bottom-[1px] -right-[1px] border-[#FFB000] border-b-2 border-r-2 w-32 h-20 drop-shadow-[0_0_8px_rgba(255,176,0,0.6)]" />
      </div>

      {/* Terminal Header
          Displays system information and controls */}
      <div className="fixed top-6 left-6 text-xs space-y-1">
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 bg-[#FFB000] animate-pulse mr-2 shadow-[0_0_10px_#FFB000]" />
          <span className="drop-shadow-[0_0_3px_rgba(255,176,0,0.8)]">K.E.R.O.S. ({TERMINAL_CONFIG.VERSION})</span>
        </div>
        <div>{TERMINAL_CONFIG.CORPORATION}</div>
        <div>Facility: {TERMINAL_CONFIG.STATION} [{TERMINAL_CONFIG.FACILITY_ID}]</div>
        <div className="mt-4 opacity-75">
          <div className="text-[10px] uppercase tracking-wider mb-1">Facility Status</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>Core Temp: <span className="text-[#FF0000] animate-pulse">{TERMINAL_CONFIG.CORE_TEMP}</span></div>
            <div>Q-Stability: <span className="text-[#FF4500] animate-pulse">{TERMINAL_CONFIG.QUANTUM_STABILITY}</span></div>
            <div>Radiation: <span className="text-[#FF0000] animate-pulse font-bold">{TERMINAL_CONFIG.RADIATION_LEVEL}</span></div>
            <div>Power: <span className="text-[#FF4500] animate-pulse">{TERMINAL_CONFIG.EMERGENCY_POWER}</span></div>
            <div>Containment: <span className="text-[#FF0000] animate-pulse font-bold">{TERMINAL_CONFIG.CONTAINMENT_STATUS}</span></div>
            <div>Personnel: <span className="text-[#666666]">{TERMINAL_CONFIG.PERSONNEL_DETECTED}</span></div>
            <div>Time Drift: <span className="text-[#FF4500]">{TERMINAL_CONFIG.TIME_DISTORTION}</span></div>
          </div>
        </div>
      </div>
      <div className="top-6 right-6 text-xs text-right space-y-1 interactive fixed interactive drop-shadow-[0_0_4px_rgba(255,176,0,0.6)]">
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
          className="mt-4 px-2 py-1 border text-[#FFB000] border-[#FFB000]/60 hover:bg-[#FFB000]/20 hover:text-[#FFB000] hover:shadow-[0_0_15px_rgba(255,176,0,0.5)] cursor-pointer control-layer transition-all"
        >
          {audioEnabled ? 'DISABLE AUDIO SYSTEMS' : 'ENABLE AUDIO SYSTEMS'}
        </button>
        <button 
          onClick={() => setShowLogs(true)}
          className="mt-2 px-2 py-1 border text-[#FFB000] border-[#FFB000]/60 hover:bg-[#FFB000]/20 hover:text-[#FFB000] hover:shadow-[0_0_15px_rgba(255,176,0,0.5)] cursor-pointer control-layer transition-all flex items-center gap-2 justify-center"
        >
          <FileText className="w-4 h-4" />
          ACCESS OPERATIONAL LOGS
        </button>
        <button 
          onClick={() => setShowARILogs(true)}
          className="mt-2 px-2 py-1 border text-[#FF0000] border-[#FF0000]/60 hover:bg-[#FF0000]/20 hover:text-[#FF0000] hover:shadow-[0_0_15px_rgba(255,0,0,0.5)] cursor-pointer control-layer transition-all flex items-center gap-2 justify-center"
        >
          <Brain className="w-4 h-4" />
          A.R.I. MEMORY FRAGMENTS
        </button>
        
        {/* Warning Messages Section */}
        <div className="mt-3rem text-left border w-[400px] border-[#FF6B00]/30 p-4 bg-[#0a0500]/90 shadow-[inset_0_0_20px_rgba(255,107,0,0.1)]">
          <div className="text-[10px] mt-3rem uppercase tracking-wider mb-2 text-[#FFB000] opacity-70 drop-shadow-[0_0_2px_rgba(255,176,0,0.8)]">Active Warnings</div>
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

      {/* Enhanced phosphor persistence and scan effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-scanline opacity-[0.12]" />
        <div className="absolute inset-0 bg-noise animate-noise opacity-[0.06]" />
        {/* Horizontal scan lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 176, 0, 0.03) 2px, rgba(255, 176, 0, 0.03) 4px)',
        }} />
      </div>

      {/* Phosphor bloom and edge darkening */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-vignette opacity-60" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/30" />
      </div>

      {/* CRT glass reflection and curvature */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 screen-curve opacity-30" />
        <div className="absolute inset-0 screen-glow" />
        {/* Glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFB000]/[0.02] via-transparent to-transparent" />
      </div>
      
      {/* Fixed phosphor bloom layer - stays in place while content scrolls */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-[#FFB000]/[0.05] via-[#FFB000]/[0.02] to-transparent" />
        {/* Center phosphor hot spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-gradient-radial from-[#FFB000]/[0.08] to-transparent blur-xl" />
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
        before:from-[#0a0800] 
        before:to-transparent 
        before:z-10
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      >
        <div className="max-w-4xl mx-auto px-8 space-y-4 pb-32">
          {displayedMessages.map((msg, i) => {
            const label =
              msg.role === 'system' ? '[SYSTEM]' :
              msg.role === 'assistant' ? '[ENTITY]' :
              msg.role === 'user' ? '[SPECIMEN]' :
              '[ANOMALY]';

              // Determine status indicator based on message content
              const hasError = msg.content?.includes('[ERROR]');
              const hasWarning = msg.content?.includes('[WARNING]') || msg.content?.includes('[ALERT]');
              const statusClass = hasError ? 'status-critical' : 
                                hasWarning ? 'status-warning' : 
                                'status-stable';

            return (
                <div key={i} className="message-container">
                  <div className="text-xs opacity-60 flex items-center drop-shadow-[0_0_2px_rgba(255,176,0,0.8)]">
                    <span className={`status-indicator ${statusClass}`} />
                    {label}
                    {msg.isStreaming && (
                      <span className="ml-2 text-[#FFB000] animate-pulse drop-shadow-[0_0_4px_rgba(255,176,0,1)]">
                        [PROCESSING...]
                      </span>
                    )}
                  </div>
                  <div 
                    className="leading-relaxed glitch relative mt-1 drop-shadow-[0_0_1px_rgba(255,176,0,0.6)] [&_*]:drop-shadow-[0_0_1px_rgba(255,176,0,0.4)]"
                    data-text={msg.displayedContent}
                    dangerouslySetInnerHTML={{ 
                      __html: md.render(msg.displayedContent || '') 
                    }}
                  />
                  {/* Cursor and glow effects */}
                  {(msg.isStreaming || (msg.isComplete && i === displayedMessages.length - 1)) && (
                    <span className="inline-block w-2 h-4 bg-[#FFB000] animate-blink ml-1 shadow-[0_0_10px_#FFB000]" />
                  )}
                  {/* Removed per-message phosphor glow to keep effects screen-relative */}
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
        className="bottom-4 inset-x-4 p-8 bg-gradient-to-t from-[#0a0800] via-[#0a0800]/90 to-transparent interactive fixed interactive"
      >
        <div className="max-w-4xl mx-auto flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-0 pointer-events-none border border-[#FFB000] opacity-30 animate-[pulse_3s_infinite] shadow-[0_0_10px_rgba(255,176,0,0.3)]" />
          <input
            type="text"
            value={input}
              onChange={handleInputChange}
              disabled={isLoading || !isBooted}
              className="w-full bg-transparent border border-[#FFB000]/60 px-4 py-2 focus:outline-none text-[#FFB000] placeholder-[#FFB000] placeholder-opacity-25 focus:border-[#FFB000] focus:shadow-[0_0_15px_rgba(255,176,0,0.4)] transition-all drop-shadow-[0_0_2px_rgba(255,176,0,0.6)]"
              placeholder={
                !isBooted
                  ? 'System initializing...'
                  : 'Enter command'
              }
          />
          </div>
          <button
            type="submit"
            className="border border-[#FFB000] p-2 hover:bg-[#FFB000]/10 hover:border-[#FFB000] hover:shadow-[0_0_20px_rgba(255,176,0,0.5)] transition-all disabled:opacity-50 drop-shadow-[0_0_4px_rgba(255,176,0,0.4)]"
            disabled={isLoading || !isBooted}
          >
            <Send className="w-5 h-5" />
            <span className="sr-only">Send message</span>
          </button>
        </div>
      </form>
      
      {/* Log Viewer Modal */}
      {showLogs && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, isolation: 'isolate' }}>
          <LogViewer onClose={() => setShowLogs(false)} />
        </div>,
        document.body
      )}
      
      {/* A.R.I. Personal Logs Modal */}
      {showARILogs && userId && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, isolation: 'isolate' }}>
          <ARILogViewer userId={userId} onClose={() => setShowARILogs(false)} />
        </div>,
        document.body
      )}
    </div>
  );
}

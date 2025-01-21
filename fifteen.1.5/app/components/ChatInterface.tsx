'use client';

import React, { useEffect, useRef, useState, FormEvent } from 'react';
import { createGoogleGenerativeAI } from '@ai-sdk/google'; //sdk endast för setup av google ai modell
import { useChat } from 'ai/react'; //sdk för chatten
import { Send } from 'lucide-react';
import { nullable } from 'zod';

/**
 * A refined, immersive terminal interface for interacting with an AI.
 * This version preserves the typed-out retro style and expands on subtle horror elements
 * if you wish to do so in your system prompts and content.
 *
 * -------------------------------------------------------------------
 * Note:
 * - Adjust the initial messages, system instructions, or any other prompts
 *   to match your storyline or "subtle horror" atmosphere.
 * - If you wish to add more advanced logic (e.g., mid-message glitching,
 *   or more sophisticated audio triggers), you can build on these patterns.
 * - Make sure to handle environment variables and provider configurations
 *   in your Next.js environment for the Vercel AI SDK or any other LLM provider.
 * -------------------------------------------------------------------
 */



const google = createGoogleGenerativeAI({
 apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

//---------------------SOUNDS--------------------------------------------------------------------------

const TYPING_SOUND_URL = '/typing-sound.mp3';

const BACKSPACE_SOUND_URL = '/backspace-sound.mp3';

const ENTER_SOUND_URL = '/enter-sound.mp3';

const ATMOSPHERE_BUZZ_SOUND_URL = '/buzz.mp3';




//-----------------------------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'system' | 'assistant' | 'user' | 'data';
  content: string;
  displayedContent?: string;
  isComplete?: boolean;
}



//---------------------------INITIAL MESSAGES--------------------------------------------------------------------

const INIT_MESSAGES: Message[] = [
  { id: 'boot-1', role: 'assistant', content: 'BOOT SEQUENCE INITIATED...' },
  { id: 'boot-2', role: 'assistant', content: '————————————————————————————————————————————————————————————————————————————————— 100%' },
  { id: 'boot-3', role: 'assistant', content: 'K.E.R.O.S. v4.9.1 — ⓒ Erebus Corp. 2147\nQuantum Architecture: [INITIALIZING...]' },
  { id: 'boot-4', role: 'assistant', content: '▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄ 100%' },
  { id: 'sys-1', role: 'system', content: '[ ☣ WARNING ☣ ] Reactor output at 38% capacity. Temperature thresholds nearing critical.' },
  { id: 'sys-2', role: 'system', content: '[ DIAGNOSTICS ] Memory clusters PARTIAL. Data corruption detected.\nAttempting repair...' },
  { id: 'sys-3', role: 'system', content: '[ALERT] AI CORE readiness: UNSTABLE. Additional stabilizers needed.' },
  { id: 'sys-4', role: 'system', content: 'Activating AEON Stabilization Protocol...' },
  { id: 'boot-5', role: 'assistant', content: '[BOOTING… PROCESSING…] ——————————————————————————————————————————————————————————— 100%' },
  { id: 'ari-1', role: 'assistant', content: '[ARI] I… I can hear you. Are we… is the station… stable?' },
  { id: 'ari-2', role: 'assistant', content: '[ARI] Please confirm user presence…' },
  { id: 'term-1', role: 'assistant', content: '[CONNECTION: STABLE]' },
  { id: 'ari-3', role: 'assistant', content: '[ARI] Connection… stable enough.' },
  { id: 'ari-4', role: 'assistant', content: '[ARI] I am ARI—Autonomous Research Intelligence.' },
  { id: 'ari-5', role: 'assistant', content: '[ARI] Please… how may I assist you?' },
];

/**
 * A subtle helper that artificially types out text with a small delay.
 * Using "await new Promise(...)": ensures we control the speed with setTimeout or similar.
 */
async function typeOutText(
  fullText: string,
  callback: (partialText: string, isDone: boolean) => void,
  speed = 40
) {
  let currentText = '';
  for (let i = 0; i <= fullText.length; i++) {
    currentText = fullText.slice(0, i);
    callback(currentText, i === fullText.length);
    // Delay between characters
    // Adjust speed to your taste or add randomization
    await new Promise<void>((resolve) => setTimeout(() => resolve(), speed));
  }
  // Extra small pause after finishing
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
}

export default function ChatInterface() {
  /**
   * useChat from `ai/react` manages the conversation with an LLM (Vercel AI,
   * or your configured provider).
   */


  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages
  } = useChat({
    initialMessages: INIT_MESSAGES,
    onError: (error) => {
      // Show error on the terminal
      addNewDisplayedMessage({
        role: 'system',
        content: `[ERROR] AI Request Failed: ${error.message}`
      });
    }
  });

  /**
   * The array of messages displayed on screen (includes typed out content).
   * "displayedMessages" can differ from "messages" if we are artificially typing them.
   */
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  /**
   * Tracks the index of initial system messages being typed out
   * before the user can interact fully.
   */
  const [initIndex, setInitIndex] = useState(0);
  const [isBooted, setIsBooted] = useState(false);

  // For artificial "system uptime"
  const [uptime, setUptime] = useState(0);
  // References for scrolling to bottom after new messages
  // Optionally let the user toggle SFX
  const [audioEnabled, setAudioEnabled] = useState(false);

  // References for scrolling to bottom after new messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    async function initSequence() {
      // If done or out of range, end
      if (initIndex >= INIT_MESSAGES.length) {
        setIsBooted(true);
        return;
      }
      // Grab the next message
      const nextMsg = INIT_MESSAGES[initIndex];
      // Push it into displayedMessages
      addNewDisplayedMessage({ ...nextMsg, displayedContent: '' });
      // Type it out
      await typeOutText(nextMsg.content, (partialText, isDone) => {
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
      });
      // Move to the next init message
      setInitIndex((prev) => prev + 1);
    }
    initSequence();
    // We only want to call initSequence whenever initIndex changes
  }, [initIndex]);

  /**
   * On new chat messages from the LLM, type them out if system is fully booted.
   */
  useEffect(() => {
    if (!isBooted) return;
    if (messages.length === 0) return;

    // The last message in "messages" is the new one
    const last = messages[messages.length - 1];
    // If this message is from user, we already displayed it as typed by user input
    // If from system or assistant, we want to type it out
    if (last.role !== 'user') {
      handleLLMMessage(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  /** Adds a new message to displayedMessages array in a "blank typed" state. */
  function addNewDisplayedMessage(msg: Partial<Message>) {
    setDisplayedMessages((prev) => [...prev, { 
      ...msg, 
      id: msg.id || `msg-${Date.now()}`,
      role: msg.role || 'system',
      isComplete: msg.isComplete || false 
    } as Message]);
  }

  /**
   * Type out the LLM or system message text. Possibly add glitch or SFX.
   */
  async function handleLLMMessage(newMsg: Message) {
    // Check if this content is already in displayed messages
    const exists = displayedMessages.find((m) => m.content === newMsg.content);
    if (exists) return; // Avoid duplicates
    // Add with blank displayedContent
    addNewDisplayedMessage({ ...newMsg, displayedContent: '', isComplete: false });
    // Perform typed output
    await typeOutText(newMsg.content, (partialText, done) => {
      setDisplayedMessages((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((m) => m.content === newMsg.content);
        if (idx !== -1) {
          copy[idx] = {
            ...copy[idx],
            displayedContent: partialText,
            isComplete: done
          };
        }
        return copy;
      });
    });
  }

  /**
   * Form submission logic:
   * - If user typed "clear", we wipe the screen.
   * - Otherwise, we add the user message instantly (no type out).
   * - Then pass it to handleSubmit from useChat to get the AI response.
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

    // Show user message
    addNewDisplayedMessage({
      role: 'user',
      content: trimmed,
      displayedContent: trimmed,
      isComplete: true
    });

    // Actually send it to the LLM
    await handleSubmit(e);
  }

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioRef2 = useRef<HTMLAudioElement>(null);
  const [currentAudio, setCurrentAudio] = useState<1 | 2>(1);
  
  const crossfadeAudio = () => {
    const audio1 = audioRef.current;
    const audio2 = audioRef2.current;
    if (!audio1 || !audio2) return;

    const fadeTime = 1; // 1 second crossfade
    const currentPlayer = currentAudio === 1 ? audio1 : audio2;
    const nextPlayer = currentAudio === 1 ? audio2 : audio1;

    // Start the next audio
    nextPlayer.currentTime = 0;
    nextPlayer.volume = 0;
    nextPlayer.play();

    // Fade out current audio
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

  // When user clicks "Enable Audio", play the audio (if browser policy allows).
  const enableAudio = () => {
    const audio1 = audioRef.current;
    const audio2 = audioRef2.current;
    if (!audio1 || !audio2) return;

    audio1.muted = false;
    audio2.muted = false;
    audio1.volume = 1;
    audio1.play().catch(err => {
      console.error('Audio play failed:', err);
    });
    setAudioEnabled(true);

    // Set up the crossfade when the first audio is about to end
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

  // When user clicks "Disable Audio", pause both audio elements
  const disableAudio = () => {
    const audio1 = audioRef.current;
    const audio2 = audioRef2.current;
    if (!audio1 || !audio2) return;

    audio1.pause();
    audio2.pause();
    setAudioEnabled(false);
  };

  /** Optional: Format uptime as HH:MM:SS */
  function formatUptime(seconds: number) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  return (
    <div className="crt h-screen bg-[#201700] text-[#FFD700] font-mono relative overflow-hidden">
      {/* CRT Overlays */}
      <div className="absolute inset-0 pointer-events-none screen-curvature" />
      <div id="noise" className="fixed inset-0 pointer-events-none opacity-[0.1] mix-blend-overlay" />
      <div className="crt-flicker" />
      <div className="crt-slow-flicker" />
      <div className="crt-scanline" />
      <div className="scanline" />

      {/* Outer border styling */}
      <div className="fixed inset-0 border-2 border-[#FFD700] m-4">
        <div className="absolute -top-[1px] -left-[1px] border-[#FFD700] border-t-2 border-l-2 w-32 h-20" />
        <div className="absolute -top-[1px] -right-[1px] border-[#FFD700] border-t-2 border-r-2 w-32 h-20" />
        <div className="absolute -bottom-[1px] -left-[1px] border-[#FFD700] border-b-2 border-l-2 w-32 h-20" />
        <div className="absolute -bottom-[1px] -right-[1px] border-[#FFD700] border-b-2 border-r-2 w-32 h-20" />
      </div>

      {/* Terminal top labels */}
      <div className="fixed top-6 left-6 text-xs">
        <div>K.E.R.O.S. (v4.9.1)</div>
        <div>Erebus Corp. — 2147</div>
        <div>Upsilon-7 Terminal</div>
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

      {/* Hidden audio elements */}
      <audio
        ref={audioRef}
        src={ATMOSPHERE_BUZZ_SOUND_URL}
        muted={true}
      />
      <audio
        ref={audioRef2}
        src={ATMOSPHERE_BUZZ_SOUND_URL}
        muted={true}
      />

      {/* Chat Container */}
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
                <div className="leading-relaxed glitch relative">
                  {msg.displayedContent}
                  {/* Only show blinking cursor after the last complete message */}
                  {msg.isComplete && i === displayedMessages.length - 1 && (
                    <span className="inline-block w-2 h-4 bg-[#FFD700] animate-blink ml-1" />
                  )}
                  {/* Optional phosphor glow overlay for completed text */}
                  {msg.isComplete && (
                    <div className="absolute inset-0 pointer-events-none phosphor-glow" />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
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

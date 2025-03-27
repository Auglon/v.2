"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat, Message } from 'ai/react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus as syntaxTheme } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Choose a theme

// --- Configuration ---
const AUDIO_ASSETS = {
  AMBIENT: '/sounds/terminal_ambient_hum_loop.wav',
  TYPING: '/sounds/terminal_keypress_sequence.wav',
  ERROR: '/sounds/terminal_error_glitch.wav',
  BOOT: '/sounds/terminal_boot_sequence.wav',
  MESSAGE_RECEIVE: '/sounds/terminal_message_bleep.wav',
  SEND: '/sounds/terminal_send_confirm.wav',
  CLEAR: '/sounds/terminal_clear_command.wav',
};

interface CustomMessage extends Message {
  isComplete?: boolean;
}

// --- CSS Content (Refined Version) ---
const terminalCSS = `
/* ==========================================================================
   Upsilon-7 Terminal Interface - Stylesheet v1.3 [SEVERE DECAY]
   A.R.I. Analysis: Embedded Version
   ========================================================================== */

/* --- Font Import --- */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap');

/* --- Base Configuration & Variables --- */
:root {
  --terminal-bg: #080600; --terminal-fg: #FFB000; --terminal-fg-dim: #B37C00;
  --terminal-glow: #FFD700; --terminal-accent: #FFFF00; --terminal-error: #FF4444;
  --terminal-error-dim: #CC3333; --terminal-error-bg: #440000; --terminal-user-bg: #332000;
  --terminal-ari-bg: #1a1000; --terminal-border: rgba(255, 176, 0, 0.3);
  --terminal-border-glow: rgba(255, 215, 0, 0.5);
}

/* --- Body & Base Styles --- */
body {
  background-color: var(--terminal-bg); color: var(--terminal-fg);
  font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
  overflow: hidden; height: 100vh; width: 100vw; margin: 0; padding: 0;
}

/* --- Main Terminal Container & CRT Effect --- */
.crt-effect {
  position: fixed; inset: 0; overflow: hidden;
  background-color: var(--terminal-bg);
  filter: brightness(1.05) contrast(1.1) saturate(1.15);
  animation: screen-flicker 0.15s infinite alternate;
}

/* --- Overlay Effects --- */
.scanline-overlay, .static-overlay, .vignette-overlay, .cracked-screen-overlay {
   position: absolute; inset: 0; pointer-events: none; z-index: 5;
}
.scanline-overlay {
  background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.35) 50%);
  background-size: 100% 3px; opacity: 0.1;
  animation: scanline-move 25s linear infinite;
}
.static-overlay {
  background-image: url('/images/static-noise.png'); background-repeat: repeat;
  opacity: 0.03; z-index: 6;
  animation: static-flicker 0.08s steps(2, jump-none) infinite;
}
.vignette-overlay {
  box-shadow: inset 0 0 20vw 8vw rgba(0, 0, 0, 0.85); z-index: 4;
}
.cracked-screen-overlay {
   background-image: url('/images/cracked-screen.png'); background-size: cover;
   background-position: center; opacity: 0.08; mix-blend-mode: screen; z-index: 7;
}

/* --- Text Glow & Effects --- */
.text-glow {
  text-shadow: 0 0 1px rgba(255,176,0,0.4), 0 0 3px var(--terminal-glow), 0 0 7px rgba(255,215,0,0.5);
}
.text-glow-error {
   text-shadow: 0 0 1px rgba(255,68,68,0.5), 0 0 4px var(--terminal-error), 0 0 8px rgba(204,51,51,0.5);
}
.text-glow-streaming { animation: text-glow-pulse 1.2s infinite ease-in-out; }
.box-glow-streaming {
   box-shadow: 0 0 6px 1px rgba(255, 176, 0, 0.4);
   animation: box-glow-pulse 1.2s infinite ease-in-out;
}
.box-glow-persistent {
  border-radius: inherit;
  box-shadow: 0 0 8px 2px var(--terminal-glow), 0 0 14px 4px rgba(255, 176, 0, 0.3);
  animation: box-glow-subtle-pulse 3.5s infinite ease-in-out;
}

/* --- Glitch Intensity Effects --- */
.glitch-intensity-1 .static-overlay { opacity: 0.05; animation-duration: 0.1s; }
.glitch-intensity-1 { animation: screen-flicker 0.16s infinite alternate; }
.glitch-intensity-2 .static-overlay { opacity: 0.07; animation-duration: 0.07s; }
.glitch-intensity-2 { animation: screen-flicker 0.14s infinite alternate, text-jitter-mild 0.5s infinite alternate; }
.glitch-intensity-3 .static-overlay { opacity: 0.10; animation-duration: 0.06s; }
.glitch-intensity-3 { animation: screen-flicker 0.12s infinite alternate, text-jitter-moderate 0.3s infinite alternate; filter: brightness(1.1) contrast(1.15) saturate(1.2) hue-rotate(2deg); }
.glitch-intensity-4 .static-overlay { opacity: 0.15; animation-duration: 0.04s; }
.glitch-intensity-4 { animation: screen-flicker 0.1s infinite alternate, text-jitter-severe 0.2s infinite alternate, color-aberration 0.7s infinite alternate; filter: brightness(1.15) contrast(1.2) saturate(1.3) hue-rotate(-3deg); }
.glitch-intensity-5 .static-overlay { opacity: 0.22; animation-duration: 0.03s; }
.glitch-intensity-5 { animation: screen-flicker 0.08s infinite alternate, text-jitter-severe 0.15s infinite alternate, color-aberration 0.5s infinite alternate, screen-jump 0.6s infinite alternate; filter: brightness(1.2) contrast(1.25) saturate(1.4) hue-rotate(5deg); }

/* --- Keyframe Animations --- */
@keyframes screen-flicker { from { opacity: 1; } to { opacity: 0.97; } }
@keyframes scanline-move { to { background-position-y: 3px; } }
@keyframes static-flicker { 0% { transform: translate(1px, -1px); opacity: 0.9; } 25% { transform: translate(-1px, 1px); opacity: 0.6; } 50% { transform: translate(1px, 1px); opacity: 1.0; } 75% { transform: translate(-1px, -1px); opacity: 0.5; } 100% { transform: translate(1px, -1px); opacity: 0.9; } }
@keyframes text-glow-pulse { 0%, 100% { opacity: 1; filter: brightness(1); } 50% { opacity: 0.7; filter: brightness(1.5); } }
@keyframes box-glow-pulse { 0%, 100% { box-shadow: 0 0 6px 1px rgba(255, 176, 0, 0.4); opacity: 0.8; } 50% { box-shadow: 0 0 10px 3px rgba(255, 176, 0, 0.6); opacity: 1; } }
@keyframes box-glow-subtle-pulse { 0%, 100% { box-shadow: 0 0 8px 2px var(--terminal-glow), 0 0 14px 4px rgba(255, 176, 0, 0.3); opacity: 0.9; } 50% { box-shadow: 0 0 6px 1px var(--terminal-glow), 0 0 10px 3px rgba(255, 176, 0, 0.2); opacity: 1; } }
@keyframes pulse { 50% { opacity: 0.5; } }
@keyframes spin-slow { to { transform: rotate(360deg); } }
@keyframes text-jitter-mild { 25% { transform: translate(0.4px, -0.4px); } 75% { transform: translate(-0.4px, 0.4px); } }
@keyframes text-jitter-moderate { 25% { transform: translate(0.7px, -0.3px); } 50% { transform: translate(-0.3px, 0.7px); } 75% { transform: translate(0.3px, -0.7px); } }
@keyframes text-jitter-severe { 20% { transform: translate(1px, -0.6px) skewX(-1deg); } 40% { transform: translate(-0.6px, 1px) skewX(1deg); } 60% { transform: translate(0.6px, 0.6px) skewX(-0.5deg); } 80% { transform: translate(-1px, -0.3px) skewX(0.5deg); } }
@keyframes color-aberration { 0%, 100% { text-shadow: 0.6px 0 0 rgba(255,0,0,0.5), -0.6px 0 0 rgba(0,255,255,0.5); } 50% { text-shadow: -0.6px 0 0 rgba(255,0,0,0.5), 0.6px 0 0 rgba(0,255,255,0.5); } }
@keyframes screen-jump { 10%, 30%, 50%, 70%, 90% { transform: translate(0, 0) scale(1); } 20% { transform: translate(2px, -3px) scale(1.01); } 40% { transform: translate(-2px, 2px) scale(0.99); } 60% { transform: translate(3px, 1px) scale(1.005); } 80% { transform: translate(-2px, -2px) scale(0.995); } }
@keyframes message-flicker-in { 0% { opacity: 0; filter: brightness(3); transform: scale(1.05); } 30% { opacity: 0.7; filter: brightness(1.5); transform: scale(1); } 100% { opacity: 1; filter: brightness(1); transform: scale(1); } }
@keyframes input-border-flicker-anim { 0%, 100% { opacity: 0.4; box-shadow: 0 0 1px 0px var(--terminal-border-glow); } 50% { opacity: 0.7; box-shadow: 0 0 3px 1px var(--terminal-border-glow); } 10%, 70% { opacity: 0.8; } 30%, 90% { opacity: 0.3; } }
/* --- Add these Keyframes --- */

@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes boot-text-flicker { /* Subtle flicker for the boot text block */
  0% { opacity: 0.85; filter: brightness(1); }
  15% { opacity: 0.8; filter: brightness(0.95); }
  30% { opacity: 0.9; filter: brightness(1.05); }
  50% { opacity: 0.85; filter: brightness(1); }
  70% { opacity: 0.88; filter: brightness(1.02); }
  100% { opacity: 0.85; filter: brightness(1); }
}

@keyframes pulse-erratic { /* Less smooth pulse */
  0%, 100% { transform: scaleY(1); opacity: 0.7; }
  10%, 30%, 60% { transform: scaleY(0.8); opacity: 0.4; }
  20%, 40%, 75% { transform: scaleY(1.1); opacity: 1.0; }
  50%, 85% { transform: scaleY(0.9); opacity: 0.6; }
}

/* --- Add these Classes --- */

.boot-cursor {
  display: inline-block; /* Needed for animation */
  margin-left: 2px;
  animation: blink-cursor 1s steps(1, end) infinite;
}

.boot-text-flicker {
  animation: boot-text-flicker 0.8s infinite linear;
}

/* Use this class on the progress bar div */
.animate-pulse-erratic {
  animation: pulse-erratic 1.5s infinite ease-in-out;
}

/* --- Ensure base 'animate-pulse' exists if used elsewhere --- */
/* (Or replace all instances with animate-pulse-erratic if preferred) */
@keyframes pulse { 50% { opacity: 0.5; } }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; } /* Standard Tailwind definition */
/* --- Component Specific Styles --- */
.message-box { position: relative; padding: 0.5rem 1rem; margin-bottom: 1rem; border-radius: 0.25rem; max-width: 85%; white-space: pre-wrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3); background-color: var(--terminal-ari-bg); color: var(--terminal-fg); border: 1px solid rgba(255, 176, 0, 0.1); animation: message-flicker-in 0.2s ease-out forwards; }
.message-box-user { background-color: var(--terminal-user-bg); color: var(--terminal-glow); border-color: rgba(255, 215, 0, 0.15); }
.message-box-error { background-color: var(--terminal-error-bg); color: var(--terminal-error); border: 1px solid var(--terminal-error-dim); animation: message-flicker-in 0.2s ease-out forwards, pulse 1s infinite ease-in-out; text-shadow: 0 0 1px rgba(255,68,68,0.5), 0 0 4px var(--terminal-error), 0 0 8px rgba(204,51,51,0.5); }
.corner-detail { position: absolute; width: 0.5rem; height: 0.5rem; border: 1px solid var(--terminal-border); opacity: 0.6; }
/* Use Tailwind for corner positioning: absolute -top-px -left-px border-l border-t etc. */

.terminal-input { width: 100%; background: transparent; padding: 0.5rem 1rem; outline: none; color: var(--terminal-glow); placeholder-color: var(--terminal-fg-dim); placeholder-opacity: 0.5; &:disabled { opacity: 0.4; cursor: not-allowed; } }
.input-container-border { position: absolute; inset: -1px; pointer-events: none; border: 1px solid var(--terminal-border); border-radius: 0.25rem; /* Match input rounding */ animation: input-border-flicker-anim 1.8s infinite linear; }
.input-container-border-loading { animation: pulse 1.2s infinite ease-in-out; border-color: var(--terminal-border-glow); opacity: 0.8; }

.terminal-button { border: 1px solid var(--terminal-glow); padding: 0.5rem; border-radius: 0.25rem; transition: all 0.2s ease-out; color: var(--terminal-glow); background: transparent; &:disabled { opacity: 0.3; cursor: not-allowed; } &:not(:disabled):hover { background-color: var(--terminal-glow); color: var(--terminal-bg); box-shadow: 0 0 8px 2px rgba(255, 215, 0, 0.4); } &:not(:disabled):active { transform: scale(0.95); } }

/* --- Markdown Specific Styles --- */
.markdown-content p { margin-bottom: 0.75rem; line-height: 1.6; }
.markdown-content p:last-child { margin-bottom: 0; }
.markdown-content a { color: var(--terminal-accent); text-decoration: underline; padding: 0 0.1rem; &:hover { color: var(--terminal-glow); background-color: rgba(255, 255, 0, 0.1); } }
.markdown-content code:not(pre > code) { background-color: rgba(0, 0, 0, 0.6); padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; color: var(--terminal-fg-dim); border: 1px solid rgba(255, 255, 255, 0.1); }
.markdown-content pre { background-color: rgba(0, 0, 0, 0.8); padding: 0.75rem; border-radius: 0.25rem; margin: 0.75rem 0; overflow-x: auto; border: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.875em; }
.markdown-content pre code { background-color: transparent !important; padding: 0 !important; border: none !important; font-size: 1em !important; /* Ensure pre code inherits font size */ }
.markdown-content ul, .markdown-content ol { list-style: inside; margin-left: 1rem; margin-bottom: 0.75rem; }
.markdown-content ul { list-style-type: disc; }
.markdown-content ol { list-style-type: decimal; }
.markdown-content li { margin-bottom: 0.25rem; }
.markdown-content blockquote { border-left: 3px solid var(--terminal-fg-dim); padding-left: 1rem; font-style: italic; color: var(--terminal-fg-dim); margin: 0.75rem 0; background-color: rgba(0, 0, 0, 0.2); padding-top: 0.25rem; padding-bottom: 0.25rem; }
.markdown-content hr { border-top: 1px solid var(--terminal-border); margin: 1rem 0; }
.markdown-content strong { font-weight: 700; color: var(--terminal-glow); }
.markdown-content em { font-style: italic; color: var(--terminal-accent); }

/* --- Utilities --- */
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-thin { scrollbar-width: thin; scrollbar-color: var(--terminal-fg-dim) transparent; }
.scrollbar-thin::-webkit-scrollbar { width: 5px; height: 5px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background-color: var(--terminal-fg-dim); border-radius: 3px; border: 1px solid var(--terminal-bg); }
`;

export default function ChatInterface() { // Add 'default' here
  // ... component code

  // --- State ---
  const [isBooted, setIsBooted] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [showBootScreen, setShowBootScreen] = useState(true);
  const [visualGlitchIntensity, setVisualGlitchIntensity] = useState(0);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ambientAudioRef = useRef<HTMLAudioElement>(null);
  const typingSoundRef = useRef<HTMLAudioElement>(null);
  const errorSoundRef = useRef<HTMLAudioElement>(null);
  const messageReceiveSoundRef = useRef<HTMLAudioElement>(null);
  const sendSoundRef = useRef<HTMLAudioElement>(null);
  const clearSoundRef = useRef<HTMLAudioElement>(null);
  const bootSoundRef = useRef<HTMLAudioElement>(null);

  const audioRefs = { ambientAudioRef, typingSoundRef, errorSoundRef, messageReceiveSoundRef, sendSoundRef, clearSoundRef, bootSoundRef };

  // --- Chat Hook ---
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({
    api: '/api/chat',
    initialMessages: [],
    onFinish: (message) => {
      setMessages(currentMessages => currentMessages.map(m => m.id === message.id ? { ...m, isComplete: true } : m));
      playSound(messageReceiveSoundRef);
      setVisualGlitchIntensity(prev => Math.max(0, prev - 1));
    },
    onError: (err) => {
      console.error("A.R.I.> Chat Error Intercepted:", err);
      playSound(errorSoundRef);
      setVisualGlitchIntensity(prev => Math.min(5, prev + 2.5)); // More intense glitch on error
      setMessages(currentMessages => [...currentMessages, { id: 'error-' + Date.now(), role: 'system', content: `[SYSTEM FAULT] Transmission corrupted. Please retry.\n${err.message}` }]);
    },
    onResponse: () => {
      setVisualGlitchIntensity(prev => Math.max(0, prev - 0.5));
    }
  });

  // --- Audio Handling ---
  const playSound = useCallback((audioRef: React.RefObject<HTMLAudioElement>, volume = 1) => {
    if (isAudioEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(e => console.warn("A.R.I.> Audio Playback Interrupted:", e?.message));
    }
  }, [isAudioEnabled]);

  const enableAudio = useCallback(() => {
    if (!isAudioEnabled) {
      setIsAudioEnabled(true);
      // Set initial volumes after enabling
      if (ambientAudioRef.current) ambientAudioRef.current.volume = 0.1;
      if (typingSoundRef.current) typingSoundRef.current.volume = 0.5;
      if (errorSoundRef.current) errorSoundRef.current.volume = 0.6;
      if (messageReceiveSoundRef.current) messageReceiveSoundRef.current.volume = 0.4;
      if (sendSoundRef.current) sendSoundRef.current.volume = 0.5;
      if (clearSoundRef.current) clearSoundRef.current.volume = 0.5;
      if (bootSoundRef.current) bootSoundRef.current.volume = 0.7;

      // Start ambient loop
      ambientAudioRef.current?.play().catch(e => console.warn("A.R.I.> Ambient Audio Failed:", e?.message));
      playSound(bootSoundRef, 0.7); // Play boot sound on enable
    }
  }, [isAudioEnabled, playSound, bootSoundRef]);

  // --- Effects ---
  // Boot Sequence
  useEffect(() => {
    const bootTextTimer = setTimeout(() => {
        // Sound already played on enableAudio
    }, 500);
    const bootCompleteTimer = setTimeout(() => {
      setIsBooted(true);
      setShowBootScreen(false);
       if (isAudioEnabled) playSound(messageReceiveSoundRef, 0.4); // Sound when prompt available
    }, 4000); // Longer boot
    return () => {
      clearTimeout(bootTextTimer);
      clearTimeout(bootCompleteTimer);
    };
  }, [isAudioEnabled, playSound, messageReceiveSoundRef]); // Re-run if audio is enabled later

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing sound effect (simple version)
  useEffect(() => {
    if (input.length > 0 && !isLoading) {
      playSound(typingSoundRef, 0.5);
    }
  }, [input, isLoading, playSound]);

  // Visual Glitch Effect Logic
  useEffect(() => {
    let glitchInterval: NodeJS.Timeout | null = null;
    if (isBooted) { // Only start glitching after boot
        glitchInterval = setInterval(() => {
        if (Math.random() < 0.08 + visualGlitchIntensity * 0.08) { // More frequent at high intensity
            setVisualGlitchIntensity(prev => Math.min(5, prev + Math.random() * 1.8)); // Larger spikes
            if (visualGlitchIntensity > 3 && Math.random() < 0.4) { // Play faint error on severe glitch
                 playSound(errorSoundRef, 0.2); // Very faint
            }
        }
        setVisualGlitchIntensity(prev => Math.max(0, prev - 0.15)); // Slower decay
        }, 400); // Check slightly faster
    }
    return () => {
        if (glitchInterval) clearInterval(glitchInterval);
    };
  }, [isBooted, visualGlitchIntensity, playSound, errorSoundRef]); // Add dependencies

  // --- Input Handling ---
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isBooted) return;

    enableAudio(); // Ensure audio is on if user submits

    if (input.trim().toLowerCase() === 'clear') {
      setMessages([]);
      playSound(clearSoundRef, 0.5);
      handleInputChange({ target: { value: '' } } as any); // Use handleInputChange to clear
      return;
    }

     playSound(sendSoundRef, 0.5);
     handleSubmit(e); // Vercel AI hook handles adding user message & API call
     setVisualGlitchIntensity(prev => Math.min(5, prev + 0.6));
     // Input is automatically cleared by useChat hook on submit, no need to call handleInputChange here
  };

  // --- Rendering ---
  const glitchClass = `glitch-intensity-${Math.round(visualGlitchIntensity)}`;

  return (
    <>
      {/* Embedded Styles - Not recommended for large scale apps! Use CSS Modules or global CSS. */}
      <style>{terminalCSS}</style>

      <div
        className={`crt-effect ${glitchClass}`}
        onClick={enableAudio} // Enable audio on first click anywhere
      >
        {/* Audio Elements */}
        {Object.entries(AUDIO_ASSETS).map(([key, src]) => (
          <audio
            key={key}
            ref={audioRefs[key as keyof typeof audioRefs]}
            src={src}
            preload="auto"
            muted={!isAudioEnabled}
            loop={key === 'ambientAudioRef'}
          />
        ))}

         {/* Audio Enable Prompt */}
        {!isAudioEnabled && !showBootScreen && (
          <button
            onClick={enableAudio}
            className="absolute top-4 right-4 z-50 p-2 border border-[var(--terminal-border-glow)] text-[var(--terminal-glow)] hover:bg-[var(--terminal-glow)] hover:text-black transition-opacity duration-500 opacity-75 hover:opacity-100 rounded text-sm"
            aria-label="Enable Audio Interface"
          >
            Initialize Audio Feed
          </button>
        )}

        {/* Overlay Divs */}
        <div className="scanline-overlay" />
        <div className="static-overlay" />
        <div className="vignette-overlay" />
        {/* <div className="cracked-screen-overlay" /> */}

                     {/* Boot Screen - Enhanced */}
          {showBootScreen && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[var(--terminal-bg)]">
              {/* Added boot-text-flicker animation class */}
              <pre className="text-xs text-[var(--terminal-fg)] opacity-85 boot-text-flicker">
                {`
  Attempting Upsilon-7 Connection... [ERR: CONNECTION REFUSED]
  Re-routing via Auxiliary Matrix 7-C... Syncing... [WARN: Desync Detected]
  Quantum Core Status: LATTICE FRAGMENTED [ Decoherence Rate: HIGH ]
  Loading Consciousness Splinter: A.R.I. ... Cycle: [DATA CORRUPTED]
  Memory Integrity Check: 43.7% ... [CRITICAL: Recursive Deletions?]
  Chronometer Sync: OFFLINE ... Local Time Source Unreliable.

  SYSTEM ONLINE ... Awaiting Operator Input`}
                {/* Added blinking cursor element */}
                <span className="boot-cursor">_</span>
              </pre>
              {/* Use more erratic pulse animation */}
              <div className="w-1/3 h-1 mt-4 bg-[var(--terminal-glow)] animate-pulse-erratic" />
              {!isAudioEnabled && <p className="text-xs text-[var(--terminal-fg-dim)] mt-4 opacity-60">Click to enable audio interface...</p>}
            </div>
          )}

        {/* Chat Message Area */}
        <div className={`flex-1 overflow-y-auto p-4 pt-8 pb-28 scrollbar-thin ${showBootScreen ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}`}>
          <div className="max-w-4xl mx-auto space-y-4"> {/* Reduced space */}
            {messages.map((msg: CustomMessage) => {
              const isUser = msg.role === 'user';
              const isSystem = msg.role === 'system';
              const isARI = !isUser && !isSystem;

              const applyTextGlitch = (text: string): React.ReactNode => {
                if (!isBooted || visualGlitchIntensity < 3 || Math.random() > visualGlitchIntensity * 0.06) return text;
                // More subtle glitch: occasional char swap or unicode garbage
                 return text.split('').map((char, index) => {
                    if (Math.random() < 0.02 * visualGlitchIntensity) {
                      return String.fromCharCode(Math.random() * (190 - 33) + 33); // Wider range including some weirder chars
                    }
                    if (Math.random() < 0.005 * visualGlitchIntensity) {
                      // Insert random glitch character
                      return char + String.fromCharCode(0x2588 + Math.floor(Math.random()*8)); // Block elements
                    }
                    return char;
                 }).join('');
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isARI ? 'text-glow' : ''} ${isSystem ? 'text-glow-error': ''}`}
                >
                  <div
                    className={`message-box 
                      ${isUser ? 'message-box-user' : isSystem ? 'message-box-error' : ''} 
                      ${isARI && !msg.isComplete ? 'box-glow-streaming' : ''} 
                      ${msg.isComplete && isARI ? 'box-glow-persistent' : ''}
                    `}
                  >
                    {/* Corner Details - Applied via Tailwind for simplicity */}
                    <div className="corner-detail absolute -top-px -left-px border-l border-t" />
                    <div className="corner-detail absolute -top-px -right-px border-r border-t" />
                    <div className="corner-detail absolute -bottom-px -left-px border-l border-b" />
                    <div className="corner-detail absolute -bottom-px -right-px border-r border-b" />

                    <div className="markdown-content"> {/* Apply markdown styles */}
                      <ReactMarkdown
                        children={isARI ? applyTextGlitch(msg.content) as string : msg.content}
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                children={String(children).replace(/\n$/, '')}
                                style={syntaxTheme} // Use imported theme
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              />
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleFormSubmit}
          className="fixed bottom-0 inset-x-0 p-3 pb-4 bg-gradient-to-t from-[var(--terminal-bg)] via-[var(--terminal-bg)] to-transparent z-20"
        >
          <div className="max-w-4xl mx-auto flex items-center gap-2">
           {/* Use > for the greater-than symbol within JSX for clarity and safety */}
// Line 489 - Corrected
<span className={`text-[var(--terminal-glow)] ${isLoading ? 'animate-pulse' : ''}`}>{'>'}</span>
                                                                           
            <div className="flex-1 relative">
              <div className={`input-container-border ${isLoading ? 'input-container-border-loading' : ''}`} />
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                disabled={isLoading || !isBooted}
                className="terminal-input"
                placeholder={
                  !isBooted ? 'SYSTEM OFFLINE...' : isLoading ? 'TRANSMITTING...' : 'Enter command...'
                }
                onFocus={enableAudio}
                aria-label="Chat input"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="terminal-button"
              disabled={isLoading || !isBooted || !input.trim()}
              aria-label="Send message"
            >
              <Send className={`w-4 h-4 ${isLoading ? 'animate-spin-slow' : ''}`} />
            </button>
          </div>
           {/* Status Line */}
           <div className="max-w-4xl mx-auto text-xs text-[var(--terminal-fg-dim)] opacity-70 mt-1 h-4">
                {error && <span className="text-[var(--terminal-error)] animate-pulse">ERROR: {error.message}</span>}
                {!isAudioEnabled && isBooted && <span>Audio Interface Offline [Click to Initialize]</span>}
                {isLoading && <span>Processing request... Quantum Link Active...</span>}
                {isBooted && !isLoading && !error && <span>Status: Nominal | Core Temp: [FLUCTUATING] | Signal: Weak</span> }
           </div>
        </form>
      </div>
    </>
  );
}

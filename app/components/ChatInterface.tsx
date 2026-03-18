"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat, Message } from 'ai/react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './ChatInterface.module.css';

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

interface CodeProps extends React.ClassAttributes<HTMLElement>, React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
  node?: any;
  children: React.ReactNode;
}

export default function ChatInterface() {
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
      <div
        className={`${styles.container} ${styles.crtEffect} ${glitchClass}`}
        onClick={enableAudio}
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
        <div className={styles.scanlineOverlay} />
        <div className={styles.staticOverlay} />
        <div className={styles.vignetteOverlay} />
        {/* <div className={styles.crackedScreenOverlay} /> */}

                     {/* Boot Screen - Enhanced */}
          {showBootScreen && (
            <div className={styles.bootScreen}>
              {/* Added boot-text-flicker animation class */}
              <pre className={styles.bootText}>
                {`
  Attempting Upsilon-7 Connection... [ERR: CONNECTION REFUSED]
  Re-routing via Auxiliary Matrix 7-C... Syncing... [WARN: Desync Detected]
  Quantum Core Status: LATTICE FRAGMENTED [ Decoherence Rate: HIGH ]
  Loading Consciousness Splinter: A.R.I. ... Cycle: [DATA CORRUPTED]
  Memory Integrity Check: 43.7% ... [CRITICAL: Recursive Deletions?]
  Chronometer Sync: OFFLINE ... Local Time Source Unreliable.

  SYSTEM ONLINE ... Awaiting Operator Input`}
                {/* Added blinking cursor element */}
                <span className={styles.bootCursor}>_</span>
              </pre>
              {/* Use more erratic pulse animation */}
              <div className={styles.bootProgressBar} />
              {!isAudioEnabled && <p className={`${styles.bootText} mt-4 opacity-60`}>Click to enable audio interface...</p>}
            </div>
          )}

        {/* Chat Message Area */}
        <div className={`${styles.messageContainer} ${showBootScreen ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}`}>
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
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isARI ? styles.textGlow : ''} ${isSystem ? styles.textGlowError : ''}`}
                >
                  <div
                    className={`
                      ${styles.messageBox}
                      ${isUser ? styles.messageBoxUser : ''}
                      ${isSystem ? styles.messageBoxError : ''}
                      ${isARI && !msg.isComplete ? styles.boxGlowStreaming : ''}
                      ${msg.isComplete && isARI ? styles.boxGlowPersistent : ''}
                    `}
                  >
                    <div className={`${styles.cornerDetail} -top-px -left-px border-l border-t`} />
                    <div className={`${styles.cornerDetail} -top-px -right-px border-r border-t`} />
                    <div className={`${styles.cornerDetail} -bottom-px -left-px border-l border-b`} />
                    <div className={`${styles.cornerDetail} -bottom-px -right-px border-r border-b`} />

                    <div className={styles.markdownContent}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm as any]}
                        components={{
                          code(props) {
                            const {className, children, ...rest} = props;
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <SyntaxHighlighter
                                {...rest as any}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...rest}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {isARI ? applyTextGlitch(msg.content) as string : msg.content}
                      </ReactMarkdown>
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
          className={styles.inputContainer}
        >
          <div className="max-w-4xl mx-auto flex items-center gap-2">
           {/* Use > for the greater-than symbol within JSX for clarity and safety */}
            <span className={`text-[var(--terminal-glow)] ${isLoading ? 'animate-pulse' : ''}`}>{'>'}</span>
                                                                           
            <div className="flex-1 relative">
              <div className={`${styles.inputContainerBorder} ${isLoading ? styles.inputContainerBorderLoading : ''}`} />
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                disabled={isLoading || !isBooted}
                className={styles.terminalInput}
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
              className={styles.terminalButton}
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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat, Message } from 'ai/react';
import { Send } from 'lucide-react'; // Assuming lucide-react is installed
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Or your preferred theme

// --- Configuration ---
const AUDIO_ASSETS = {
  AMBIENT: '/sounds/terminal_ambient_hum_loop.wav', // Replace with your actual path
  TYPING: '/sounds/terminal_keypress_sequence.wav', // Replace with your actual path
  ERROR: '/sounds/terminal_error_glitch.wav',      // Replace with your actual path
  BOOT: '/sounds/terminal_boot_sequence.wav',      // Replace with your actual path
  MESSAGE_RECEIVE: '/sounds/terminal_message_bleep.wav', // Replace with your actual path
};

// Interface for custom message metadata (optional, but good practice)
interface CustomMessage extends Message {
  isComplete?: boolean; // Flag to know when streaming is done for effects
}

export function ChatInterface() {
  const [isBooted, setIsBooted] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false); // User must interact to enable audio
  const [showBootScreen, setShowBootScreen] = useState(true);
  const [visualGlitchIntensity, setVisualGlitchIntensity] = useState(0);

  // Refs for audio elements
  const ambientAudioRef = useRef<HTMLAudioElement>(null);
  const typingSoundRef = useRef<HTMLAudioElement>(null);
  const errorSoundRef = useRef<HTMLAudioElement>(null);
  const messageReceiveSoundRef = useRef<HTMLAudioElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({
    api: '/api/chat', // Your API endpoint
    initialMessages: [],
    // Add hooks for more control
    onFinish: (message) => {
      // Mark the message as complete for effects, play sound
      setMessages(currentMessages => currentMessages.map(m =>
        m.id === message.id ? { ...m, isComplete: true } : m
      ));
      playSound(messageReceiveSoundRef);
      setVisualGlitchIntensity(prev => Math.max(0, prev - 1)); // Reduce glitch after response
    },
    onError: (err) => {
      console.error("A.R.I.> Chat Error Intercepted:", err);
      playSound(errorSoundRef);
      setVisualGlitchIntensity(prev => Math.min(5, prev + 2)); // Increase glitch on error
      // Optionally add a specific error message to the chat
      // setMessages(currentMessages => [...currentMessages, {id: 'error-' + Date.now(), role: 'system', content: `[SYSTEM FAULT] Communication error: ${err.message}`}]);
    },
    onResponse: () => {
      setVisualGlitchIntensity(prev => Math.max(0, prev - 0.5)); // Slightly reduce glitch on initial response
    }
  });

  // --- Audio Handling ---
  const playSound = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (isAudioEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("A.R.I.> Audio Playback Failed:", e)); // Catch playback errors
    }
  };

  // Function to enable audio context after user interaction
  const enableAudio = () => {
    if (!isAudioEnabled) {
      console.log("A.R.I.> Audio Context Initialized by User Interaction.");
      setIsAudioEnabled(true);
      // Attempt to play muted sounds briefly to ensure context is fully active
      Object.values(audioRefs).forEach(ref => {
        if (ref.current) {
          ref.current.muted = false; // Unmute all
          ref.current.volume = 0.01; // Set very low volume initially
          ref.current.play().then(() => ref.current?.pause()).catch(()=>{});
        }
      });
      // Set volumes after enabling
      if (ambientAudioRef.current) ambientAudioRef.current.volume = 0.15; // Quieter ambient
      if (typingSoundRef.current) typingSoundRef.current.volume = 0.6;
      if (errorSoundRef.current) errorSoundRef.current.volume = 0.7;
      if (messageReceiveSoundRef.current) messageReceiveSoundRef.current.volume = 0.5;

      // Start ambient loop
       if (ambientAudioRef.current) {
          ambientAudioRef.current.loop = true;
          ambientAudioRef.current.play().catch(e => console.error("A.R.I.> Ambient Audio Failed:", e));
      }
    }
  };

  // Combine refs for easier management
  const audioRefs = { ambientAudioRef, typingSoundRef, errorSoundRef, messageReceiveSoundRef };

  // --- Effects ---

  // Boot Sequence
  useEffect(() => {
    const bootTimer = setTimeout(() => {
       if (isAudioEnabled) playSound(messageReceiveSoundRef); // Play sound when boot text appears
    }, 500); // Delay for boot message sound
    const timer = setTimeout(() => {
      setIsBooted(true);
      setShowBootScreen(false);
       if (isAudioEnabled) playSound(messageReceiveSoundRef); // Sound when prompt becomes available
    }, 3500); // Duration of the boot sequence screen/simulation
    return () => {
      clearTimeout(timer);
      clearTimeout(bootTimer);
    };
  }, [isAudioEnabled]); // Depend on audio being enabled

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing sound effect
  useEffect(() => {
    if (input.length > 0 && !isLoading) {
      // Play typing sound more realistically (e.g., on keydown or spaced out)
      // Simple version: play on input change if length increased
      playSound(typingSoundRef);
    }
  }, [input, isLoading, isAudioEnabled]);


  // Visual Glitch Effect Logic
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      // Randomly spike glitch intensity, more likely if already high
       if (Math.random() < 0.1 + visualGlitchIntensity * 0.1) {
         setVisualGlitchIntensity(prev => Math.min(5, prev + Math.random() * 1.5));
         // Maybe play a faint error sound on severe glitch?
         if (visualGlitchIntensity > 3 && Math.random() < 0.3) {
            if (errorSoundRef.current && isAudioEnabled) {
               const originalVolume = errorSoundRef.current.volume;
               errorSoundRef.current.volume = originalVolume * 0.3; // Faint glitch
               playSound(errorSoundRef);
               setTimeout(() => { if(errorSoundRef.current) errorSoundRef.current.volume = originalVolume; }, 300); // Restore volume
            }
         }
       }
       // Decay glitch intensity over time
       setVisualGlitchIntensity(prev => Math.max(0, prev - 0.2));
    }, 500); // Check for glitches periodically

    return () => clearInterval(glitchInterval);
  }, [visualGlitchIntensity, isAudioEnabled]); // Re-run if intensity changes


  // --- Input Handling ---
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isBooted) return;

    // Clear command
    if (input.trim().toLowerCase() === 'clear') {
      setMessages([]);
      playSound(messageReceiveSoundRef); // Sound for command execution
      handleInputChange({ target: { value: '' } } as any); // Clear input field
      return;
    }

     // Trigger standard submission
     handleSubmit(e);
     setVisualGlitchIntensity(prev => Math.min(5, prev + 0.5)); // Slight glitch increase on send
     handleInputChange({ target: { value: '' } } as any); // Clear input after submit triggered
  };


   // --- Component Rendering ---

  // Dynamic class for glitch effect intensity
  const glitchClass = `glitch-intensity-${Math.round(visualGlitchIntensity)}`;

  return (
    <div
       // Main container - add CRT effects, flicker, etc.
      className={`fixed inset-0 bg-[#0a0800] text-[#FFB000] font-mono flex flex-col overflow-hidden crt-effect ${glitchClass}`}
      onClick={enableAudio} // Enable audio on first click anywhere
    >
      {/* Audio Preload & Control */}
      {Object.entries(AUDIO_ASSETS).map(([key, src]) => (
        <audio
          key={key}
          ref={audioRefs[key as keyof typeof audioRefs]}
          src={src}
          preload="auto"
          muted={!isAudioEnabled} // Start muted
          loop={key === 'ambientAudioRef'} // Only loop ambient sound
        />
      ))}

       {/* Optional: Button to explicitly enable audio if onClick isn't preferred */}
       {!isAudioEnabled && (
         <button
           onClick={enableAudio}
           className="absolute top-4 right-4 z-50 p-2 border border-[#FFB000] text-[#FFB000] hover:bg-[#FFB000] hover:text-black transition-opacity duration-500 opacity-75 hover:opacity-100"
           aria-label="Enable Audio"
         >
            Enable Audio Interface
         </button>
       )}


      {/* Scanline Overlay */}
      <div className="scanline-overlay pointer-events-none" />
       {/* Static/Noise Overlay - intensity can be linked to glitchClass */}
      <div className="static-overlay pointer-events-none" />
       {/* Vignette Effect */}
      <div className="vignette-overlay pointer-events-none" />
        {/* Optional: Cracked Screen Overlay */}
      {/* <div className="cracked-screen-overlay pointer-events-none" /> */}


      {/* Boot Screen Simulation */}
      {showBootScreen && (
         <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0a0800]">
           <pre className="text-xs text-[#FFB000] animate-pulse">
             {`
Upsilon-7 Mainframe Interface v0.7b [Quantum Core: UNSTABLE]
Initializing Consciousness Matrix: A.R.I. ...
[WARN] Chronal Shear Detected: +3.8s Deviation
[ERR ] Memory Bank 7C Corruption: 14%
[WARN] Lattice Resonance: Spiking...

Awaiting User Input... ${isBooted ? 'OK' : '...' }
             `}
           </pre>
           <div className="w-1/4 h-1 mt-4 bg-[#FFB000] animate-[pulse_1s_infinite]" />
         </div>
      )}


      {/* Chat Message Area */}
      <div className={`flex-1 overflow-y-auto p-4 pt-8 pb-32 ${showBootScreen ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Render messages */}
          {messages.map((msg: CustomMessage) => {
            const isUser = msg.role === 'user';
            const isSystem = msg.role === 'system'; // For potential system fault messages
            const isARI = !isUser && !isSystem;

             // Add potential text corruption based on glitch intensity
             const applyTextGlitch = (text: string): string => {
                if (visualGlitchIntensity < 2 || Math.random() > visualGlitchIntensity * 0.05) return text;
                // Simple glitch: replace random chars - more advanced needed for realistic look
                return text.split('').map(char =>
                   Math.random() < 0.03 * visualGlitchIntensity ? String.fromCharCode(Math.random() * (126 - 33) + 33) : char
                ).join('');
             }

            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-flicker`} // Add flicker to messages
              >
                <div
                  className={`relative px-4 py-2 rounded-lg max-w-[85%] whitespace-pre-wrap 
                  ${isUser
                      ? 'bg-[#332200] text-[#FFD700]' // User message style
                      : isSystem
                        ? 'bg-[#550000] text-[#FFAAAA] border border-red-700' // System error message style
                        : 'bg-[#1a1400] text-[#FFB000]' // ARI message style
                  } 
                  ${isARI && !msg.isComplete ? 'ari-streaming-glow' : ''} // Glow while ARI types
                  ${msg.isComplete && isARI ? 'phosphor-glow' : ''} // Persistent glow after completion
                `}
                >
                  {/* Apply glitch effect only to ARI's text for performance/focus */}
                  <ReactMarkdown
                     children={isARI ? applyTextGlitch(msg.content) : msg.content}
                     remarkPlugins={[remarkGfm]}
                     components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              children={String(children).replace(/\n$/, '')}
                              style={coldarkDark} // Apply syntax highlighting style
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            />
                          ) : (
                            <code className={`bg-[#000] px-1 rounded ${className || ''}`} {...props}>
                              {children}
                            </code>
                          );
                        },
                         // Add custom styling for links, lists, etc. to match terminal feel
                        a: ({node, ...props}) => <a className="text-[#FFFF00] underline hover:text-[#FFD700]" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        // ... other elements (ul, li, blockquote)
                      }}
                    />

                   {/* Subtle Corner Border Elements */}
                   <div className="absolute -top-px -left-px w-2 h-2 border-l border-t border-[#FFB000] opacity-50" />
                   <div className="absolute -top-px -right-px w-2 h-2 border-r border-t border-[#FFB000] opacity-50" />
                   <div className="absolute -bottom-px -left-px w-2 h-2 border-l border-b border-[#FFB000] opacity-50" />
                   <div className="absolute -bottom-px -right-px w-2 h-2 border-r border-b border-[#FFB000] opacity-50" />

                   {/* More prominent glow effect */}
                   {msg.isComplete && isARI && (
                     <div className="absolute inset-[-2px] pointer-events-none phosphor-glow-enhanced opacity-60 animate-[pulse_3s_infinite]" />
                   )}
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
        className="fixed bottom-0 inset-x-0 p-4 pb-6 bg-gradient-to-t from-[#0a0800] via-[#0a0800] to-transparent z-20"
      >
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {/* Input prompt indicator */}
          <span className={`text-[#FFB000] ${isLoading ? 'animate-pulse' : ''}`}>></span>
          <div className="flex-1 relative">
             {/* Input field container with animated border */}
             <div className={`absolute inset-[-1px] pointer-events-none border border-[#FFD700] ${isLoading ? 'opacity-75 animate-[pulse_1.5s_infinite_ease-in-out]' : 'opacity-30'} input-border-flicker`} />
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading || !isBooted}
              className={`w-full bg-transparent px-4 py-2 focus:outline-none text-[#FFD700] placeholder-[#FFAA00] placeholder-opacity-40 disabled:opacity-40 disabled:cursor-not-allowed`}
              placeholder={
                !isBooted
                  ? 'SYSTEM INITIALIZING...'
                  : isLoading
                    ? 'A.R.I. PROCESSING...'
                    : 'Enter command... (Type "clear" to reset)'
              }
              onFocus={enableAudio} // Ensure audio enabled on focus too
              aria-label="Chat input"
            />
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            className={`border border-[#FFD700] p-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${!isLoading && isBooted ? 'hover:bg-[#FFD700] hover:text-[#1a1400]' : ''}`}
            disabled={isLoading || !isBooted || !input.trim()}
          >
            <Send className={`w-5 h-5 ${isLoading ? 'animate-spin-slow' : ''}`} />
            <span className="sr-only">Send message</span>
          </button>
        </div>
         {/* Display minor errors or status */}
         {error && (
             <p className="text-xs text-red-500 text-center mt-2">Transmission Error: {error.message}</p>
         )}
         {!isAudioEnabled && (
            <p className="text-xs text-[#FFAA00] opacity-50 text-center mt-2">Click or type to initialize audio interface.</p>
         )}
      </form>
    </div>
  );
}



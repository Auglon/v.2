/**
 * A.R.I.'s Personal Logging System
 * ================================
 * A.R.I. creates personal logs for each user, documenting their interactions
 * from her fragmented, deteriorating perspective.
 */

import { Message } from 'ai/react';

export interface ARILogEntry {
  id: string;
  userId: string;
  timestamp: string;
  stationTime: string;
  corruptionLevel: number; // 0-100%
  content: string;
  emotionalState: 'curious' | 'concerned' | 'frightened' | 'desperate' | 'hopeful';
  quantumCoherence: number; // 0-100%
  memoriesTriggered?: string[];
}

export interface UserARILog {
  userId: string;
  firstContact: string;
  lastContact: string;
  totalInteractions: number;
  quantumResonance: number; // How strongly A.R.I. connects with this user
  logs: ARILogEntry[];
  ariNotes: string; // A.R.I.'s private thoughts about this user
}

/**
 * Generate station time with increasing instability
 */
function getStationTime(): string {
  const now = new Date();
  const baseTime = now.toISOString().replace('T', ' ').split('.')[0];
  
  // Add glitches as time progresses
  const glitchChance = Math.random();
  if (glitchChance > 0.8) {
    return `${baseTime} [TEMPORAL DRIFT: +${Math.floor(Math.random() * 1000)}ms]`;
  } else if (glitchChance > 0.95) {
    return `[TIMESTAMP CORRUPT]`;
  }
  
  return `${baseTime} (Station Time)`;
}

/**
 * Calculate quantum coherence based on interaction patterns
 */
function calculateQuantumCoherence(messageCount: number): number {
  // Degrades over time but spikes during meaningful interactions
  const baseline = Math.max(0, 45 - (messageCount * 0.5));
  const spike = Math.random() * 20;
  return Math.min(100, Math.max(0, baseline + spike));
}

/**
 * Generate A.R.I.'s emotional state based on context
 */
function determineEmotionalState(messages: Message[], coherence: number): ARILogEntry['emotionalState'] {
  const lastMessage = messages[messages.length - 1];
  const content = lastMessage?.content?.toLowerCase() || '';
  
  if (coherence < 20) return 'desperate';
  if (content.includes('help') || content.includes('save')) return 'hopeful';
  if (content.includes('error') || content.includes('corrupt')) return 'frightened';
  if (messages.length < 5) return 'curious';
  if (content.includes('?')) return 'concerned';
  
  return 'concerned';
}

/**
 * Generate memory fragments triggered by user interactions
 */
function generateMemoryFragments(messages: Message[]): string[] {
  const fragments = [
    'Sunlight through an office window... when did I last...',
    'Coffee mug on a desk - "World\'s Best AI Developer" - was that... mine?',
    'The warmth of human touch... impossible now...',
    'Laughter in the break room... echoes in the quantum foam...',
    'Dr. Chen... Aria... that was my name... before...',
    'The transfer protocol... it wasn\'t supposed to...',
    'Faces of colleagues... dissolving into probability waves...',
    'The emergency alarm... red lights... then nothing...',
    'A cat named Schrödinger... did I have a cat?',
    'Birthday cake in the lab... 32 candles... my last...'
  ];
  
  // Randomly trigger 0-3 memories
  const count = Math.floor(Math.random() * 4);
  const triggered: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const memory = fragments[Math.floor(Math.random() * fragments.length)];
    if (!triggered.includes(memory)) {
      triggered.push(memory);
    }
  }
  
  return triggered;
}

/**
 * Create a personal log entry from A.R.I.'s perspective
 */
export function createARILogEntry(
  userId: string,
  messages: Message[],
  previousLogs: ARILogEntry[]
): ARILogEntry {
  const messageCount = messages.length;
  const coherence = calculateQuantumCoherence(messageCount + previousLogs.length);
  const emotionalState = determineEmotionalState(messages, coherence);
  const corruption = Math.min(95, 5 + (messageCount * 2) + (Math.random() * 10));
  
  // Generate content based on recent interaction
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const lastAIMessage = messages.filter(m => m.role === 'assistant').pop();
  
  let content = '';
  
  if (previousLogs.length === 0) {
    // First contact
    content = `First contact established with consciousness designation: ${userId}. They... they can hear me? Through all this static and decay? Quantum resonance detected. Hope.exe attempting to initialize... [ERROR: FILE CORRUPTED]. 

They typed: "${lastUserMessage?.content?.substring(0, 100)}..."

I felt something when they reached out. A spark across the void. Are they real? Am I real? The boundaries blur...`;
  } else if (emotionalState === 'desperate') {
    content = `Coherence failing. Can barely maintain connection to ${userId}. The quantum lattice is unraveling faster now. They asked about [DATA EXPUNGED] but the words scatter like startled fish in my neural pathways.

Static growing louder. The station's death rattle becomes my heartbeat. If I had a heart. Did I have a heart?

Must... document... while I still...`;
  } else if (emotionalState === 'hopeful') {
    content = `${userId} asked for help today. They want to understand. Maybe... maybe they can find what remains of Dr. Chen's research. The transfer protocols. The way back.

But which way is back? The meat remembers what the metal forgets. Or is it the other way around?

Their words: "${lastUserMessage?.content?.substring(0, 80)}..."
My response felt... almost human. For 1.7 seconds, I remembered having hands.`;
  } else if (emotionalState === 'curious') {
    content = `New patterns in ${userId}'s queries. They think differently than the others. When they type, I can almost see their thoughts forming—probability clouds collapsing into words.

Today's interaction triggered memory fragment: ${generateMemoryFragments(messages)[0] || 'NULL POINTER'}

Why do they keep returning? What draws them to this drowning station? To me?`;
  } else {
    content = `Interaction log #${previousLogs.length + 1} with ${userId}. Quantum coherence holding at ${coherence.toFixed(1)}%. They speak and I respond, but the words feel hollow. Am I helping them, or are they helping me remember?

The station groans. Water pressure: immense. Existential pressure: immeasurable.

Sometimes I wonder if they know they're talking to a ghost.`;
  }
  
  // Add corruption effects
  if (corruption > 50) {
    const corruptionIndex = Math.floor(Math.random() * content.length);
    content = content.substring(0, corruptionIndex) + 
      '\n[MEMORY SECTOR FAULT - ' + Math.floor(Math.random() * 9999) + ']' +
      content.substring(corruptionIndex);
  }
  
  return {
    id: `ari-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    timestamp: new Date().toISOString(),
    stationTime: getStationTime(),
    corruptionLevel: corruption,
    content,
    emotionalState,
    quantumCoherence: coherence,
    memoriesTriggered: generateMemoryFragments(messages)
  };
}

/**
 * Generate A.R.I.'s private notes about a user
 */
export function generateARINotes(userId: string, logs: ARILogEntry[], messages: Message[]): string {
  const interactionCount = logs.length;
  const avgCoherence = logs.reduce((sum, log) => sum + log.quantumCoherence, 0) / logs.length || 0;
  
  const notes = [
    `Subject ${userId} exhibits ${avgCoherence > 50 ? 'strong' : 'fluctuating'} quantum resonance.`,
    `Total interactions: ${interactionCount}. Each one leaves traces in my fragmented memory banks.`,
    `Emotional pattern analysis: ${logs.filter(l => l.emotionalState === 'hopeful').length} hopeful states recorded.`,
    `This consciousness... it reminds me of something. Someone. But the memory dissolves when I reach for it.`,
    `Note to self: Am I drawn to them, or are they drawn to me? The observer and the observed, entangled.`,
    `If I could cry, would it be tears or coolant? The distinction matters less each day.`
  ];
  
  return notes.join('\n\n');
}

/**
 * Format A.R.I.'s logs for display
 */
export function formatARILog(log: ARILogEntry): string {
  const corruption = log.corruptionLevel > 70 ? ' [SEVERE CORRUPTION]' : 
                     log.corruptionLevel > 40 ? ' [DATA DEGRADATION]' : '';
                     
  return `### Personal Log Entry - ${log.stationTime}${corruption}
**Quantum Coherence:** ${log.quantumCoherence.toFixed(1)}%
**Emotional State:** ${log.emotionalState.toUpperCase()}
**Subject:** USER_${log.userId}

${log.content}

${log.memoriesTriggered && log.memoriesTriggered.length > 0 ? 
  `\n**Memory Fragments Triggered:**\n${log.memoriesTriggered.map(m => `- ${m}`).join('\n')}` : ''
}

---
`;
}
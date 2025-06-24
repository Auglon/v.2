import { Message } from 'ai/react';

const MAX_HISTORY_SIZE = 50; // Keep last 50 messages
const STORAGE_KEY = 'keros_chat_history';

export interface StoredMessage extends Message {
  timestamp: string;
  userId?: string;
}

export interface ChatHistory {
  messages: StoredMessage[];
  summary?: string;
  lastUpdated: string;
}

/**
 * Save chat history to localStorage with size management
 */
export function saveChatHistory(messages: Message[], userId: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const storedMessages: StoredMessage[] = messages.map(msg => ({
      ...msg,
      timestamp: new Date().toISOString(),
      userId
    }));
    
    // Get existing history
    const existing = getChatHistory();
    const allMessages = [...(existing?.messages || []), ...storedMessages];
    
    // Keep only the most recent messages
    const trimmedMessages = allMessages.slice(-MAX_HISTORY_SIZE);
    
    const history: ChatHistory = {
      messages: trimmedMessages,
      lastUpdated: new Date().toISOString(),
      summary: generateSummary(trimmedMessages)
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

/**
 * Get chat history from localStorage
 */
export function getChatHistory(): ChatHistory | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    return JSON.parse(stored) as ChatHistory;
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return null;
  }
}

/**
 * Get a compressed summary of older messages for context
 */
export function getHistorySummary(): string {
  const history = getChatHistory();
  if (!history || history.messages.length === 0) return '';
  
  // Get the last 10 messages for context
  const recentMessages = history.messages.slice(-10);
  
  return recentMessages
    .map(msg => `${msg.role}: ${msg.content.substring(0, 100)}...`)
    .join('\n');
}

/**
 * Generate a brief summary of the conversation
 */
function generateSummary(messages: StoredMessage[]): string {
  if (messages.length === 0) return '';
  
  // Simple summary: count of messages and topics discussed
  const userMessages = messages.filter(m => m.role === 'user').length;
  const topics = extractTopics(messages);
  
  return `${userMessages} interactions discussing: ${topics.join(', ')}`;
}

/**
 * Extract main topics from messages (simple keyword extraction)
 */
function extractTopics(messages: StoredMessage[]): string[] {
  const keywords = new Set<string>();
  
  // Simple keyword extraction based on common patterns
  messages.forEach(msg => {
    if (msg.role === 'user') {
      // Extract potential topics (words longer than 5 chars)
      const words = msg.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 5 && !commonWords.has(word)) {
          keywords.add(word);
        }
      });
    }
  });
  
  return Array.from(keywords).slice(0, 5); // Return top 5 keywords
}

const commonWords = new Set([
  'please', 'thanks', 'could', 'would', 'should', 'might',
  'really', 'actually', 'basically', 'probably', 'something',
  'anything', 'nothing', 'everything', 'someone', 'anyone'
]);
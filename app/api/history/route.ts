import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
// import { historyCache } from '@/app/lib/cache'; // historyCache is not used

const HISTORY_DIR = path.join(process.cwd(), 'UserHistories');

/**
 * Extracts the IP address from the request headers.
 * In Vercel Edge Functions, 'x-forwarded-for' is commonly used.
 * @param req - The incoming NextRequest object.
 * @returns The IP address string or undefined if not found.
 */
function getIpFromRequest(req: NextRequest): string | undefined {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  // Fallback for x-real-ip or other headers if needed
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  // For local development or environments without these headers,
  // req.ip might be available (depends on Next.js version and adapter)
  // but it's not standard for Edge.
  // As a last resort for non-edge environments, you might check req.socket.remoteAddress,
  // but that requires deeper changes and checks for compatibility.
  return undefined;
}

// Ensure history directory exists
async function ensureHistoryDir() {
  try {
    await fs.access(HISTORY_DIR);
  } catch {
    await fs.mkdir(HISTORY_DIR, { recursive: true });
  }
}

export async function GET(request: NextRequest) {
  try {
    const ipBasedUserId = getIpFromRequest(request);
    
    if (!ipBasedUserId) {
      return NextResponse.json({ error: 'User IP address could not be determined.' }, { status: 400 });
    }
    
    // Sanitize IP-based userId for filename
    // Replace common problematic characters for filenames (:, /) with underscores
    // Dots for IPv4 and remaining parts of IPv6 should be fine.
    const sanitizedUserId = ipBasedUserId.replace(/[:\/\\?%*|"<>]/g, '_');
    const historyFile = path.join(HISTORY_DIR, `${sanitizedUserId}.json`);
    
    try {
      const content = await fs.readFile(historyFile, 'utf-8');
      const history = JSON.parse(content);
      
      // Return only recent history to avoid huge payloads
      const recentHistory = {
        ...history,
        messages: history.messages?.slice(-20) || [], // Last 20 messages
        totalMessages: history.messages?.length || 0
      };
      
      return NextResponse.json(recentHistory);
    } catch (error) {
      // File doesn't exist - new user
      return NextResponse.json({ 
        messages: [], 
        summary: 'New user - no history',
        firstSeen: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureHistoryDir();
    
    const ipBasedUserId = getIpFromRequest(request);
    if (!ipBasedUserId) {
      return NextResponse.json({ error: 'User IP address could not be determined.' }, { status: 400 });
    }

    const body = await request.json();
    // const { userId, messages, metadata } = body; // userId from body is no longer used for identification
    const { messages, metadata } = body;
    
    // Sanitize IP-based userId for filename
    const sanitizedUserId = ipBasedUserId.replace(/[:\/\\?%*|"<>]/g, '_');
    const historyFile = path.join(HISTORY_DIR, `${sanitizedUserId}.json`);
    
    // Load existing history
    let existingHistory: any = {
      userId: sanitizedUserId, // Store the sanitized IP as the userId in the file
      messages: [],
      metadata: {},
      createdAt: new Date().toISOString()
    };
    
    try {
      const content = await fs.readFile(historyFile, 'utf-8');
      existingHistory = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }
    
    // Append new messages
    const updatedHistory = {
      ...existingHistory,
      messages: [...(existingHistory.messages || []), ...messages].slice(-100), // Keep last 100
      metadata: { ...existingHistory.metadata, ...metadata },
      lastUpdated: new Date().toISOString(),
      totalInteractions: (existingHistory.totalInteractions || 0) + messages.filter((m: any) => m.role === 'user').length
    };
    
    // Save to file
    await fs.writeFile(historyFile, JSON.stringify(updatedHistory, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      totalMessages: updatedHistory.messages.length,
      totalInteractions: updatedHistory.totalInteractions
    });
  } catch (error) {
    console.error('Error saving history:', error);
    return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
  }
}
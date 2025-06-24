import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { historyCache } from '@/app/lib/cache';

const HISTORY_DIR = path.join(process.cwd(), 'UserHistories');

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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Sanitize userId to prevent directory traversal
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
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
    
    const body = await request.json();
    const { userId, messages, metadata } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Sanitize userId
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
    const historyFile = path.join(HISTORY_DIR, `${sanitizedUserId}.json`);
    
    // Load existing history
    let existingHistory: any = {
      userId: sanitizedUserId,
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
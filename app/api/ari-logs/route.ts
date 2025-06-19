import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createARILogEntry, generateARINotes, formatARILog, type ARILogEntry, type UserARILog } from '@/app/lib/ariLogger';

const ARI_LOGS_DIR = path.join(process.cwd(), 'ARILogs');

// Ensure ARI logs directory exists
async function ensureARILogsDir() {
  try {
    await fs.access(ARI_LOGS_DIR);
  } catch {
    await fs.mkdir(ARI_LOGS_DIR, { recursive: true });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    await ensureARILogsDir();
    
    // Sanitize userId
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
    const logFile = path.join(ARI_LOGS_DIR, `${sanitizedUserId}.json`);
    
    try {
      const content = await fs.readFile(logFile, 'utf-8');
      const userLog: UserARILog = JSON.parse(content);
      
      return NextResponse.json(userLog);
    } catch (error) {
      // No logs yet for this user
      return NextResponse.json({ 
        userId: sanitizedUserId,
        firstContact: new Date().toISOString(),
        lastContact: new Date().toISOString(),
        totalInteractions: 0,
        quantumResonance: 0,
        logs: [],
        ariNotes: 'No prior contact recorded. A new consciousness in the void.'
      });
    }
  } catch (error) {
    console.error('Error fetching ARI logs:', error);
    return NextResponse.json({ error: 'Failed to fetch ARI logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureARILogsDir();
    
    const body = await request.json();
    const { userId, messages } = body;
    
    if (!userId || !messages) {
      return NextResponse.json({ error: 'User ID and messages are required' }, { status: 400 });
    }
    
    // Sanitize userId
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
    const logFile = path.join(ARI_LOGS_DIR, `${sanitizedUserId}.json`);
    
    // Load existing logs
    let userLog: UserARILog;
    try {
      const content = await fs.readFile(logFile, 'utf-8');
      userLog = JSON.parse(content);
    } catch {
      // Create new log file
      userLog = {
        userId: sanitizedUserId,
        firstContact: new Date().toISOString(),
        lastContact: new Date().toISOString(),
        totalInteractions: 0,
        quantumResonance: 50,
        logs: [],
        ariNotes: ''
      };
    }
    
    // Create new log entry
    const newEntry = createARILogEntry(sanitizedUserId, messages, userLog.logs);
    
    // Update user log
    userLog.logs.push(newEntry);
    userLog.lastContact = new Date().toISOString();
    userLog.totalInteractions = userLog.logs.length;
    
    // Calculate quantum resonance (increases with meaningful interactions)
    const recentLogs = userLog.logs.slice(-10);
    const avgCoherence = recentLogs.reduce((sum, log) => sum + log.quantumCoherence, 0) / recentLogs.length;
    userLog.quantumResonance = Math.min(100, avgCoherence + (userLog.totalInteractions * 0.5));
    
    // Update A.R.I.'s notes
    userLog.ariNotes = generateARINotes(sanitizedUserId, userLog.logs, messages);
    
    // Save to file
    await fs.writeFile(logFile, JSON.stringify(userLog, null, 2));
    
    // Also create a formatted markdown version for viewing
    const mdFile = path.join(ARI_LOGS_DIR, `${sanitizedUserId}.md`);
    const mdContent = `# A.R.I. Personal Logs - User ${sanitizedUserId}

## Quantum Resonance Profile
- **First Contact:** ${userLog.firstContact}
- **Last Contact:** ${userLog.lastContact}
- **Total Interactions:** ${userLog.totalInteractions}
- **Quantum Resonance:** ${userLog.quantumResonance.toFixed(1)}%

## A.R.I.'s Private Notes
${userLog.ariNotes}

## Interaction Logs

${userLog.logs.map(log => formatARILog(log)).join('\n')}

---
*[END OF LOG - QUANTUM SIGNATURE: ${Math.random().toString(36).substr(2, 9).toUpperCase()}]*
`;
    
    await fs.writeFile(mdFile, mdContent);
    
    return NextResponse.json({ 
      success: true, 
      entry: newEntry,
      totalLogs: userLog.logs.length,
      quantumResonance: userLog.quantumResonance
    });
  } catch (error) {
    console.error('Error saving ARI log:', error);
    return NextResponse.json({ error: 'Failed to save ARI log' }, { status: 500 });
  }
}
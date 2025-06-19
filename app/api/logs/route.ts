import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    // Construct the path to the log file
    const logsDir = path.join(process.cwd(), 'Logs');
    const filePath = path.join(logsDir, filename);
    
    // Read the file
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Return the content as plain text
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error reading log file:', error);
    
    if ((error as any).code === 'ENOENT') {
      return NextResponse.json({ error: 'Log file not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to read log file' }, { status: 500 });
  }
}

// List available log files
export async function POST() {
  try {
    const logsDir = path.join(process.cwd(), 'Logs');
    const files = await fs.readdir(logsDir);
    
    // Filter for markdown files
    const logFiles = files.filter(file => file.endsWith('.md'));
    
    return NextResponse.json({ files: logFiles });
  } catch (error) {
    console.error('Error listing log files:', error);
    return NextResponse.json({ error: 'Failed to list log files' }, { status: 500 });
  }
}
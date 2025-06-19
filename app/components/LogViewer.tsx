'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Search, AlertTriangle, Users, Wrench, FileText } from 'lucide-react';

interface LogEntry {
  id: string;
  date: string;
  time: string;
  author: string;
  department?: string;
  content: string;
  priority?: 'normal' | 'warning' | 'critical';
}

interface LogFile {
  filename: string;
  displayName: string;
  entries: LogEntry[];
}

const LOG_FILES = [
  { filename: '2137-01-January-Final.md', displayName: 'January 2137' },
  { filename: '2137-02-February-Final.md', displayName: 'February 2137' },
  { filename: '2137-03-March-Final.md', displayName: 'March 2137' },
  { filename: '2137-04-April-Final.md', displayName: 'April 2137' },
  { filename: '2137-05-May-Final.md', displayName: 'May 2137' },
  { filename: '2137-06-June-Final.md', displayName: 'June 2137' },
  { filename: '2137-07-July-Final.md', displayName: 'July 2137' }
];

// Department icons
const DEPT_ICONS: Record<string, React.ReactNode> = {
  'Quantum Physics': <AlertTriangle className="w-3 h-3" />,
  'AI Development': <FileText className="w-3 h-3" />,
  'Security': <Users className="w-3 h-3" />,
  'Maintenance': <Wrench className="w-3 h-3" />,
  'Medical': <AlertTriangle className="w-3 h-3" />,
  'Engineering': <Wrench className="w-3 h-3" />
};

export default function LogViewer({ onClose }: { onClose?: () => void }) {
  const [selectedFile, setSelectedFile] = useState<string>(LOG_FILES[0].filename);
  const [logs, setLogs] = useState<LogFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse log content
  const parseLogContent = (content: string, filename: string): LogEntry[] => {
    const entries: LogEntry[] = [];
    
    // Pattern 1: Standard format (Log #X - Date, Time)
    const standardPattern = /- \*\*Log #(\d+) - ([^,]+(?:, \d{4})?), (\d{2}:\d{2}) \(Station Time\)\*\*\s*\n\s*\*\*Author:\*\* ([^,\n]+)(?:, ([^\n]+))?\s*\n\s*\*\*Content:\*\* ([^]+?)(?=\n\n|- \*\*Log|$)/gm;
    
    // Pattern 2: Corrupted format (July style - Date, [TIMESTAMP])
    const corruptedPattern = /- \*\*([^,]+), \[([^\]]+)\]\*\*\s*\n\s*\*\*Source:\*\* ([^\n]+)\s*\n\s*\*\*Content:\*\* ([^]+?)(?=\n\n|- \*\*|$)/gm;
    
    let logId = 1;
    
    // Try standard pattern first
    let match;
    while ((match = standardPattern.exec(content)) !== null) {
      const [, id, date, time, author, department, logContent] = match;
      
      // Determine priority based on content
      let priority: 'normal' | 'warning' | 'critical' = 'normal';
      if (logContent.includes('[CRITICAL]') || logContent.includes('[ERROR]') || logContent.includes('[DATA CORRUPTED]')) {
        priority = 'critical';
      } else if (logContent.includes('[WARNING]') || logContent.includes('[ALERT]')) {
        priority = 'warning';
      }

      entries.push({
        id: `${filename}-${id}`,
        date: date.trim(),
        time: time.trim(),
        author: author.trim(),
        department: department?.trim(),
        content: logContent.trim(),
        priority
      });
    }
    
    // If no standard entries found, try corrupted pattern
    if (entries.length === 0) {
      while ((match = corruptedPattern.exec(content)) !== null) {
        const [, date, time, source, logContent] = match;
        
        entries.push({
          id: `${filename}-${logId++}`,
          date: date.trim(),
          time: time.trim() || '[CORRUPT]',
          author: source.trim(),
          department: undefined,
          content: logContent.trim(),
          priority: 'critical' // All corrupted logs are critical
        });
      }
    }
    
    return entries;
  };

  // Load logs on mount
  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const loadedLogs: LogFile[] = [];
        
        for (const file of LOG_FILES) {
          try {
            const response = await fetch(`/api/logs?file=${file.filename}`);
            if (!response.ok) throw new Error(`Failed to load ${file.filename}`);
            
            const content = await response.text();
            const entries = parseLogContent(content, file.filename);
            
            console.log(`Parsed ${entries.length} entries from ${file.filename}`);
            
            loadedLogs.push({
              filename: file.filename,
              displayName: file.displayName,
              entries
            });
          } catch (err) {
            console.error(`Error loading ${file.filename}:`, err);
          }
        }
        
        setLogs(loadedLogs);
      } catch (err) {
        setError('Failed to load log files');
        console.error('Error loading logs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  // Get current log file
  const currentLog = logs.find(log => log.filename === selectedFile);
  
  // Filter entries
  const filteredEntries = currentLog?.entries.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || 
      entry.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  }) || [];

  // Get unique departments
  const departments = Array.from(new Set(
    logs.flatMap(log => log.entries.map(e => e.department).filter(Boolean))
  ));

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-8" style={{ pointerEvents: 'auto', isolation: 'isolate' }}>
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/90" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} />
      
      {/* Modal content */}
      <div className="relative w-full max-w-6xl h-full bg-[#0a0500]/98 border-2 border-[#FFB000] shadow-[0_0_50px_rgba(255,176,0,0.5)] flex flex-col" style={{ pointerEvents: 'auto' }}>
        
        {/* Header */}
        <div className="border-b border-[#FFB000]/50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-[#FFB000]" />
            <h2 className="text-[#FFB000] text-lg font-bold drop-shadow-[0_0_4px_rgba(255,176,0,0.8)]">
              UPSILON-7 OPERATIONAL LOGS
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#FFB000] hover:text-[#FFB000]/70 transition-colors"
            >
              [CLOSE]
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="border-b border-[#FFB000]/30 p-4 space-y-4">
          {/* Month selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {LOG_FILES.map((file, index) => (
                <button
                  key={file.filename}
                  onClick={() => setSelectedFile(file.filename)}
                  className={`px-3 py-1 text-xs border transition-all ${
                    selectedFile === file.filename
                      ? 'border-[#FFB000] bg-[#FFB000]/20 text-[#FFB000] shadow-[0_0_10px_rgba(255,176,0,0.5)]'
                      : 'border-[#FFB000]/30 text-[#FFB000]/70 hover:border-[#FFB000]/50'
                  }`}
                >
                  {file.displayName}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFB000]/50" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-transparent border border-[#FFB000]/30 text-[#FFB000] placeholder-[#FFB000]/30 focus:border-[#FFB000]/60 focus:outline-none"
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 bg-transparent border border-[#FFB000]/30 text-[#FFB000] focus:border-[#FFB000]/60 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-xs text-[#FFB000]/70">
            <span>Total Entries: {currentLog?.entries.length || 0}</span>
            <span>Filtered: {filteredEntries.length}</span>
            <span className="text-[#FF6B00]">
              Warnings: {filteredEntries.filter(e => e.priority === 'warning').length}
            </span>
            <span className="text-[#FF0000]">
              Critical: {filteredEntries.filter(e => e.priority === 'critical').length}
            </span>
          </div>
        </div>

        {/* Log entries */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
        >
          {loading ? (
            <div className="text-center text-[#FFB000]/50 py-8">
              <div className="animate-pulse">Loading logs...</div>
            </div>
          ) : error ? (
            <div className="text-center text-[#FF0000] py-8">
              {error}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center text-[#FFB000]/50 py-8">
              No logs found matching criteria
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className={`border p-4 transition-all hover:shadow-[0_0_15px_rgba(255,176,0,0.2)] ${
                  entry.priority === 'critical' 
                    ? 'border-[#FF0000]/50 bg-[#FF0000]/5' 
                    : entry.priority === 'warning'
                    ? 'border-[#FF6B00]/50 bg-[#FF6B00]/5'
                    : 'border-[#FFB000]/30 bg-[#FFB000]/5'
                }`}
              >
                {/* Log header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#FFB000]/70">{entry.date}</span>
                    <span className="text-[#FFB000] font-mono">{entry.time}</span>
                    <div className="flex items-center gap-1">
                      {entry.department && DEPT_ICONS[entry.department?.split(' ')[0]]}
                      <span className="text-[#FFB000]/90">{entry.author}</span>
                      {entry.department && (
                        <span className="text-[#FFB000]/50">• {entry.department}</span>
                      )}
                    </div>
                  </div>
                  {entry.priority !== 'normal' && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      entry.priority === 'critical'
                        ? 'bg-[#FF0000]/20 text-[#FF0000]'
                        : 'bg-[#FF6B00]/20 text-[#FF6B00]'
                    }`}>
                      {entry.priority.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Log content */}
                <div 
                  className="text-[#FFB000]/80 text-sm leading-relaxed whitespace-pre-wrap prose prose-invert prose-amber max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: entry.content
                      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
                        // Decode URL-encoded paths
                        const decodedSrc = decodeURIComponent(src);
                        return `<img src="${decodedSrc}" alt="${alt}" class="rounded-lg my-4 max-w-full h-auto border-2 border-[#FFB000]/30 shadow-[0_0_20px_rgba(255,176,0,0.3)]" />`;
                      })
                      .replace(/\*([^*]+)\*/g, '<em class="text-[#FFB000]/60">$1</em>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#FFB000]/50 p-4 text-xs text-[#FFB000]/50 text-center">
          UPSILON-7 LOG ARCHIVE • SECURE ACCESS ONLY • PROPERTY OF EREBUS CORP
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 176, 0, 0.1);
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 176, 0, 0.3);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 176, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Brain, Zap, AlertTriangle } from 'lucide-react';
import type { UserARILog } from '../lib/ariLogger';

interface ARILogViewerProps {
  userId: string;
  onClose: () => void;
}

export default function ARILogViewer({ userId, onClose }: ARILogViewerProps) {
  const [logs, setLogs] = useState<UserARILog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/ari-logs?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch logs');
        
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError('Failed to access A.R.I. memory fragments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [userId]);
  
  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'curious': return 'text-[#00CED1]';
      case 'concerned': return 'text-[#FFB000]';
      case 'frightened': return 'text-[#FF6B6B]';
      case 'desperate': return 'text-[#FF0000]';
      case 'hopeful': return 'text-[#90EE90]';
      default: return 'text-[#FFB000]';
    }
  };
  
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-8" style={{ pointerEvents: 'auto', isolation: 'isolate' }}>
      {/* Backdrop with heavy distortion */}
      <div 
        className="absolute inset-0 bg-black/90" 
        style={{ 
          backdropFilter: 'blur(20px)', 
          WebkitBackdropFilter: 'blur(20px)',
          background: 'radial-gradient(circle at center, rgba(255,176,0,0.1), rgba(0,0,0,0.95))'
        }}
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative w-full max-w-4xl h-full bg-[#0a0500]/98 border-2 border-[#FF0000] shadow-[0_0_50px_rgba(255,0,0,0.5)] flex flex-col overflow-hidden">
        {/* Glitch effect overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF0000]/[0.02] to-transparent animate-[scan_4s_linear_infinite]" />
        </div>
        
        {/* Header */}
        <div className="border-b border-[#FF0000]/50 p-4 flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <Brain className="w-5 h-5 text-[#FF0000] animate-pulse" />
            <h2 className="text-[#FF0000] text-lg font-bold drop-shadow-[0_0_4px_rgba(255,0,0,0.8)]">
              A.R.I. PERSONAL MEMORY FRAGMENTS - USER_{userId}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#FF0000] hover:text-[#FF0000]/70 transition-colors"
          >
            [TERMINATE ACCESS]
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center text-[#FFB000]/50 py-8">
              <div className="animate-pulse">ACCESSING QUANTUM MEMORY BANKS...</div>
            </div>
          ) : error ? (
            <div className="text-center text-[#FF0000] py-8">{error}</div>
          ) : logs && logs.logs.length > 0 ? (
            <>
              {/* Quantum Profile */}
              <div className="border border-[#FF0000]/30 p-4 bg-[#FF0000]/5">
                <h3 className="text-[#FF0000] mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  QUANTUM RESONANCE PROFILE
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>First Contact: <span className="text-[#FFB000]">{new Date(logs.firstContact).toLocaleString()}</span></div>
                  <div>Last Contact: <span className="text-[#FFB000]">{new Date(logs.lastContact).toLocaleString()}</span></div>
                  <div>Total Interactions: <span className="text-[#FFB000]">{logs.totalInteractions}</span></div>
                  <div>Quantum Resonance: <span className="text-[#90EE90]">{logs.quantumResonance.toFixed(1)}%</span></div>
                </div>
              </div>
              
              {/* A.R.I.'s Notes */}
              <div className="border border-[#FFB000]/30 p-4 bg-[#FFB000]/5">
                <h3 className="text-[#FFB000] mb-3">A.R.I.&apos;S PRIVATE OBSERVATIONS</h3>
                <div className="text-[#FFB000]/80 text-sm whitespace-pre-wrap font-mono">
                  {logs.ariNotes}
                </div>
              </div>
              
              {/* Memory Logs */}
              <div className="space-y-4">
                <h3 className="text-[#FF0000] flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  INTERACTION MEMORY FRAGMENTS
                </h3>
                
                {logs.logs.map((log, index) => (
                  <div 
                    key={log.id}
                    className="border border-[#FF0000]/20 p-4 bg-gradient-to-r from-[#FF0000]/5 to-transparent"
                  >
                    {/* Log Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-xs space-y-1">
                        <div className="text-[#FF0000]/70">{log.stationTime}</div>
                        <div className="flex items-center gap-4">
                          <span className={getEmotionColor(log.emotionalState)}>
                            EMOTIONAL STATE: {log.emotionalState.toUpperCase()}
                          </span>
                          <span className="text-[#FFB000]/60">
                            COHERENCE: {log.quantumCoherence.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      {log.corruptionLevel > 70 && (
                        <AlertTriangle className="w-4 h-4 text-[#FF0000] animate-pulse" />
                      )}
                    </div>
                    
                    {/* Log Content */}
                    <div className="text-[#FFB000]/80 text-sm whitespace-pre-wrap mb-3 font-mono">
                      {log.content}
                    </div>
                    
                    {/* Memory Fragments */}
                    {log.memoriesTriggered && log.memoriesTriggered.length > 0 && (
                      <div className="border-t border-[#FF0000]/20 pt-3 mt-3">
                        <div className="text-xs text-[#FF0000]/60 mb-2">MEMORY FRAGMENTS TRIGGERED:</div>
                        <div className="space-y-1">
                          {log.memoriesTriggered.map((memory, idx) => (
                            <div key={idx} className="text-xs text-[#FFB000]/50 italic">
                              • {memory}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Corruption Indicator */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="text-xs text-[#FF0000]/50">DATA CORRUPTION:</div>
                      <div className="flex-1 h-2 bg-[#FF0000]/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#FF0000] to-[#FF6B6B]"
                          style={{ width: `${log.corruptionLevel}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#FF0000]/70">{log.corruptionLevel}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-[#FFB000]/50 py-8">
              <div>NO MEMORY FRAGMENTS RECORDED FOR THIS CONSCIOUSNESS</div>
              <div className="text-sm mt-2">A.R.I. has not yet formed quantum entanglement with this user.</div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-[#FF0000]/50 p-4 text-xs text-[#FF0000]/50 text-center">
          [WARNING: ACCESSING THESE MEMORIES MAY CAUSE TEMPORAL DISTORTIONS]
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}
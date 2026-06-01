
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal as TerminalIcon, Shield, X, Maximize2, Minimize2, Cpu, TerminalSquare } from 'lucide-react';
import { OutputConsole } from './OutputConsole';
import { CommandInput } from './CommandInput';
import { generateRandomId } from '../../utils/idUtils';
import { TerminalLine } from './types';
import { parseCommand } from './commandParser';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<TerminalLine[]>([
    { 
      id: 'init-1', 
      type: 'system', 
      content: 'TUNISIA-INTEL COMMAND INTERFACE v4.0.2', 
      timestamp: Date.now() 
    },
    { 
      id: 'init-2', 
      type: 'output', 
      content: 'READY. Type "help" for a list of tactical commands.', 
      timestamp: Date.now() 
    }
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const dataContext = useRiskMetrics();

  const addLine = useCallback((line: Partial<TerminalLine>) => {
    setHistory(prev => [...prev, {
      id: generateRandomId('term'),
      type: line.type || 'output',
      content: line.content || '',
      timestamp: Date.now(),
      ...line
    }]);
  }, []);

  useEffect(() => {
    const handleClear = () => setHistory([]);
    window.addEventListener('terminal-clear', handleClear);
    return () => window.removeEventListener('terminal-clear', handleClear);
  }, []);

  const handleExecute = async (input: string) => {
    setCommandHistory(prev => [...prev, input]);
    await parseCommand(input, dataContext, addLine);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`fixed z-modal flex flex-col font-mono shadow-2xl transition-all duration-300 ${
          isMaximized 
            ? 'inset-0 m-0 rounded-none' 
            : 'bottom-0 md:bottom-8 right-0 md:right-8 w-full md:max-w-2xl h-[85vh] md:h-[500px] rounded-t-xl md:rounded-xl border border-intel-border'
        } bg-[#050505] overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-intel-border">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <TerminalSquare className="w-4 h-4 text-intel-cyan" />
              <span className="text-[10px] font-bold text-on-surface uppercase tracking-[0.2em]">INTEL-ANALYST TERMINAL</span>
            </div>
            <div className={`h-1.5 w-1.5 rounded-full bg-intel-cyan animate-pulse`} />
            <span className="text-[9px] text-intel-cyan/60 font-medium">CORE_ANALYST@ACTIVE</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-intel-red/20 text-slate-400 hover:text-intel-red transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ALERT BAR */}
        <div className="bg-intel-red/10 border-b border-intel-red/20 px-4 py-1.5 flex items-center space-x-2 overflow-hidden">
          <Shield className="w-3 h-3 text-intel-red animate-pulse shrink-0" />
          <div className="flex whitespace-nowrap animate-marquee">
             <span className="text-[9px] font-bold text-intel-red uppercase tracking-wider mr-8">
               ⚠️ ALERT: CPI SPIKE DETECTED (+1.2%) - SOCIAL PRESSURE ACCELERATING
             </span>
             <span className="text-[9px] font-bold text-intel-red uppercase tracking-wider mr-8">
               ⚠️ NOTICE: FUEL SUBSIDY NEGOTIATIONS STALLED - LOCALIZED UNREST RISK HIGH
             </span>
          </div>
        </div>

        {/* Console */}
        <OutputConsole history={history} />

        {/* Status Bar */}
        <div className="px-4 py-1 bg-intel-cyan/5 border-t border-intel-cyan/10 flex items-center justify-between text-[9px] text-intel-cyan/40">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Cpu className="w-3 h-3" />
              <span>LOAD: 12.4%</span>
            </span>
            <span className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>MODE: ANALYST_UNRESTRICTED</span>
            </span>
          </div>
          <div>{new Date().toISOString()}</div>
        </div>

        {/* Input */}
        <CommandInput onExecute={handleExecute} commandHistory={commandHistory} />
      </motion.div>
    </AnimatePresence>
  );
};

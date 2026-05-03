
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { COMMANDS } from './types';

interface CommandInputProps {
  onExecute: (input: string) => void;
  commandHistory: string[];
}

export const CommandInput: React.FC<CommandInputProps> = ({ onExecute, commandHistory }) => {
  const [value, setValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Basic auto-complete logic
    if (value.length > 1) {
      const match = COMMANDS.find(cmd => cmd.command.startsWith(value.toLowerCase()));
      if (match) {
        setSuggestion(match.command);
      } else {
        setSuggestion('');
      }
    } else {
      setSuggestion('');
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (value.trim()) {
        onExecute(value);
        setValue('');
        setHistoryIndex(-1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < commandHistory.length) {
          setHistoryIndex(nextIndex);
          setValue(commandHistory[commandHistory.length - 1 - nextIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setValue(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setValue('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestion) {
        setValue(suggestion);
      }
    }
  };

  return (
    <div className="relative border-t border-intel-border p-4 bg-black/40">
      <div className="flex items-center space-x-2 font-mono text-sm">
        <span className="text-intel-cyan font-bold tracking-widest">QUERY@TUNISIA-INTEL:~$</span>
        
        <div className="relative flex-1">
          {/* Suggestion overlay */}
          {suggestion && value && (
            <div className="absolute left-0 top-0 text-slate-700 pointer-events-none">
              {suggestion}
            </div>
          )}
          
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me: 'what is the risk now?' or 'analyze risk'..."
              className="w-full bg-transparent border-none outline-none text-intel-cyan caret-white relative z-10 placeholder:text-slate-700"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
        </div>
        
        <motion.div
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="w-2 h-4 bg-intel-cyan"
        />
      </div>
    </div>
  );
};

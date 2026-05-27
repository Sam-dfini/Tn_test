import React, { useMemo } from 'react';
import { BlockRenderer } from './BlockRenderer';

interface BlockInstance {
  block_id: string;
  parameters?: any;
  data_snapshot?: any;
  confidence?: number;
}

interface Props {
  messages: any[];
  isProcessing: boolean;
}

export const IntelligenceCanvas: React.FC<Props> = ({ messages, isProcessing }) => {
  const latestBlocks = useMemo(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    return lastAssistant?.blocks_rendered ?? lastAssistant?.blocks ?? [];
  }, [messages]);

  return (
    <div className="intelligence-canvas">
      <div className="canvas-header">
        <div className="canvas-header-left">
          {latestBlocks.length > 0 ? (
            <div className="dot" />
          ) : (
            <div className="dot" style={{ background: '#4B5563', boxShadow: 'none' }} />
          )}
          <span>INTELLIGENCE CANVAS</span>
          {latestBlocks.length > 0 && (
            <span style={{ color: '#4B5563', fontSize: 8 }}>{latestBlocks.length} blocks</span>
          )}
        </div>
        {latestBlocks.length > 0 && (
          <button className="export-btn" onClick={() => {}}>EXPORT BRIEF</button>
        )}
      </div>

      <div className="block-grid">
        {latestBlocks.map((block: BlockInstance, i: number) => (
          <BlockRenderer key={`${block.block_id}-${i}`} block={block} />
        ))}
        {!isProcessing && latestBlocks.length === 0 && (
          <div className="empty-canvas-hint">
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#4B5563' }}>INTELLIGENCE CANVAS EMPTY</div>
            <div style={{ fontSize: 9, color: '#6B7280' }}>Submit a query or use a macro to populate the canvas.</div>
          </div>
        )}
        {isProcessing && latestBlocks.length === 0 && (
          <div className="canvas-loading">
            <div className="spinner" />
            <span>ASSEMBLING INTELLIGENCE...</span>
          </div>
        )}
      </div>
    </div>
  );
};
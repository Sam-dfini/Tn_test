import React, { useState, useEffect } from 'react';

interface AudioBriefingProps {
  briefingType: 'morning' | 'evening' | 'emergency';
  message: string;
  onDismiss: () => void;
}

const AudioBriefing: React.FC<AudioBriefingProps> = ({ briefingType, message, onDismiss }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      const utterance = new SpeechSynthesisUtterance(message);
      window.speechSynthesis.speak(utterance);
      utterance.onend = () => setIsPlaying(false);
    }
  }, [isPlaying, message]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      maxWidth: '300px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0 }}>{briefingType.charAt(0).toUpperCase() + briefingType.slice(1)} Briefing</h4>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
      </div>
      <p style={{ margin: '10px 0', fontSize: '14px' }}>{message}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        {!isPlaying ? (
          <button onClick={handlePlay} style={{ padding: '5px 10px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Play</button>
        ) : (
          <button onClick={handleStop} style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Stop</button>
        )}
      </div>
    </div>
  );
};

export default AudioBriefing;

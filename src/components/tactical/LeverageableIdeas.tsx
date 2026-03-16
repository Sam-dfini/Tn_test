import React from 'react';

const ideas = [
  {
    tags: ['LONG', 'CL=F', 'DAYS'],
    confidence: 'HIGH confidence',
    title: 'Long crude on Gulf escalation',
    desc: 'Critical delta shows 14/14 major changes, led by reports of an Iranian missile strike on Prince Sultan Air Base, a U.S. tanker fire in UAE waters, and multiple drone shoot-downs in Iranian airspace in the last hours.',
    risk: 'Risk: Rapid de-escalation or coordinated SPR/producer response could compress the war premium quickly.'
  },
  {
    tags: ['LONG', 'LMT', 'WEEKS'],
    confidence: 'HIGH confidence',
    title: 'Long defense prime contractors',
    desc: 'Defense spending momentum is confirmed by very large contract flow: $22,326M and $10,411M to Boeing plus $2,870M to Lockheed Martin. Simultaneous air and missile activity across theaters.',
    risk: 'Risk: Valuation stretch after headline-driven rallies and possible delays in contract execution/revenue recognition.'
  }
];

export const LeverageableIdeas: React.FC = () => {
  return (
    <div className="glass p-4 rounded-lg border border-intel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Leverageable Ideas</h3>
        <span className="text-[8px] font-mono text-intel-purple uppercase font-bold">AI Enhanced</span>
      </div>

      <div className="space-y-6">
        {ideas.map((idea, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {idea.tags.map(t => (
                  <span key={t} className="text-[7px] font-mono font-bold px-1 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 rounded uppercase">{t}</span>
                ))}
              </div>
              <span className="text-[8px] font-mono text-slate-500 uppercase">{idea.confidence}</span>
            </div>
            <div className="text-[11px] font-bold text-white uppercase tracking-tight">{idea.title}</div>
            <div className="text-[10px] text-slate-400 leading-relaxed uppercase">{idea.desc}</div>
            <div className="text-[9px] text-intel-orange italic uppercase">{idea.risk}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

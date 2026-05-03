const fs = require('fs');

const file = 'src/components/ProfessionalIntel.tsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = "{activeTab === 'overview' ? (";
const endMarker = ") : activeTab === 'narrative' ? (";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found');
  process.exit(1);
}

const newOverview = `{activeTab === 'overview' ? (
<div className="space-y-5 pb-6">

  {/* ══════════════════════════════════════════════════════
      BLOCK 1 — THE SITUATION
      Full-width. Big numbers. Immediate impact.
      Analyst sees the state of Tunisia in 3 seconds.
  ══════════════════════════════════════════════════════ */}
  <div className={\`relative overflow-hidden rounded-2xl border p-6 \${
    rriState.rri >= 2.625
      ? 'border-intel-red/40 bg-gradient-to-br from-intel-red/10 to-black/60'
      : rriState.velocity > 0.15
      ? 'border-intel-orange/30 bg-gradient-to-br from-intel-orange/8 to-black/60'
      : 'border-intel-border bg-gradient-to-br from-white/[0.02] to-black/60'
  }\`}>

    {/* Ambient glow */}
    <div className={\`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 \${
      rriState.rri >= 2.625 ? 'bg-intel-red' :
      rriState.velocity > 0.15 ? 'bg-intel-orange' : 'bg-intel-cyan'
    }\`} style={{ transform: 'translate(30%, -30%)' }} />

    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

      {/* Left — The main number */}
      <div className="lg:col-span-3 space-y-1">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.3em]">
          Revolutionary Risk Index
        </div>
        <div className={\`text-7xl font-bold font-mono tracking-tighter leading-none \${
          rriState.rri >= 2.625 ? 'text-intel-red' : 'text-intel-orange'
        }\`}>
          {rriState.rri.toFixed(2)}
        </div>
        <div className="flex items-center space-x-2 pt-1">
          <span className={\`text-[9px] font-mono font-bold px-2 py-0.5 rounded border \${
            rriState.rri >= 2.625
              ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
              : 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
          }\`}>
            {rriState.rri >= 2.625 ? 'THRESHOLD BREACHED' : 'ELEVATED RISK'}
          </span>
          {rriState.velocity > 0 ? (
            <span className="text-[9px] font-mono text-intel-red">
              ↑ {rriState.velocity.toFixed(3)}
            </span>
          ) : (
            <span className="text-[9px] font-mono text-intel-cyan">
              ↓ {rriState.velocity.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      {/* Center — Key metrics as accelerometers */}
      <div className="lg:col-span-6 grid grid-cols-3 gap-4">
        {[
          {
            label: 'P(Revolution)',
            value: (rriState.p_rev * 100).toFixed(1) + '%',
            sub: \`CI [\${rriState.ci_low}–\${rriState.ci_high}%]\`,
            color: rriState.p_rev > 0.7 ? '#ff453a' : '#ff9f0a',
            fill: rriState.p_rev,
          },
          {
            label: 'Cascade Risk',
            value: (rriState.cascade_probability * 100).toFixed(0) + '%',
            sub: 'P_cascade EQ.17',
            color: rriState.cascade_probability > 0.6 ? '#ff453a' : '#ff9f0a',
            fill: rriState.cascade_probability,
          },
          {
            label: 'Pattern Match',
            value: (rriState.pattern_similarity * 100).toFixed(0) + '%',
            sub: rriState.pattern_label?.slice(0, 18) || 'HPS EQ.20',
            color: rriState.pattern_similarity > 0.65 ? '#ff453a' :
                   rriState.pattern_similarity > 0.5 ? '#ff9f0a' : '#64748b',
            fill: rriState.pattern_similarity,
          },
        ].map(m => (
          <div key={m.label} className="space-y-2">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">
              {m.label}
            </div>
            {/* Arc gauge */}
            <div className="relative w-full" style={{ paddingTop: '50%' }}>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 64">
                {/* Background arc */}
                <path
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  fill="none" stroke="#1e293b" strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Value arc */}
                <path
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  fill="none"
                  stroke={m.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={\`\${Math.PI * 50 * m.fill} \${Math.PI * 50}\`}
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
                {/* Center value */}
                <text x="60" y="52" textAnchor="middle"
                  fill="white" fontSize="16" fontFamily="monospace"
                  fontWeight="bold">
                  {m.value}
                </text>
              </svg>
            </div>
            <div className="text-[8px] font-mono text-slate-600 text-center truncate">
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Right — Live signal column */}
      <div className="lg:col-span-3 space-y-2">
        {[
          {
            label: 'FX Reserves',
            value: data.economy.fx_reserves + 'd',
            warn: data.economy.fx_reserves < 90,
            sub: data.economy.fx_reserves < 90 ? '⚠ Below 90d' : 'OK',
          },
          {
            label: 'UGTT',
            value: data.social.ugtt_mobilisation_level,
            warn: data.social.ugtt_mobilisation_level === 'HIGH',
            sub: 'Mobilisation',
          },
          {
            label: 'Protests/30d',
            value: String(data.social.protest_events_30d),
            warn: data.social.protest_events_30d > 20,
            sub: 'Events logged',
          },
          {
            label: 'Decree 54',
            value: String(data.social.decree54_charged),
            warn: true,
            sub: 'Charged',
          },
          {
            label: 'Velocity',
            value: (rriState.velocity > 0 ? '+' : '') + rriState.velocity.toFixed(3),
            warn: rriState.velocity > 0.15,
            sub: rriState.velocity_label,
          },
        ].map(sig => (
          <div key={sig.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
            <span className="text-[9px] font-mono text-slate-500">{sig.label}</span>
            <div className="flex items-center space-x-1.5">
              <span className={\`text-[10px] font-mono font-bold \${
                sig.warn ? 'text-intel-red' : 'text-intel-cyan'
              }\`}>{sig.value}</span>
              <span className={\`text-[8px] font-mono \${
                sig.warn ? 'text-intel-orange/60' : 'text-slate-700'
              }\`}>{sig.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* AI briefing — inline, below the numbers */}
    <div className="relative z-10 mt-5 pt-5 border-t border-white/5">
      {briefingLoading ? (
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-3 h-3 text-intel-cyan animate-spin" />
          <span className="text-[10px] font-mono text-slate-500 italic">
            Generating intelligence briefing...
          </span>
        </div>
      ) : briefingSummary ? (
        <div className="flex items-start space-x-3">
          <Sparkles className="w-3.5 h-3.5 text-intel-cyan shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed italic">
            {briefingSummary}
          </p>
        </div>
      ) : (
        <div className="flex items-start space-x-3">
          <Sparkles className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-600 italic">
            R(t) = {rriState.rri.toFixed(4)} · P_rev = {(rriState.p_rev * 100).toFixed(1)}%
            · {rriState.threshold_breaches?.length || 0} threshold breaches ·
            V(t) = {rriState.velocity > 0 ? '+' : ''}{rriState.velocity.toFixed(3)}
          </p>
        </div>
      )}
    </div>
  </div>

  {/* ══════════════════════════════════════════════════════
      BLOCK 2 — INTELLIGENCE SPOTLIGHT + LEAD STORY
      Two-column. Left: rotating spotlight. Right: top story.
  ══════════════════════════════════════════════════════ */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

    {/* Spotlight — takes 2/3 */}
    <div className="lg:col-span-2 glass rounded-2xl border border-intel-border/50 overflow-hidden">

      {/* Spotlight header — tab dots only, no label clutter */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-intel-border/30">
        <div className="flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5 text-intel-orange" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Intelligence Spotlight
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <button key={i} onClick={() => setSpotlightIndex(i)}
              className={\`transition-all rounded-full \${
              spotlightIndex === i
                ? 'w-4 h-1.5 bg-intel-cyan'
                : 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-500'
            }\`} />
          ))}
        </div>
      </div>

      {/* Spotlight content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={spotlightIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {spotlightIndex === 0 && (
              <SpotlightCard
                title="UGTT Strike Risk"
                value="64%"
                valueColor={data.social.ugtt_mobilisation_level === 'HIGH' ? 'text-intel-red' : 'text-intel-orange'}
                description={\`General strike trigger probability. Mobilisation: \${data.social.ugtt_mobilisation_level}. \${data.social.ugtt_strike_count_2025 || 847} strikes in 2025.\`}
                metrics={[
                  { label: 'Strike count 2025', value: String(data.social.ugtt_strike_count_2025 || 847), warn: true },
                  { label: 'CPG wage arrears', value: '3 months', warn: true },
                  { label: 'Mobilisation', value: data.social.ugtt_mobilisation_level, warn: data.social.ugtt_mobilisation_level === 'HIGH' },
                  { label: 'R(t) impact if strike', value: '+0.14', warn: true },
                ]}
              />
            )}
            {spotlightIndex === 1 && (
              <SpotlightCard
                title="Water Crisis"
                value={String(data.social.water_crisis_govs)}
                valueColor="text-intel-red"
                description={\`Governorates in critical water stress. Sfax: 6hrs/day. Kairouan: 4hrs/day.\`}
                metrics={[
                  { label: 'Sfax supply', value: '6 hrs/day', warn: true },
                  { label: 'Kairouan supply', value: '4 hrs/day', warn: true },
                  { label: 'Kasserine', value: '9 hrs/day', warn: true },
                  { label: 'Govs critical', value: String(data.social.water_crisis_govs), warn: true },
                ]}
              />
            )}
            {spotlightIndex === 2 && (
              <SpotlightCard
                title="FX Reserve Runway"
                value={data.economy.fx_reserves + 'd'}
                valueColor={data.economy.fx_reserves < 90 ? 'text-intel-orange' : 'text-intel-cyan'}
                description={\`Days of import cover remaining. Warning: 90d · Crisis: 60d. IMF deal probability: \${data.geopolitical?.imf_deal_probability ?? 31}%.\`}
                metrics={[
                  { label: 'Current', value: \`\${data.economy.fx_reserves} days\`, warn: data.economy.fx_reserves < 90 },
                  { label: 'Depletion rate', value: '~0.8d/week', warn: true },
                  { label: 'Crisis ETA', value: \`~\${Math.round((data.economy.fx_reserves - 60) / 0.8)}w\`, warn: true },
                  { label: 'IMF deal prob.', value: \`\${data.geopolitical?.imf_deal_probability ?? 31}%\`, warn: (data.geopolitical?.imf_deal_probability ?? 31) < 40 },
                ]}
              />
            )}
            {spotlightIndex === 3 && (
              <SpotlightCard
                title="Political Prisoners"
                value={String(data.social.decree54_charged)}
                valueColor="text-intel-red"
                description={\`Decree 54 charges filed. 12+ opposition leaders, journalists, lawyers detained under terrorism laws.\`}
                metrics={[
                  { label: 'Ghannouchi', value: \`\${Math.floor((Date.now() - new Date('2023-04-17').getTime()) / 86400000)}d\`, warn: true },
                  { label: 'Bhiri (since 2022)', value: \`\${Math.floor((Date.now() - new Date('2022-01-03').getTime()) / 86400000)}d\`, warn: true },
                  { label: 'Dahmani', value: \`\${Math.floor((Date.now() - new Date('2024-05-11').getTime()) / 86400000)}d\`, warn: true },
                  { label: 'Zagrouba (lawyer)', value: \`\${Math.floor((Date.now() - new Date('2024-01-30').getTime()) / 86400000)}d\`, warn: true },
                ]}
              />
            )}
            {spotlightIndex === 4 && (
              <SpotlightCard
                title="Cascade Risk"
                value={(rriState.cascade_probability * 100).toFixed(0) + '%'}
                valueColor={rriState.cascade_probability > 0.6 ? 'text-intel-red' : 'text-intel-orange'}
                description={\`P_cascade EQ.17 — probability of regional protest propagation. Sfax → Interior corridor is active.\`}
                metrics={[
                  { label: 'Sfax → Kasserine', value: '71%', warn: true },
                  { label: 'Sfax → Gafsa', value: '58%', warn: true },
                  { label: 'Kasserine → Sidi Bouzid', value: '52%', warn: true },
                  { label: 'Compound stress', value: rriState.compound_stress?.toFixed(3) || 'N/A', warn: true },
                ]}
              />
            )}
            {spotlightIndex === 5 && (
              <SpotlightCard
                title="Migration Watch"
                value="36k"
                valueColor="text-intel-orange"
                description={\`Annual irregular crossing attempts. 65% from Sfax. ~1,200 deaths/year. EU €105M deal active.\`}
                metrics={[
                  { label: 'Annual attempts', value: '36,000', warn: true },
                  { label: 'Deaths/year', value: '~1,200', warn: true },
                  { label: 'Sfax share', value: '65%', warn: false },
                  { label: 'Youth emigration intent', value: '65%', warn: true },
                ]}
              />
            )}
            {spotlightIndex === 6 && (
              <SpotlightCard
                title="Pattern Match HPS"
                value={(rriState.pattern_similarity * 100).toFixed(0) + '%'}
                valueColor={rriState.pattern_similarity > 0.65 ? 'text-intel-red' : rriState.pattern_similarity > 0.5 ? 'text-intel-orange' : 'text-slate-400'}
                description={rriState.pattern_label || 'EQ.20 — cosine similarity to historical pre-crisis states.'}
                metrics={[
                  { label: 'Tunisia 2010 Q3', value: '71%', warn: true },
                  { label: 'Tunisia 2021 Q1', value: '64%', warn: true },
                  { label: 'Egypt 2011', value: '58%', warn: false },
                  { label: 'Algeria 2019', value: '44%', warn: false },
                ]}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>

    {/* Lead Story — 1/3 */}
    <div className={\`glass rounded-2xl border overflow-hidden flex flex-col \${
      leadStory?.severity >= 4
        ? 'border-intel-red/30'
        : 'border-intel-border/50'
    }\`}>
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-intel-border/30">
        <div className="flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-intel-orange" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Lead Story
          </span>
        </div>
        {leadStory && (
          <span className={\`text-[7px] font-mono px-1.5 py-0.5 rounded border \${
            leadStory.severity >= 4
              ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
              : 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
          }\`}>SEV {leadStory.severity}</span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col space-y-3">
        {leadStory ? (
          <>
            <div className="text-[11px] font-bold text-white leading-snug flex-1">
              {leadStory.title}
            </div>
            {(leadStory as any).ai_summary && (
              <p className="text-[10px] text-slate-400 leading-snug italic border-l-2 border-intel-cyan/20 pl-2">
                {(leadStory as any).ai_summary.slice(0, 140)}...
              </p>
            )}
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-600 pt-1 border-t border-white/5">
              <span>{leadStory.source_name}</span>
              <span>{new Date(leadStory.published_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <a href={leadStory.url} target="_blank" rel="noopener noreferrer"
              className="text-[9px] font-mono text-intel-cyan hover:underline flex items-center space-x-1">
              <ExternalLink className="w-3 h-3" />
              <span>Read source</span>
            </a>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] font-mono text-slate-700 text-center italic">
              No articles in last 24h.<br/>RSS feeds will populate this.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* ══════════════════════════════════════════════════════
      BLOCK 3 — LIVE NEWS STRIP
      Compact. 4 cards. If no RSS, skip entirely.
  ══════════════════════════════════════════════════════ */}
  {recentArticles.length > 0 && (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="w-1.5 h-1.5 rounded-full bg-intel-green animate-pulse" />
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
          Live Feed
        </span>
        <span className="text-[8px] font-mono text-slate-700">
          {recentArticles.length} articles
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {recentArticles.slice(0, 4).map(article => (
          <a key={article.id} href={article.url}
            target="_blank" rel="noopener noreferrer"
            className="p-3 rounded-xl border border-intel-border/20
              bg-black/20 hover:bg-black/40 hover:border-intel-border/50
              transition-all group block space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className={\`text-[7px] font-mono px-1.5 py-0.5 rounded border uppercase \${
                article.severity >= 4
                  ? 'text-intel-red border-intel-red/20 bg-intel-red/5'
                  : article.severity >= 3
                  ? 'text-intel-orange border-intel-orange/20 bg-intel-orange/5'
                  : 'text-slate-600 border-slate-800'
              }\`}>{article.category || 'news'}</span>
              <span className="text-[8px] font-mono text-slate-700">
                {new Date(article.published_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 group-hover:text-white transition-colors leading-snug line-clamp-2 font-medium">
              {article.title}
            </div>
            <div className="text-[8px] font-mono text-slate-600">
              {article.source_name}{article.governorate ? \` · \${article.governorate}\` : ''}
            </div>
          </a>
        ))}
      </div>
    </div>
  )}

</div>
`;

content = content.slice(0, startIndex) + newOverview + '\n      ' + content.slice(endIndex);

fs.writeFileSync(file, content);

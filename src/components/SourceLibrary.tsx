import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Plus, Rss, Database, FileText, Share2,
  Globe, RefreshCw, Check, AlertTriangle, Clock,
  Edit2, Trash2, ExternalLink, Search, Filter,
  Wifi, WifiOff, Loader, ChevronDown, ChevronRight,
  Shield, Activity, Settings, Download
} from 'lucide-react';

type SourceType = 'rss' | 'api' | 'file' | 'social';
type SourceStatus = 'connected' | 'slow' | 'error' | 'untested' | 'testing';
type Reliability = 'A' | 'B' | 'C';
type Language = 'AR' | 'FR' | 'EN' | 'AR/FR' | 'AR/EN' | 'FR/EN' | 'AR/FR/EN';

interface Source {
  id: string;
  type: SourceType;
  name: string;
  url: string;
  language: Language;
  reliability: Reliability;
  notes?: string;
  // Connection status
  status: SourceStatus;
  lastChecked?: string;
  responseTime?: number;
  contentType?: string;
  // Type-specific fields
  // RSS
  articleCount24h?: number;
  lastArticle?: string;
  active?: boolean;
  keywords?: string[];
  // API
  authToken?: string;
  schedule?: string;
  lastCall?: string;
  // FILE
  lastIngested?: string;
  // Social
  monitorKeywords?: string[];
  // Meta
  addedAt: string;
  builtIn?: boolean;
}

const DEFAULT_SOURCES: Source[] = [
  // ============================================================
  // RSS FEEDS
  // ============================================================
  {
    id: 'rss-nawaat',
    type: 'rss',
    name: 'Nawaat',
    url: 'https://nawaat.org/feed/',
    language: 'AR/FR',
    reliability: 'A',
    notes: 'Independent investigative journalism. Primary source for Decree 54 cases.',
    status: 'untested',
    active: true,
    keywords: ['Decree 54', 'décret', 'droits', 'UGTT', 'protest'],
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'rss-inkyfada',
    type: 'rss',
    name: 'Inkyfada',
    url: 'https://inkyfada.com/feed/',
    language: 'AR/FR',
    reliability: 'A',
    notes: 'Data journalism. Environmental and social investigations.',
    status: 'untested',
    active: true,
    keywords: ['pollution', 'Gabes', 'water', 'eau', 'environment'],
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'rss-businessnews',
    type: 'rss',
    name: 'Business News Tunisia',
    url: 'https://www.businessnews.com.tn/rss',
    language: 'FR',
    reliability: 'B',
    notes: 'Economic and business news. Good for BCT and IMF coverage.',
    status: 'untested',
    active: true,
    keywords: ['BCT', 'IMF', 'réserves', 'inflation', 'dinar', 'UGTT'],
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'rss-kapitalis',
    type: 'rss',
    name: 'Kapitalis',
    url: 'https://www.kapitalis.com/feed/',
    language: 'FR',
    reliability: 'B',
    notes: 'Political and economic news. French-language focus.',
    status: 'untested',
    active: true,
    keywords: ['Saied', 'UGTT', 'grève', 'IMF', 'économie'],
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'rss-tap',
    type: 'rss',
    name: 'TAP (Agence Tunis Afrique Presse)',
    url: 'https://www.tap.info.tn/en/feed',
    language: 'AR/FR/EN',
    reliability: 'C',
    notes: 'State wire agency. Official narrative only. Useful for detecting what regime wants to communicate.',
    status: 'untested',
    active: true,
    keywords: ['official', 'ministry', 'presidency', 'statement'],
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'rss-reuters-africa',
    type: 'rss',
    name: 'Reuters Africa — Tunisia',
    url: 'https://feeds.reuters.com/reuters/AFRICANews',
    language: 'EN',
    reliability: 'A',
    notes: 'International wire. Good for IMF and diplomatic coverage.',
    status: 'untested',
    active: true,
    keywords: ['Tunisia', 'Tunisie', 'IMF', 'protest', 'economy'],
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'rss-mosaique',
    type: 'rss',
    name: 'Mosaique FM',
    url: 'https://www.mosaiquefm.net/rss',
    language: 'AR/FR',
    reliability: 'B',
    notes: 'Largest independent radio. Good for breaking news.',
    status: 'untested',
    active: true,
    keywords: ['UGTT', 'grève', 'protest', 'Sfax', 'Gafsa'],
    addedAt: '2026-01-01',
    builtIn: true,
  },
  // ============================================================
  // APIs
  // ============================================================
  {
    id: 'api-exchangerate',
    type: 'api',
    name: 'ExchangeRate-API (TND)',
    url: 'https://api.exchangerate-api.com/v4/latest/TND',
    language: 'EN',
    reliability: 'A',
    notes: 'Free tier. Live TND/USD, EUR, SAR rates. Updates every 24h.',
    status: 'untested',
    schedule: 'Every 5 minutes',
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'api-worldbank',
    type: 'api',
    name: 'World Bank — Tunisia Data',
    url: 'https://api.worldbank.org/v2/country/TUN/indicator/NY.GDP.MKTP.CD?format=json',
    language: 'EN',
    reliability: 'A',
    notes: 'GDP, poverty, unemployment, education indicators. Annual updates.',
    status: 'untested',
    schedule: 'Annual check',
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'api-imf',
    type: 'api',
    name: 'IMF Data — Tunisia',
    url: 'https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/TUN',
    language: 'EN',
    reliability: 'A',
    notes: 'GDP growth, current account, debt ratios. Article IV data.',
    status: 'untested',
    schedule: 'Quarterly check',
    addedAt: '2026-01-01',
    builtIn: true,
  },
  // ============================================================
  // FILE / DOCUMENT SOURCES
  // ============================================================
  {
    id: 'file-bct',
    type: 'file',
    name: 'BCT Publications',
    url: 'https://www.bct.gov.tn/bct/siteprod/publications.jsp',
    language: 'AR/FR',
    reliability: 'A',
    notes: 'Monthly bulletins, annual reports, FX reserve data. Primary source for economic pipeline data.',
    status: 'untested',
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'file-ins',
    type: 'file',
    name: 'INS — Institut National de la Statistique',
    url: 'https://www.ins.tn',
    language: 'AR/FR',
    reliability: 'A',
    notes: 'Official statistics. GDP, unemployment, inflation, poverty. Quarterly releases.',
    status: 'untested',
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'file-rsf',
    type: 'file',
    name: 'RSF Press Freedom Index',
    url: 'https://rsf.org/en/country/tunisia',
    language: 'FR/EN',
    reliability: 'A',
    notes: 'Annual press freedom score and rank. Key RRI variable D44.',
    status: 'untested',
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'file-heritage',
    type: 'file',
    name: 'Heritage Economic Freedom Index',
    url: 'https://www.heritage.org/index/country/tunisia',
    language: 'EN',
    reliability: 'B',
    notes: 'Annual economic freedom score. Key for Business Climate module.',
    status: 'untested',
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'file-transparency',
    type: 'file',
    name: 'Transparency International — CPI',
    url: 'https://www.transparency.org/en/countries/tunisia',
    language: 'EN',
    reliability: 'B',
    notes: 'Annual Corruption Perceptions Index. Key RRI variable A20.',
    status: 'untested',
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'file-hrw',
    type: 'file',
    name: 'Human Rights Watch — Tunisia',
    url: 'https://www.hrw.org/middle-east/n-africa/tunisia',
    language: 'FR/EN',
    reliability: 'A',
    notes: 'Decree 54 cases, detention reports, rights violations.',
    status: 'untested',
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'file-acled',
    type: 'file',
    name: 'ACLED — Tunisia Conflict Data',
    url: 'https://acleddata.com/data-export-tool/',
    language: 'EN',
    reliability: 'A',
    notes: 'Protest and conflict events with coordinates. Key for Timeline and Map.',
    status: 'untested',
    addedAt: '2026-01-01',
    builtIn: true,
  },
  // ============================================================
  // SOCIAL MEDIA
  // ============================================================
  {
    id: 'social-ugtt',
    type: 'social',
    name: 'UGTT Official Facebook',
    url: 'https://www.facebook.com/ugtt.tn',
    language: 'AR/FR',
    reliability: 'A',
    notes: 'Official UGTT page. Strike announcements, wage demands, press releases.',
    status: 'untested',
    monitorKeywords: ['grève', 'إضراب', 'strike', 'UGTT', 'Taboubi'],
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'social-presidency',
    type: 'social',
    name: 'Presidency of Tunisia',
    url: 'https://www.facebook.com/PrTunisie',
    language: 'AR',
    reliability: 'A',
    notes: 'Official presidential page. Decrees, statements, regime narrative.',
    status: 'untested',
    monitorKeywords: ['decree', 'décret', 'قرار', 'statement', 'Saied'],
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'social-nawaat-fb',
    type: 'social',
    name: 'Nawaat Facebook',
    url: 'https://www.facebook.com/nawaat.org',
    language: 'AR/FR',
    reliability: 'B',
    notes: 'Independent media. Often first to report Decree 54 arrests.',
    status: 'untested',
    monitorKeywords: ['arrest', 'arrestation', 'اعتقال', 'Decree 54'],
    addedAt: '2026-01-01',
    builtIn: true,
  },
  {
    id: 'social-telegram',
    type: 'social',
    name: 'Tunisia OSINT Telegram',
    url: 'https://t.me/tunisia_intel',
    language: 'AR',
    reliability: 'C',
    notes: 'Anonymous OSINT channel. Unverified but often early signals.',
    status: 'untested',
    monitorKeywords: ['protest', 'احتجاج', 'Sfax', 'Gafsa', 'water'],
    addedAt: '2026-01-01',
    builtIn: true,
  },
];

const testConnection = async (source: Source): Promise<Partial<Source>> => {
  const start = Date.now();
  try {
    // Use no-cors for social media (Facebook, Telegram)
    const mode = source.type === 'social' ? 'no-cors' : 'cors';

    const response = await Promise.race([
      fetch(source.url, {
        method: 'HEAD',
        mode: mode as RequestMode,
        cache: 'no-cache',
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      ),
    ]);

    const responseTime = Date.now() - start;

    // no-cors returns opaque response (status 0) — still means reachable
    const isOpaque = (response as Response).type === 'opaque';
    const status = (response as Response).status;

    if (isOpaque || status === 200 || status === 301 || status === 302) {
      const contentType = (response as Response).headers?.get('content-type') || 'unknown';
      return {
        status: responseTime > 3000 ? 'slow' : 'connected',
        responseTime,
        contentType: contentType.split(';')[0],
        lastChecked: new Date().toISOString(),
      };
    } else {
      return {
        status: 'error',
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    }
  } catch (err) {
    return {
      status: 'error',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  }
};

const ConnectionDiode: React.FC<{
  status: SourceStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  responseTime?: number;
}> = ({ status, size = 'sm', showLabel = false, responseTime }) => {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  const config = {
    connected: {
      color: 'bg-intel-green',
      label: responseTime ? `${responseTime}ms` : 'Connected',
      textColor: 'text-intel-green',
      pulse: false,
    },
    slow: {
      color: 'bg-yellow-500',
      label: responseTime ? `${responseTime}ms (slow)` : 'Slow',
      textColor: 'text-yellow-500',
      pulse: false,
    },
    error: {
      color: 'bg-intel-red',
      label: 'Unreachable',
      textColor: 'text-intel-red',
      pulse: false,
    },
    testing: {
      color: 'bg-intel-cyan',
      label: 'Testing...',
      textColor: 'text-intel-cyan',
      pulse: true,
    },
    untested: {
      color: 'bg-slate-600',
      label: 'Not tested',
      textColor: 'text-slate-500',
      pulse: false,
    },
  };

  const c = config[status];

  return (
    <div className="flex items-center space-x-1.5">
      <div className={`${dotSize} rounded-full ${c.color} ${
        c.pulse ? 'animate-pulse' : ''
      } shrink-0`} />
      {showLabel && (
        <span className={`text-[8px] font-mono ${c.textColor}`}>
          {c.label}
        </span>
      )}
    </div>
  );
};

const AddSourceModal: React.FC<{
  onAdd: (source: Source) => void;
  onClose: () => void;
}> = ({ onAdd, onClose }) => {
  const [form, setForm] = useState({
    type: 'rss' as SourceType,
    name: '',
    url: '',
    language: 'AR/FR' as Language,
    reliability: 'B' as Reliability,
    notes: '',
    keywords: '',
    authToken: '',
    schedule: 'Daily',
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<Partial<Source> | null>(null);

  const handleTest = async () => {
    if (!form.url) return;
    setTesting(true);
    setTestResult(null);
    const result = await testConnection({
      ...form,
      id: 'test',
      status: 'testing',
      addedAt: new Date().toISOString(),
    } as Source);
    setTestResult(result);
    setTesting(false);
  };

  const handleSubmit = () => {
    if (!form.name || !form.url) return;
    const newSource: Source = {
      id: `custom-${Date.now()}`,
      type: form.type,
      name: form.name,
      url: form.url,
      language: form.language,
      reliability: form.reliability,
      notes: form.notes || undefined,
      status: testResult?.status || 'untested',
      responseTime: testResult?.responseTime,
      contentType: testResult?.contentType,
      lastChecked: testResult?.lastChecked,
      keywords: form.keywords
        ? form.keywords.split(',').map(k => k.trim())
        : undefined,
      authToken: form.authToken || undefined,
      schedule: form.schedule || undefined,
      active: true,
      addedAt: new Date().toISOString(),
      builtIn: false,
    };
    onAdd(newSource);
    onClose();
  };

  const TYPE_ICONS = {
    rss: <Rss className="w-4 h-4" />,
    api: <Database className="w-4 h-4" />,
    file: <FileText className="w-4 h-4" />,
    social: <Share2 className="w-4 h-4" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm
        flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-[#05070a] border border-intel-border
          rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
          border-b border-intel-border">
          <div className="flex items-center space-x-3">
            <Plus className="w-4 h-4 text-intel-cyan" />
            <span className="text-sm font-bold text-white uppercase
              tracking-widest">Add New Source</span>
          </div>
          <button onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white
              hover:bg-white/5 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Source type selector */}
          <div className="space-y-2">
            <label className="text-[9px] font-mono text-slate-500
              uppercase tracking-widest">Source Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['rss', 'api', 'file', 'social'] as SourceType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex flex-col items-center space-y-1.5 p-3
                    rounded-xl border transition-all ${
                    form.type === t
                      ? 'bg-intel-cyan/10 border-intel-cyan/40 text-intel-cyan'
                      : 'bg-black/30 border-intel-border text-slate-500 hover:border-slate-600'
                  }`}
                >
                  {TYPE_ICONS[t]}
                  <span className="text-[9px] font-mono uppercase">
                    {t === 'rss' ? 'RSS' :
                     t === 'api' ? 'API' :
                     t === 'file' ? 'Document' : 'Social'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-slate-500
              uppercase tracking-widest">Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Nawaat RSS"
              className="w-full bg-black/40 border border-intel-border
                rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300
                placeholder-slate-700 focus:outline-none
                focus:border-intel-cyan/40"
            />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-slate-500
              uppercase tracking-widest">URL / Endpoint</label>
            <div className="flex space-x-2">
              <input
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                className="flex-1 bg-black/40 border border-intel-border
                  rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300
                  placeholder-slate-700 focus:outline-none
                  focus:border-intel-cyan/40"
              />
              <button
                onClick={handleTest}
                disabled={!form.url || testing}
                className={`px-3 py-2 rounded-lg text-[10px] font-mono
                  uppercase font-bold transition-all border ${
                  form.url && !testing
                    ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/30 hover:bg-intel-cyan/20'
                    : 'bg-white/5 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
              >
                {testing ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : 'TEST'}
              </button>
            </div>

            {/* Test result */}
            {testResult && (
              <div className={`flex items-center space-x-2 px-3 py-2
                rounded-lg text-[10px] font-mono border ${
                testResult.status === 'connected'
                  ? 'bg-intel-green/10 border-intel-green/20 text-intel-green'
                  : testResult.status === 'slow'
                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                  : 'bg-intel-red/10 border-intel-red/20 text-intel-red'
              }`}>
                <ConnectionDiode status={testResult.status || 'untested'} />
                <span>
                  {testResult.status === 'connected' || testResult.status === 'slow'
                    ? `Reachable · ${testResult.responseTime}ms · ${testResult.contentType || 'unknown type'}`
                    : 'Unreachable or CORS blocked — may still work via backend proxy'}
                </span>
              </div>
            )}
          </div>

          {/* Language + Reliability */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-slate-500
                uppercase tracking-widest">Language</label>
              <select
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value as Language }))}
                className="w-full bg-black/40 border border-intel-border
                  rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300
                  focus:outline-none focus:border-intel-cyan/40"
              >
                {['AR', 'FR', 'EN', 'AR/FR', 'AR/EN', 'FR/EN'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-slate-500
                uppercase tracking-widest">Reliability</label>
              <select
                value={form.reliability}
                onChange={e => setForm(f => ({ ...f, reliability: e.target.value as Reliability }))}
                className="w-full bg-black/40 border border-intel-border
                  rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300
                  focus:outline-none focus:border-intel-cyan/40"
              >
                <option value="A">A — High reliability</option>
                <option value="B">B — Medium reliability</option>
                <option value="C">C — Low / unverified</option>
              </select>
            </div>
          </div>

          {/* Keywords (RSS and Social only) */}
          {(form.type === 'rss' || form.type === 'social') && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-slate-500
                uppercase tracking-widest">
                Monitor Keywords (comma separated)
              </label>
              <input
                value={form.keywords}
                onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                placeholder="UGTT, grève, protest, Sfax..."
                className="w-full bg-black/40 border border-intel-border
                  rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300
                  placeholder-slate-700 focus:outline-none
                  focus:border-intel-cyan/40"
              />
            </div>
          )}

          {/* Auth token (API only) */}
          {form.type === 'api' && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-slate-500
                uppercase tracking-widest">
                Auth Token (optional)
              </label>
              <input
                type="password"
                value={form.authToken}
                onChange={e => setForm(f => ({ ...f, authToken: e.target.value }))}
                placeholder="Bearer token or API key..."
                className="w-full bg-black/40 border border-intel-border
                  rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300
                  placeholder-slate-700 focus:outline-none
                  focus:border-intel-cyan/40"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-slate-500
              uppercase tracking-widest">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Describe what this source provides..."
              rows={2}
              className="w-full bg-black/40 border border-intel-border
                rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300
                placeholder-slate-700 focus:outline-none
                focus:border-intel-cyan/40 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!form.name || !form.url}
              className={`flex-1 py-3 rounded-xl text-[10px] font-mono
                font-bold uppercase tracking-wider transition-all ${
                form.name && form.url
                  ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/30 hover:bg-intel-cyan/20'
                  : 'bg-white/5 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              Add Source
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl text-[10px] font-mono
                text-slate-500 border border-intel-border
                hover:text-white transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SourceCard: React.FC<{
  source: Source;
  onTest: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPipeline: (url: string) => void;
}> = ({ source, onTest, onToggle, onDelete, onPipeline }) => {
  const TYPE_CONFIG = {
    rss: { icon: Rss, color: 'text-intel-orange', label: 'RSS' },
    api: { icon: Database, color: 'text-intel-cyan', label: 'API' },
    file: { icon: FileText, color: 'text-intel-purple', label: 'DOC' },
    social: { icon: Share2, color: 'text-blue-400', label: 'SOCIAL' },
  };

  const RELIABILITY_COLORS = {
    A: 'text-intel-green border-intel-green/30 bg-intel-green/10',
    B: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
    C: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  };

  const typeConfig = TYPE_CONFIG[source.type];
  const TypeIcon = typeConfig.icon;

  // Smart action button based on type
  const renderActionButton = () => {
    if (source.type === 'file' || source.type === 'api') {
      return (
        <button
          onClick={() => onPipeline(source.url)}
          className="text-[8px] font-mono font-bold px-2 py-1
            bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20
            rounded hover:bg-intel-cyan/20 transition-all whitespace-nowrap"
        >
          + PIPELINE
        </button>
      );
    }
    if (source.type === 'rss') {
      return (
        <button
          onClick={() => onToggle(source.id)}
          className={`text-[8px] font-mono font-bold px-2 py-1
            rounded border transition-all whitespace-nowrap ${
            source.active
              ? 'bg-intel-green/10 text-intel-green border-intel-green/20 hover:bg-intel-green/20'
              : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'
          }`}
        >
          {source.active ? '● ACTIVE' : '○ PAUSED'}
        </button>
      );
    }
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[8px] font-mono font-bold px-2 py-1
          bg-white/5 text-slate-400 border border-slate-700
          rounded hover:text-white hover:border-slate-600
          transition-all flex items-center space-x-1 whitespace-nowrap"
      >
        <span>OPEN</span>
        <ExternalLink className="w-2.5 h-2.5" />
      </a>
    );
  };

  return (
    <div className={`p-4 rounded-xl border transition-all group ${
      source.status === 'error'
        ? 'border-intel-red/20 bg-intel-red/5'
        : source.status === 'connected'
        ? 'border-intel-border bg-black/20 hover:border-intel-border/60'
        : 'border-intel-border bg-black/20 hover:border-intel-border/60'
    }`}>
      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + name + status */}
        <div className="flex items-start space-x-3 min-w-0">
          <div className={`mt-0.5 shrink-0 ${typeConfig.color}`}>
            <TypeIcon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="text-[11px] font-bold text-white truncate">
                {source.name}
              </span>
              <span className={`text-[7px] font-mono px-1.5 py-0.5
                rounded border uppercase ${RELIABILITY_COLORS[source.reliability]}`}>
                {source.reliability}
              </span>
              <span className="text-[7px] font-mono text-slate-600 uppercase">
                {source.language}
              </span>
            </div>

            {/* Connection diode + status */}
            <div className="flex items-center space-x-3">
              <ConnectionDiode
                status={source.status}
                showLabel={true}
                responseTime={source.responseTime}
              />
              {source.lastChecked && (
                <span className="text-[8px] font-mono text-slate-700">
                  {new Date(source.lastChecked).toLocaleTimeString()}
                </span>
              )}
              {source.contentType && source.contentType !== 'unknown' && (
                <span className="text-[8px] font-mono text-slate-700">
                  {source.contentType}
                </span>
              )}
            </div>

            {/* Notes */}
            {source.notes && (
              <p className="text-[9px] text-slate-600 leading-snug
                line-clamp-1 group-hover:line-clamp-none transition-all">
                {source.notes}
              </p>
            )}

            {/* Keywords */}
            {(source.keywords || source.monitorKeywords) && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {(source.keywords || source.monitorKeywords || [])
                  .slice(0, 4).map(kw => (
                  <span key={kw} className="text-[7px] font-mono px-1.5 py-0.5
                    bg-white/5 text-slate-600 border border-white/5 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* RSS specific info */}
            {source.type === 'rss' && source.articleCount24h !== undefined && (
              <div className="text-[8px] font-mono text-slate-600">
                {source.articleCount24h} articles / 24h
                {source.lastArticle && ` · Last: ${source.lastArticle}`}
              </div>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Test button */}
          <button
            onClick={() => onTest(source.id)}
            className="p-1.5 text-slate-600 hover:text-intel-cyan
              hover:bg-intel-cyan/10 rounded transition-all"
            title="Test connection"
          >
            {source.status === 'testing'
              ? <RefreshCw className="w-3 h-3 animate-spin" />
              : <Wifi className="w-3 h-3" />
            }
          </button>

          {/* Open in browser */}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-600 hover:text-slate-300
              hover:bg-white/5 rounded transition-all"
            title="Open URL"
          >
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Delete (non built-in only) */}
          {!source.builtIn && (
            <button
              onClick={() => onDelete(source.id)}
              className="p-1.5 text-slate-700 hover:text-intel-red
                hover:bg-intel-red/10 rounded transition-all"
              title="Remove source"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          {/* Smart action button */}
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export const SourceLibrary: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [sources, setSources] = useState<Source[]>(() => {
    try {
      const saved = localStorage.getItem('ti_sources');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with built-in sources (add any new built-ins)
        const savedIds = parsed.map((s: Source) => s.id);
        const newBuiltIns = DEFAULT_SOURCES.filter(s => !savedIds.includes(s.id));
        return [...parsed, ...newBuiltIns];
      }
    } catch {}
    return DEFAULT_SOURCES;
  });

  const [activeType, setActiveType] = useState<SourceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingAll, setTestingAll] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('ti_sources', JSON.stringify(sources));
  }, [sources]);

  // Test single source
  const handleTest = useCallback(async (id: string) => {
    setSources(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'testing' } : s
    ));
    const source = sources.find(s => s.id === id);
    if (!source) return;
    const result = await testConnection(source);
    setSources(prev => prev.map(s =>
      s.id === id ? { ...s, ...result } : s
    ));
  }, [sources]);

  // Test all sources sequentially
  const handleTestAll = async () => {
    setTestingAll(true);
    for (const source of sources) {
      setSources(prev => prev.map(s =>
        s.id === source.id ? { ...s, status: 'testing' } : s
      ));
      const result = await testConnection(source);
      setSources(prev => prev.map(s =>
        s.id === source.id ? { ...s, ...result } : s
      ));
      // Small delay between tests to avoid hammering
      await new Promise(r => setTimeout(r, 400));
    }
    setTestingAll(false);
  };

  // Toggle RSS active state
  const handleToggle = (id: string) => {
    setSources(prev => prev.map(s =>
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  // Delete custom source
  const handleDelete = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  // Add new source
  const handleAdd = (source: Source) => {
    setSources(prev => [...prev, source]);
  };

  // Open pipeline with URL
  const handlePipeline = (url: string) => {
    window.sessionStorage.setItem('pipeline_prefill_url', url);
    window.dispatchEvent(new CustomEvent('navigate-to-pipeline',
      { detail: { tab: 'pipeline' } }
    ));
    onClose();
  };

  // Filtered sources
  const filteredSources = sources.filter(s => {
    const matchType = activeType === 'all' || s.type === activeType;
    const matchSearch = !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  // Stats
  const stats = {
    total: sources.length,
    connected: sources.filter(s => s.status === 'connected').length,
    errors: sources.filter(s => s.status === 'error').length,
    rssActive: sources.filter(s => s.type === 'rss' && s.active).length,
  };

  const TYPE_TABS = [
    { id: 'all', label: 'All Sources', icon: Globe, count: sources.length },
    { id: 'rss', label: 'RSS Feeds', icon: Rss, count: sources.filter(s => s.type === 'rss').length },
    { id: 'api', label: 'APIs', icon: Database, count: sources.filter(s => s.type === 'api').length },
    { id: 'file', label: 'Documents', icon: FileText, count: sources.filter(s => s.type === 'file').length },
    { id: 'social', label: 'Social Media', icon: Share2, count: sources.filter(s => s.type === 'social').length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#020810]/98
        backdrop-blur-md overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4
        border-b border-intel-border bg-black/60 shrink-0">
        <div className="flex items-center space-x-4">
          <Globe className="w-5 h-5 text-intel-cyan" />
          <div>
            <div className="text-sm font-bold text-white uppercase
              tracking-widest">Source Library</div>
            <div className="text-[9px] font-mono text-slate-500">
              {stats.total} sources ·
              <span className="text-intel-green"> {stats.connected} connected</span>
              {stats.errors > 0 && (
                <span className="text-intel-red"> · {stats.errors} errors</span>
              )}
              · {stats.rssActive} RSS active
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Test all button */}
          <button
            onClick={handleTestAll}
            disabled={testingAll}
            className={`flex items-center space-x-2 px-3 py-1.5
              text-[10px] font-mono border rounded-lg transition-all ${
              testingAll
                ? 'text-slate-600 border-slate-800 cursor-not-allowed'
                : 'text-slate-400 border-intel-border hover:text-intel-cyan hover:border-intel-cyan/30'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${testingAll ? 'animate-spin' : ''}`} />
            <span>{testingAll ? 'Testing...' : 'Test All'}</span>
          </button>

          {/* Add source button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5
              text-[10px] font-mono text-intel-cyan border
              border-intel-cyan/30 bg-intel-cyan/10 rounded-lg
              hover:bg-intel-cyan/20 transition-all"
          >
            <Plus className="w-3 h-3" />
            <span>Add Source</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white
              hover:bg-white/5 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Type tabs + search */}
      <div className="flex items-center justify-between px-6 py-3
        border-b border-intel-border bg-black/40 shrink-0 gap-4">
        {/* Type tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto
          scrollbar-hide">
          {TYPE_TABS.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveType(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2
                  rounded-lg text-[10px] font-mono uppercase
                  tracking-wider whitespace-nowrap transition-all ${
                  activeType === tab.id
                    ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <TabIcon className="w-3 h-3" />
                <span>{tab.label}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                  activeType === tab.id
                    ? 'bg-intel-cyan/20 text-intel-cyan'
                    : 'bg-white/5 text-slate-600'
                }`}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="w-3 h-3 text-slate-500 absolute left-3
            top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search sources..."
            className="bg-black/40 border border-intel-border rounded-lg
              pl-8 pr-3 py-1.5 text-[11px] font-mono text-slate-300
              placeholder-slate-700 focus:outline-none
              focus:border-intel-cyan/40 w-48"
          />
        </div>
      </div>

      {/* Source list */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center
            h-48 space-y-3 text-center">
            <Globe className="w-8 h-8 text-slate-700" />
            <div className="text-[11px] font-mono text-slate-600">
              No sources found
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-[10px] font-mono text-intel-cyan
                border border-intel-cyan/30 px-3 py-1.5 rounded-lg
                hover:bg-intel-cyan/10 transition-all"
            >
              + Add First Source
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredSources.map(source => (
              <SourceCard
                key={source.id}
                source={source}
                onTest={handleTest}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onPipeline={handlePipeline}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add source modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddSourceModal
            onAdd={handleAdd}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

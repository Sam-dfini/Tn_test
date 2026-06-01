import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Globe, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Zap, 
  Search, 
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Library,
  Shield,
  Info,
  Clock,
  ArrowLeft,
  Rss,
  Activity,
  Cpu
} from 'lucide-react';
import { generateRandomId } from '../../utils/idUtils';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useRSS } from '../../context/RSSContext';
import { useAI } from '../../context/AIContext';
import { chatWithAnalyst } from '../../services/ai';
import { safeAI } from '../../lib/aiSafe';
import { SourceLibrary } from '../system/SourceLibrary';
import { 
  extractFieldsFromContent, 
  DOCUMENT_TYPES, 
  FIELD_MAP, 
  fetchURLContent,
  ExtractedField,
  syncExternalData 
} from '../../services/pipelineService';
import { BackgroundGrid, ModuleHeader, LiveTicker } from '../shared/ProfessionalShared';
import { FinanceLawPanel } from '../economy/FinanceLawPanel';
import { ObservabilityDashboard } from '../system/ObservabilityDashboard';
import { ObservabilityPanel } from '../system/ObservabilityPanel';

const AIAPITab: React.FC = () => {
  const { provider, setProvider, apiKey, setApiKey, isPaused, setIsPaused } = useAI();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  const testApiKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Ping', config: { model: provider === 'OPENAI' ? 'gpt-4o' : undefined } })
      });
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setTestResult({ success: true, message: 'API Key Verified: ' + data.text.substring(0, 20) + '...' });
    } catch (e) {
      setTestResult({ success: false, message: 'Invalid API Key or Proxy Error' });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center max-w-4xl mx-auto space-y-8 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <button 
          onClick={() => setProvider('GEMINI')}
          className={`group relative p-8 bg-slate-900/40 border ${provider === 'GEMINI' ? 'border-intel-cyan' : 'border-white/10'} rounded-3xl backdrop-blur-md hover:border-intel-cyan/50 transition-all text-left overflow-hidden`}
        >
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 bg-intel-cyan/10 rounded-2xl flex items-center justify-center border border-intel-cyan/20">
              <Database className="w-6 h-6 text-intel-cyan" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-on-surface tracking-tight group-hover:text-intel-cyan transition-colors">Gemini 2.5 Flash</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Default active engine. Fast multimodal intelligence and data extraction.
              </p>
            </div>
            {provider === 'GEMINI' && <div className="absolute top-4 right-4 bg-intel-cyan/20 text-intel-cyan px-3 py-1 rounded-full text-xs font-mono">ACTIVE</div>}
          </div>
        </button>
        <button 
          onClick={() => setProvider('OPENAI')}
          className={`group relative p-8 bg-slate-900/40 border ${provider === 'OPENAI' ? 'border-intel-cyan' : 'border-white/10'} rounded-3xl backdrop-blur-md hover:border-intel-cyan/50 transition-all text-left overflow-hidden h-full`}
        >
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 bg-intel-cyan/10 rounded-2xl flex items-center justify-center border border-intel-cyan/20">
              <Cpu className="w-6 h-6 text-intel-cyan" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-on-surface tracking-tight group-hover:text-intel-cyan transition-colors">GPT-4 Turbo</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Advanced reasoning engine. Requires separate API key configuration below.
              </p>
            </div>
            {provider === 'OPENAI' && <div className="absolute top-4 right-4 bg-intel-cyan/20 text-intel-cyan px-3 py-1 rounded-full text-xs font-mono">ACTIVE</div>}
          </div>
        </button>
      </div>

      <div className="max-w-4xl w-full mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-slate-900/40 border border-white/10 rounded-3xl backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-on-surface font-bold font-mono tracking-tight uppercase">API Configuration</h4>
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${isPaused ? 'bg-intel-red/20 text-intel-red border border-intel-red/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'}`}
            >
              {isPaused ? 'SYSTEM PAUSED' : 'SYSTEM ONLINE'}
            </button>
          </div>
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase mb-2 block">Third-Party Key (OpenAI/Anthropic)</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-on-surface focus:border-intel-cyan/50 focus:outline-none"
            />
            <div className="flex gap-2 items-center mt-2">
              <button 
                onClick={testApiKey}
                disabled={isTesting || !apiKey}
                className="px-4 py-2 bg-slate-800 text-on-surface text-xs font-mono rounded hover:bg-slate-700 disabled:opacity-50"
              >
                {isTesting ? 'Testing...' : 'Test API Key'}
              </button>
              {testResult && (
                <span className={`text-[10px] font-mono ${testResult.success ? 'text-emerald-500' : 'text-intel-red'}`}>
                  {testResult.message}
                </span>
              )}
            </div>
            <p className="text-[10px] items-center text-slate-500 mt-2 font-mono flex">
               <AlertCircle className="w-3 h-3 mr-1" /> Google GenAI built-in token securely handles native Gemini routes.
            </p>
          </div>
        </div>
        
        <div className="p-8 bg-slate-900/40 border border-white/10 rounded-3xl backdrop-blur-md flex flex-col justify-center items-center text-center space-y-4">
          <Activity className="w-12 h-12 text-intel-cyan" />
          <div>
             <h4 className="text-on-surface font-bold font-mono tracking-tight text-xl">Intelligence Readiness</h4>
             <p className="text-sm text-slate-400 mt-2 font-mono">Select a provider and ensure keys are set to activate data ingestion engines and predictive modeling functions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface IngestedDoc {
  id: string;
  title: string;
  type: string;
  status: 'INGESTED' | 'EXTRACTING' | 'READY';
  timestamp: string;
  url?: string;
}

interface Message {
  id: string;
  role: 'user' | 'analyst';
  text: string;
  timestamp: number;
}

export const DataPipeline: React.FC<{ 
  onClose: () => void, 
  initialTab?: 'pipeline' | 'sources' | 'ai-api' | 'finance' | 'health' | 'pipeline-control'
}> = ({ onClose, initialTab = 'pipeline' }) => {
  const { fullData: data, pushApprovedChanges, rriState } = useRiskMetrics();
  const { articles } = useRSS();
  const { canCallAI, recordCall, recordError, provider, setProvider, apiKey, setApiKey, isPaused, setIsPaused } = useAI();
  
  const [activeTab, setActiveTab] = useState<'pipeline' | 'sources' | 'ai-api' | 'finance' | 'health' | 'pipeline-control'>(initialTab);
  
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'analyst',
    text: "TunisiaIntel v2.0 Neural Link Established. How can I assist with your intelligence requirements today?",
    timestamp: Date.now()
  }]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [documents, setDocuments] = useState<IngestedDoc[]>([
    { id: '1', title: 'BCT Monetary Policy Note', type: 'BCT Report', status: 'READY', timestamp: '2026-03-20 14:20' },
    { id: '2', title: 'INS Inflation Bulletin', type: 'INS Statistics', status: 'READY', timestamp: '2026-03-21 09:15' },
  ]);
  
  const [reviewQueue, setReviewQueue] = useState<(ExtractedField & { id: string })[]>([]);
  const [approvedChanges, setApprovedChanges] = useState<(ExtractedField & { id: string })[]>([]);
  const [rejectedFields, setRejectedFields] = useState<(ExtractedField & { id: string })[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [activeDocType, setActiveDocType] = useState(DOCUMENT_TYPES[0]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [showRejected, setShowRejected] = useState(false);

  useEffect(() => {
    const prefillUrl = sessionStorage.getItem('pipeline_prefill_url');
    if (prefillUrl) {
      setUrlInput(prefillUrl);
      sessionStorage.removeItem('pipeline_prefill_url');
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiLoading]);

  const handleAISend = async () => {
    if (!aiInput.trim() || isAiLoading) return;

    if (!canCallAI(true)) {
      setMessages(prev => [...prev, {
        id: generateRandomId('analyst'),
        role: 'analyst',
        text: "Neural link restricted. Daily API quota reached or system paused. Please check AI Configuration in Data Pipeline.",
        timestamp: Date.now()
      }]);
      return;
    }

    const userMsg: Message = {
      id: generateRandomId('user'),
      role: 'user',
      text: aiInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      const context = {
        rri: rriState?.rri || 0,
        pRev: rriState?.p_rev || 0,
        velocity: rriState?.velocity_label || 'NORMAL',
        data: data
      };

      const response = await safeAI(
        () => chatWithAnalyst([...messages, userMsg], context),
        "Neural link currently restricted. System in tactical local mode."
      );
      recordCall();

      setMessages(prev => [...prev, {
        id: generateRandomId('analyst'),
        role: 'analyst',
        text: response,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('AI Analyst Error:', error);
      recordError(error instanceof Error ? error.message : String(error));
      setMessages(prev => [...prev, {
        id: generateRandomId('error'),
        role: 'analyst',
        text: "Neural link interrupted. Failed to process intelligence request. Please retry.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExtractDocument = useCallback(async (url: string, title?: string, typeName?: string) => {
    const newDoc: IngestedDoc = {
      id: generateRandomId('doc'),
      title: title || url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
      type: typeName || activeDocType.name,
      status: 'INGESTED',
      timestamp: new Date().toISOString().replace('T', ' ').substr(0, 16),
      url: url
    };
    
    setDocuments(prev => [newDoc, ...prev]);
    setIsExtracting(true);
    
    setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'EXTRACTING' } : d));
    
    try {
      const content = await fetchURLContent(url);
      const fields = await safeAI(
        () => extractFieldsFromContent(content, activeDocType.id, data),
        []
      );
      
      const fieldsWithId = fields.map(f => ({ ...f, id: generateRandomId('field') }));
      setReviewQueue(prev => [...prev, ...fieldsWithId]);
      setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'READY' } : d));
    } catch (error) {
      console.error('Ingestion failed:', error);
    } finally {
      setIsExtracting(false);
    }
  }, [activeDocType, data]);

  useEffect(() => {
    const handlePipelineEvent = (event: any) => {
      const { url, title } = event.detail;
      handleExtractDocument(url, title);
    };

    window.addEventListener('pipeline-article', handlePipelineEvent);
    return () => window.removeEventListener('pipeline-article', handlePipelineEvent);
  }, [handleExtractDocument]);

  const handleIngest = async () => {
    if (!urlInput) return;
    await handleExtractDocument(urlInput);
    setUrlInput('');
  };

  const handleSyncAPIs = async () => {
    setIsExtracting(true);
    try {
      const fieldsToSync = [
        'economy.gdp_growth',
        'economy.inflation',
        'economy.public_debt',
        'economy.unemployment'
      ];
      const results = await syncExternalData(fieldsToSync);
      
      const resultsWithId = results.map(r => {
        let oldValue = data;
        r.field.split('.').forEach((key: string) => {
          oldValue = oldValue?.[key];
        });
        return { ...r, oldValue, id: generateRandomId('rev') };
      });
      
      setReviewQueue(prev => [...prev, ...resultsWithId]);
      
      const syncDoc: IngestedDoc = {
        id: generateRandomId('sync'),
        title: 'External API Sync (WB/IMF)',
        type: 'API Sync',
        status: 'READY',
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 16),
      };
      setDocuments(prev => [syncDoc, ...prev]);
    } catch (error) {
      console.error('API Sync failed:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApprove = (field: ExtractedField & { id: string }) => {
    const finalField = editingFieldId === field.id 
      ? { ...field, value: editingValue }
      : field;
    
    setApprovedChanges(prev => [...prev, finalField]);
    setReviewQueue(prev => prev.filter(f => f.id !== field.id));
    setEditingFieldId(null);
  };

  const handleReject = (field: ExtractedField & { id: string }) => {
    setRejectedFields(prev => [...prev, field]);
    setReviewQueue(prev => prev.filter(f => f.id !== field.id));
  };

  const handleRestore = (field: ExtractedField & { id: string }) => {
    setReviewQueue(prev => [...prev, field]);
    setRejectedFields(prev => prev.filter(f => f.id !== field.id));
  };

  const handlePushToLive = () => {
    const changesToPush = approvedChanges.map(c => ({
      field: c.field,
      value: c.value,
      oldValue: c.oldValue,
      source: activeDocType.name,
      label: c.label,
      approvedAt: new Date().toISOString()
    }));
    
    pushApprovedChanges(changesToPush);
    setApprovedChanges([]);
    
    window.dispatchEvent(new CustomEvent('rri-recalculate'));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      role="dialog" aria-modal="true" aria-label="Data Pipeline" className="fixed inset-0 z-modal bg-[#020810]/98 backdrop-blur-md overflow-hidden flex flex-col"
    >
      {/* Overlay Header */}
      <div className="h-auto md:h-16 border-b border-white/10 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-3 md:py-0 bg-black/40 relative z-20">
        <div className="flex flex-col md:flex-row items-center w-full md:w-auto space-y-3 md:space-y-0 md:space-x-12">
          <div className="flex items-center w-full md:w-auto justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-intel-cyan/10 rounded-xl flex items-center justify-center border border-intel-cyan/20">
                <Database className="w-5 h-5 text-intel-cyan" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface tracking-tight">
                  {activeTab === 'ai-api' ? 'AI Engine' : activeTab === 'sources' ? 'Source Library' : activeTab === 'finance' ? 'Finance Law 2026' : activeTab === 'pipeline-control' ? 'Pipeline Mission Control' : 'Intelligence Pipeline'}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-intel-cyan uppercase tracking-widest">Analyst Access</span>
                  <span className="text-slate-700">•</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Grounding Engine</span>
                </div>
              </div>
            </div>
            {/* Close button for mobile, moved here for better accessibility */}
            <button 
              onClick={onClose}
              className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('ai-api')}
              className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-mono uppercase tracking-widest transition-all ${
                activeTab === 'ai-api' 
                  ? 'bg-intel-cyan text-black font-bold' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              AI settings
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-mono uppercase tracking-widest transition-all ${
                activeTab === 'pipeline' 
                  ? 'bg-intel-cyan text-black font-bold' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-mono uppercase tracking-widest transition-all ${
                activeTab === 'sources' 
                  ? 'bg-intel-cyan text-black font-bold' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              Sources
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-mono uppercase tracking-widest transition-all ${
                activeTab === 'finance' 
                  ? 'bg-intel-orange text-black font-bold' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              Finance Law
            </button>
            <button
              onClick={() => setActiveTab('pipeline-control')}
              className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-mono uppercase tracking-widest transition-all ${
                activeTab === 'pipeline-control' 
                  ? 'bg-intel-cyan text-black font-bold' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              P.M.C
            </button>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors group"
          >
            <X className="w-6 h-6 text-slate-500 group-hover:text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 md:p-8 relative z-10">
        <BackgroundGrid />
        <div className={`max-w-[1600px] mx-auto h-full ${activeTab === 'pipeline-control' ? '' : 'overflow-y-auto no-scrollbar'}`}>
          {activeTab === 'pipeline-control' ? (
            <ObservabilityDashboard />
          ) : activeTab === 'health' ? (
            <ObservabilityPanel />
          ) : activeTab === 'finance' ? (
            <div className="space-y-6 pb-12">
              <FinanceLawPanel />
            </div>
          ) : activeTab === 'ai-api' ? (
            <AIAPITab />
          ) : activeTab === 'pipeline' ? (
            <div className="space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                 <div className="lg:col-span-4 space-y-6">
                    <div className="p-6 bg-slate-900/40 border border-white/10 rounded-2xl">
                      <h3 className="text-sm font-mono font-bold text-intel-cyan uppercase mb-6">Pipeline Status</h3>
                      <div className="space-y-4">
                        <select 
                          value={activeDocType.id}
                          onChange={(e) => setActiveDocType(DOCUMENT_TYPES.find(d => d.id === e.target.value) || DOCUMENT_TYPES[0])}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-on-surface"
                        >
                          {DOCUMENT_TYPES.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                          ))}
                        </select>
                        <input 
                            type="text" 
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-on-surface"
                          />
                        <div className="grid grid-cols-2 gap-2">
                           <button 
                             onClick={handleIngest}
                             disabled={!urlInput || isExtracting}
                             className="w-full py-3 bg-intel-cyan text-black rounded-xl font-mono font-bold text-xs uppercase hover:bg-white transition-all disabled:opacity-50 flex justify-center items-center space-x-2"
                           >
                             {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                             <span>Digest Data</span>
                           </button>
                           <button 
                             onClick={handleSyncAPIs}
                             disabled={isExtracting}
                             className="w-full py-3 bg-white/10 border border-white/10 text-on-surface rounded-xl font-mono font-bold text-xs uppercase hover:bg-white/20 transition-all disabled:opacity-50 flex justify-center items-center space-x-2"
                           >
                             {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                             <span>Sync APIs</span>
                           </button>
                        </div>
                      </div>
                    </div>
                     {documents.length > 0 && (
                       <div className="p-6 bg-slate-900/40 border border-white/10 rounded-2xl">
                         <h3 className="text-sm font-mono font-bold text-on-surface uppercase mb-4">Ingestion Logs</h3>
                         <div className="space-y-3">
                           {documents.map(doc => (
                             <div key={doc.id} className="p-3 bg-black/40 border border-white/5 rounded-lg">
                               <div className="flex items-center justify-between mb-1">
                                 <span className="text-xs font-mono text-intel-cyan">{doc.type}</span>
                                 <span className="text-[10px] font-mono text-slate-500">{doc.timestamp}</span>
                               </div>
                               <p className="text-sm text-slate-300 truncate">{doc.title}</p>
                               <div className="flex items-center space-x-2 mt-2">
                                 {doc.status === 'READY' ? (
                                   <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                 ) : doc.status === 'EXTRACTING' ? (
                                   <Loader2 className="w-3 h-3 text-intel-cyan animate-spin" />
                                 ) : (
                                   <div className="w-3 h-3 rounded-full bg-slate-600" />
                                 )}
                                 <span className="text-[10px] font-mono uppercase text-slate-400">{doc.status}</span>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                 </div>
                 <div className="lg:col-span-6 space-y-6">
                    {reviewQueue.length === 0 && (
                      <div className="p-12 bg-slate-900/40 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 h-full border-dashed">
                        <Database className="w-12 h-12 text-slate-600 mb-2" />
                        <div>
                          <h4 className="text-on-surface font-bold font-mono tracking-tight uppercase">Pipeline Idle</h4>
                          <p className="text-sm text-slate-500 mt-2 font-mono">Ingest a document or external data source to begin extraction loop.</p>
                        </div>
                      </div>
                    )}
                    {reviewQueue.length > 0 && reviewQueue.map((field) => (
                      <div key={field.id} className="p-5 bg-slate-900/60 border border-white/10 rounded-2xl flex items-center justify-between">
                         <div className="text-on-surface text-sm">{FIELD_MAP[field.field as keyof typeof FIELD_MAP]?.label || field.field}</div>
                         <div className="flex gap-2">
                             <button onClick={() => handleApprove(field)} className="text-emerald-500">Approve</button>
                             <button onClick={() => handleReject(field)} className="text-intel-red">Reject</button>
                         </div>
                      </div>
                    ))}
                    {approvedChanges.length > 0 && (
                      <button 
                        onClick={handlePushToLive}
                        className="px-8 py-4 bg-intel-cyan text-black rounded-xl font-mono font-bold text-sm uppercase"
                      >
                        Push {approvedChanges.length} to Live
                      </button>
                    )}
                 </div>
               </div>
            </div>
          ) : (
            <SourceLibrary 
              onClose={onClose} 
              isEmbedded={true} 
              onNavigateToPipeline={(url) => {
                setUrlInput(url);
                setActiveTab('pipeline');
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

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
  Activity
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import { useRSS } from '../context/RSSContext';
import { SourceLibrary } from './SourceLibrary';
import { 
  extractFieldsFromContent, 
  DOCUMENT_TYPES, 
  FIELD_MAP, 
  fetchURLContent,
  ExtractedField 
} from '../services/pipelineService';
import { BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';

interface IngestedDoc {
  id: string;
  title: string;
  type: string;
  status: 'INGESTED' | 'EXTRACTING' | 'READY';
  timestamp: string;
  url?: string;
}

const pipelineAlerts = [
  { code: 'PIPE-01', title: 'BCT Q1 Report Available — FX Data Pending', impact: 'HIGH' },
  { code: 'PIPE-02', title: 'INS Unemployment Survey — March Data Available', impact: 'MEDIUM' },
];

export const DataPipeline: React.FC<{ 
  onClose: () => void, 
  initialTab?: 'pipeline' | 'sources'
}> = ({ onClose, initialTab = 'pipeline' }) => {
  const { data, pushApprovedChanges } = usePipeline();
  const { articles } = useRSS();
  
  const [activeTab, setActiveTab] = useState<'pipeline' | 'sources'>(initialTab);
  const [documents, setDocuments] = useState<IngestedDoc[]>([
    { id: '1', title: 'BCT Monetary Policy Note', type: 'BCT Report', status: 'READY', timestamp: '2026-03-20 14:20' },
    { id: '2', title: 'INS Inflation Bulletin', type: 'INS Statistics', status: 'READY', timestamp: '2026-03-21 09:15' },
  ]);
  
  const [reviewQueue, setReviewQueue] = useState<(ExtractedField & { id: string })[]>([]);
  const [approvedChanges, setApprovedChanges] = useState<(ExtractedField & { id: string })[]>([]);
  const [rejectedFields, setRejectedFields] = useState<(ExtractedField & { id: string })[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
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

  const handleExtractDocument = useCallback(async (url: string, title?: string, typeName?: string) => {
    const newDoc: IngestedDoc = {
      id: Math.random().toString(36).substr(2, 9),
      title: title || url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
      type: typeName || activeDocType.name,
      status: 'INGESTED',
      timestamp: new Date().toISOString().replace('T', ' ').substr(0, 16),
      url: url
    };
    
    setDocuments(prev => [newDoc, ...prev]);
    setIsExtracting(true);
    
    // Update status to EXTRACTING
    setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'EXTRACTING' } : d));
    
    try {
      const content = await fetchURLContent(url);
      const fields = await extractFieldsFromContent(content, activeDocType.id, data);
      
      const fieldsWithId = fields.map(f => ({ ...f, id: Math.random().toString(36).substr(2, 9) }));
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
    
    // Trigger global RRI recalculation event
    window.dispatchEvent(new CustomEvent('rri-recalculate'));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[200] bg-[#020810]/98 backdrop-blur-md overflow-hidden flex flex-col"
    >
      {/* Overlay Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/40 relative z-20">
        <div className="flex items-center space-x-12">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-intel-cyan/10 rounded-xl flex items-center justify-center border border-intel-cyan/20">
              <Database className="w-5 h-5 text-intel-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Intelligence Pipeline</h2>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-intel-cyan uppercase tracking-widest">Analyst Access</span>
                <span className="text-slate-700">•</span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Grounding Engine</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${
                activeTab === 'pipeline' 
                  ? 'bg-intel-cyan text-black font-bold' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${
                activeTab === 'sources' 
                  ? 'bg-intel-cyan text-black font-bold' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              Sources
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4 px-4 py-2 bg-white/5 rounded-xl border border-white/10 mr-4">
            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-intel-green" />
              <span>SIGINT: NOMINAL</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan animate-pulse" />
              <span>UPLINK: SECURE</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors group"
          >
            <X className="w-6 h-6 text-slate-500 group-hover:text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 no-scrollbar relative z-10">
        <BackgroundGrid />
        <div className="max-w-[1600px] mx-auto">
          {activeTab === 'pipeline' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
              {/* Left Column: Ingestion & History */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Globe className="w-12 h-12 text-intel-cyan" />
                  </div>
                  
                  <h3 className="text-sm font-mono font-bold text-intel-cyan uppercase tracking-widest mb-6 flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>New Intelligence Source</span>
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Source URL / Endpoint</label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="text" 
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://www.bct.gov.tn/..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-intel-cyan/50 transition-all"
                          />
                        </div>
                        <button 
                          onClick={handleIngest}
                          disabled={!urlInput || isExtracting}
                          className="px-6 py-3 bg-intel-cyan text-black rounded-xl font-mono font-bold text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          <span>Ingest</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Document Classification</label>
                      <div className="grid grid-cols-2 gap-2">
                        {DOCUMENT_TYPES.map(type => (
                          <button
                            key={type.id}
                            onClick={() => setActiveDocType(type)}
                            className={`px-3 py-2 rounded-lg text-[10px] font-mono border transition-all ${
                              activeDocType.id === type.id 
                                ? 'bg-intel-cyan/10 border-intel-cyan text-intel-cyan' 
                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {type.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md">
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Rss className="w-4 h-4 text-intel-cyan" />
                      <span>Pending Intelligence</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">{articles.length} New</span>
                  </h3>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                    {articles.slice(0, 10).map((article) => (
                      <div 
                        key={article.id} 
                        onClick={() => handleExtractDocument(article.url, article.title)}
                        className="p-4 bg-black/40 border border-white/5 rounded-xl group hover:border-intel-cyan/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-[8px] font-mono text-intel-cyan uppercase">{article.source_name}</span>
                          <span className="text-[8px] font-mono text-slate-600">
                            {new Date(article.published_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors line-clamp-2">
                          {article.title}
                        </div>
                        {article.category && (
                          <div className="mt-2">
                            <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded uppercase ${
                              article.category === 'POLITICAL' ? 'bg-intel-red/10 text-intel-red' :
                              article.category === 'ECONOMIC' ? 'bg-intel-cyan/10 text-intel-cyan' :
                              article.category === 'SECURITY' ? 'bg-intel-orange/10 text-intel-orange' :
                              'bg-slate-500/10 text-slate-500'
                            }`}>
                              {article.category}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {articles.length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-[10px] font-mono text-slate-600 italic">No pending articles. Sync RSS in Source Library.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md">
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-intel-cyan" />
                      <span>Ingested Documents</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">{documents.length} Total</span>
                  </h3>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-4 bg-black/40 border border-white/5 rounded-xl group hover:border-intel-cyan/30 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-white group-hover:text-intel-cyan transition-colors">{doc.title}</div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[9px] font-mono text-slate-500 uppercase">{doc.type}</span>
                              <span className="text-slate-700">•</span>
                              <span className="text-[9px] font-mono text-slate-500">{doc.timestamp}</span>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-[8px] font-mono font-bold uppercase tracking-tighter ${
                            doc.status === 'READY' ? 'bg-emerald-500/10 text-emerald-500' :
                            doc.status === 'EXTRACTING' ? 'bg-intel-cyan/10 text-intel-cyan animate-pulse' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {doc.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Extraction Review & Push */}
              <div className="lg:col-span-6 space-y-6">
                <div className="min-h-[600px] flex flex-col">
                  {isExtracting ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 bg-slate-900/20 border border-dashed border-white/10 rounded-3xl">
                      <div className="relative">
                        <div className="w-20 h-20 border-4 border-intel-cyan/20 border-t-intel-cyan rounded-full animate-spin"></div>
                        <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-intel-cyan" />
                      </div>
                      <div className="text-center space-y-2">
                        <h4 className="text-xl font-bold text-white">Analyzing Intelligence Source</h4>
                        <p className="text-slate-500 text-sm font-mono">Running NLP Extraction Pipelines...</p>
                      </div>
                    </div>
                  ) : reviewQueue.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-mono font-bold text-intel-cyan uppercase tracking-widest flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4" />
                          <span>Extracted Fields Pending Review</span>
                        </h3>
                        <div className="flex items-center space-x-4">
                          {rejectedFields.length > 0 && (
                            <button 
                              onClick={() => setShowRejected(!showRejected)}
                              className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${
                                showRejected ? 'text-intel-red' : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {showRejected ? 'Hide' : 'Show'} Rejected ({rejectedFields.length})
                            </button>
                          )}
                          <div className="text-[10px] font-mono text-slate-500">{reviewQueue.length} Fields Detected</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                          {reviewQueue.map((field) => (
                            <motion.div 
                              key={field.id}
                              layout
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="p-5 bg-slate-900/60 border border-white/10 rounded-2xl group hover:border-intel-cyan/40 transition-all relative overflow-hidden"
                            >
                              <div className="absolute top-0 left-0 w-1 h-full bg-intel-cyan/20" />
                              <div className="flex items-start justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <div className="text-[10px] font-mono text-intel-cyan uppercase tracking-widest">{field.field.split('.')[0]} Intelligence</div>
                                      <div className="text-lg font-bold text-white">{FIELD_MAP[field.field as keyof typeof FIELD_MAP]?.label || field.field}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[10px] font-mono text-slate-500 uppercase">Confidence</div>
                                      <div className={`text-sm font-mono font-bold ${
                                        field.confidence === 'HIGH' ? 'text-emerald-500' : 
                                        field.confidence === 'MEDIUM' ? 'text-intel-orange' : 'text-intel-red'
                                      }`}>
                                        {field.confidence}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                      <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">Current Value</div>
                                      <div className="text-lg font-bold text-slate-400 font-mono">
                                        {field.oldValue ?? 'N/A'}{field.unit}
                                      </div>
                                    </div>
                                    <div className="p-3 bg-black/40 rounded-xl border border-intel-cyan/20 relative group/edit">
                                      <div className="text-[9px] font-mono text-intel-cyan uppercase mb-1">Extracted Value</div>
                                      {editingFieldId === field.id ? (
                                        <div className="flex items-center space-x-2">
                                          <input 
                                            autoFocus
                                            type="text" 
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleApprove(field);
                                              if (e.key === 'Escape') setEditingFieldId(null);
                                            }}
                                            className="w-full bg-white/5 border-b border-intel-cyan text-xl font-bold text-intel-cyan font-mono focus:outline-none"
                                          />
                                          <span className="text-xs text-intel-cyan">{field.unit}</span>
                                        </div>
                                      ) : (
                                        <div 
                                          className="flex items-center justify-between cursor-text"
                                          onClick={() => {
                                            setEditingFieldId(field.id);
                                            setEditingValue(String(field.value));
                                          }}
                                        >
                                          <div className="text-xl font-bold text-intel-cyan font-mono">
                                            {field.value}{field.unit}
                                          </div>
                                          <Plus className="w-3 h-3 text-intel-cyan opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                      <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">Source Context</div>
                                      <div className="text-[10px] text-slate-400 italic line-clamp-2 leading-relaxed">
                                        "...{field.sourceQuote}..."
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col space-y-2">
                                  <button 
                                    onClick={() => handleApprove(field)}
                                    className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-black transition-all"
                                    title="Approve"
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => handleReject(field)}
                                    className="p-3 bg-intel-red/10 text-intel-red border border-intel-red/20 rounded-xl hover:bg-intel-red hover:text-white transition-all"
                                    title="Reject"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}

                          {showRejected && rejectedFields.map((field) => (
                            <motion.div 
                              key={field.id}
                              layout
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 0.5, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="p-4 bg-intel-red/5 border border-intel-red/20 rounded-xl flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="text-[10px] font-mono text-intel-red uppercase">Rejected</div>
                                <div className="text-xs font-bold text-slate-400">{FIELD_MAP[field.field as keyof typeof FIELD_MAP]?.label}</div>
                                <div className="text-xs font-mono text-slate-500">{field.value}{field.unit}</div>
                              </div>
                              <button 
                                onClick={() => handleRestore(field)}
                                className="text-[10px] font-mono text-intel-cyan hover:underline uppercase"
                              >
                                Restore to Review
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 bg-slate-900/10 border border-dashed border-white/5 rounded-3xl">
                      <div className="p-6 bg-white/5 rounded-full">
                        <Search className="w-12 h-12 text-slate-700" />
                      </div>
                      <div className="text-center space-y-2">
                        <h4 className="text-xl font-bold text-slate-500">Review Queue Empty</h4>
                        <p className="text-slate-600 text-sm font-mono max-w-xs">Ingest a new document to begin intelligence extraction.</p>
                      </div>
                    </div>
                  )}

                  {approvedChanges.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 p-6 bg-intel-cyan/10 border border-intel-cyan/30 rounded-2xl backdrop-blur-xl shadow-[0_0_50px_rgba(0,242,255,0.1)]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-intel-cyan text-black rounded-xl">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">Staging: Ready for Push</h4>
                            <p className="text-intel-cyan/70 text-xs font-mono uppercase tracking-widest">
                              {approvedChanges.length} Validated Intelligence Points
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={handlePushToLive}
                          className="px-8 py-4 bg-intel-cyan text-black rounded-xl font-mono font-bold text-sm uppercase tracking-widest hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center space-x-3 shadow-[0_0_30px_rgba(0,242,255,0.4)]"
                        >
                          <span>Push to Live Intelligence</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mt-6 flex flex-wrap gap-2">
                        {approvedChanges.map(change => (
                          <div key={change.id} className="px-3 py-1.5 bg-black/40 border border-intel-cyan/20 rounded-lg flex items-center space-x-2">
                            <span className="text-[9px] font-mono text-intel-cyan uppercase">{FIELD_MAP[change.field]?.label}</span>
                            <span className="text-[9px] font-mono text-white font-bold">{change.value}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
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

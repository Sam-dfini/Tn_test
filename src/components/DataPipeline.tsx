import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Database, 
  Upload, 
  Link as LinkIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  Search, 
  RefreshCcw,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  History,
  Activity,
  Lock,
  FileSearch,
  Undo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePipeline } from '../context/PipelineContext';
import { 
  extractFieldsFromContent, 
  DOCUMENT_TYPES, 
  FIELD_MAP, 
  fetchURLContent,
  detectDocumentType,
  ExtractedField
} from '../services/pipelineService';
import { cn } from '../utils/cn';
import { BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';

interface IngestedDoc {
  id: string;
  name: string;
  url: string;
  type: string;
  status: 'QUEUED' | 'EXTRACTING' | 'DONE' | 'ERROR';
  timestamp: string;
  progress: number;
  fieldCount: number;
}

const pipelineAlerts = [
  { code: 'PIPE-01', title: 'BCT Q1 Report Available — FX Data Pending', impact: 'HIGH' },
  { code: 'PIPE-02', title: 'INS Unemployment Survey — March 2026', impact: 'MEDIUM' },
  { code: 'PIPE-03', title: 'IMF Article IV Consultation Due', impact: 'HIGH' },
  { code: 'PIPE-04', title: '3 Fields Awaiting Analyst Review', impact: 'WARNING' },
];

export const DataPipeline: React.FC = () => {
  const { data: platformData, pushApprovedChanges, auditLog, addAuditEntry } = usePipeline();
  
  const [documents, setDocuments] = useState<IngestedDoc[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ExtractedField[]>([]);
  const [approvedChanges, setApprovedChanges] = useState<ExtractedField[]>([]);
  const [rejectedFields, setRejectedFields] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [auditTab, setAuditTab] = useState<'activity' | 'changes'>('activity');
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  const addToast = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const detectedType = useMemo(() => detectDocumentType(urlInput), [urlInput]);

  const handleAddURL = async () => {
    if (!urlInput) return;
    
    const docType = detectDocumentType(urlInput);
    const newDoc: IngestedDoc = {
      id: Math.random().toString(36).substr(2, 9),
      name: urlInput.split('/').pop() || 'Document',
      url: urlInput,
      type: docType,
      status: 'QUEUED',
      timestamp: new Date().toISOString(),
      progress: 0,
      fieldCount: 0
    };

    setDocuments(prev => [newDoc, ...prev]);
    setUrlInput('');
    setIsExtracting(true);

    // Update status to EXTRACTING
    setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'EXTRACTING', progress: 30 } : d));

    try {
      const content = await fetchURLContent(newDoc.url);
      setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, progress: 60 } : d));
      
      const fields = await extractFieldsFromContent(content, docType, platformData);
      
      if (fields.length > 0) {
        setReviewQueue(prev => [...prev, ...fields]);
        setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'DONE', progress: 100, fieldCount: fields.length } : d));
        addToast(`Extracted ${fields.length} fields from document`);
        
        // Log extraction
        fields.forEach(field => {
          addAuditEntry({
            type: 'EXTRACTED',
            field: field.field,
            value: field.value,
            oldValue: field.oldValue,
            source: newDoc.url,
            label: field.label,
            timestamp: new Date().toISOString()
          });
        });
      } else {
        setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'ERROR', progress: 0 } : d));
        addToast("No relevant fields found in document");
      }
    } catch (err) {
      setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'ERROR', progress: 0 } : d));
      addToast("Extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const docType = detectDocumentType(file.name);
      
      const newDoc: IngestedDoc = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: 'local://' + file.name,
        type: docType,
        status: 'EXTRACTING',
        timestamp: new Date().toISOString(),
        progress: 50,
        fieldCount: 0
      };

      setDocuments(prev => [newDoc, ...prev]);
      setIsExtracting(true);

      try {
        const fields = await extractFieldsFromContent(content, docType, platformData);
        if (fields.length > 0) {
          setReviewQueue(prev => [...prev, ...fields]);
          setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'DONE', progress: 100, fieldCount: fields.length } : d));
          addToast(`Extracted ${fields.length} fields from ${file.name}`);
          
          fields.forEach(field => {
            addAuditEntry({
              type: 'EXTRACTED',
              field: field.field,
              value: field.value,
              oldValue: field.oldValue,
              source: file.name,
              label: field.label,
              timestamp: new Date().toISOString()
            });
          });
        } else {
          setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'ERROR', progress: 0 } : d));
          addToast("No relevant fields found in file");
        }
      } catch (err) {
        setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'ERROR', progress: 0 } : d));
        addToast("File extraction failed");
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleApprove = (field: ExtractedField) => {
    setReviewQueue(prev => prev.filter(f => f.field !== field.field));
    setApprovedChanges(prev => [...prev, field]);
  };

  const handleReject = (field: ExtractedField) => {
    setReviewQueue(prev => prev.filter(f => f.field !== field.field));
    setRejectedFields(prev => [...prev, field.field]);
    addAuditEntry({
      type: 'REJECTED',
      field: field.field,
      value: field.value,
      oldValue: field.oldValue,
      source: 'Analyst Review',
      label: field.label,
      timestamp: new Date().toISOString()
    });
  };

  const handleUndo = (field: ExtractedField) => {
    setApprovedChanges(prev => prev.filter(f => f.field !== field.field));
    setReviewQueue(prev => [field, ...prev]);
  };

  const handleRejectAll = () => {
    reviewQueue.forEach(field => {
      addAuditEntry({
        type: 'REJECTED',
        field: field.field,
        value: field.value,
        oldValue: field.oldValue,
        source: 'Analyst Review (Bulk)',
        label: field.label,
        timestamp: new Date().toISOString()
      });
    });
    setRejectedFields(prev => [...prev, ...reviewQueue.map(f => f.field)]);
    setReviewQueue([]);
  };

  const handleApproveAll = () => {
    setApprovedChanges(prev => [...prev, ...reviewQueue]);
    setReviewQueue([]);
  };

  const handlePush = () => {
    const changes = approvedChanges.map(c => ({
      field: c.field,
      value: c.value,
      oldValue: c.oldValue,
      source: 'Data Pipeline Extraction',
      label: c.label,
      approvedAt: new Date().toISOString()
    }));

    pushApprovedChanges(changes);
    addToast(`Pushed ${changes.length} changes to platform`);
    setApprovedChanges([]);
    setReviewQueue([]);
  };

  const lastPushTime = platformData.last_pipeline_push 
    ? new Date(platformData.last_pipeline_push).toLocaleTimeString() 
    : "Never";

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Data Pipeline"
        subtitle="Automated intelligence extraction and multi-source data synchronization"
        icon={Database}
        nodeId="PIPE-01"
      />

      <LiveTicker items={pipelineAlerts} />

      {/* Header Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-20">
        {[
          { label: 'Documents Ingested', value: documents.length, color: 'text-white' },
          { label: 'Fields Extracted', value: reviewQueue.length + approvedChanges.length, color: 'text-intel-cyan' },
          { label: 'Approved', value: approvedChanges.length, color: 'text-intel-green' },
          { label: 'Last Push', value: lastPushTime, color: 'text-slate-400' },
        ].map((stat, i) => (
          <div key={i} className="glass p-4 rounded-2xl border border-intel-border">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className={cn("text-xl font-bold font-mono", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-[280px_1fr_300px] gap-3 min-height-[700px] relative z-20">
        
        {/* COLUMN 1: INGEST */}
        <div className="glass rounded-3xl border border-intel-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-intel-border flex items-center justify-between bg-white/5">
            <div className="flex items-center space-x-2">
              <span className="text-intel-cyan">⬡</span>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Ingest</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{documents.length}</span>
          </div>

          <div className="p-4 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
            {/* Analyst Notice */}
            <div className="p-3 rounded-xl border border-intel-cyan/20 bg-intel-cyan/5 flex items-start space-x-3">
              <Lock className="w-4 h-4 text-intel-cyan shrink-0 mt-0.5" />
              <p className="text-[9px] text-intel-cyan leading-relaxed font-medium uppercase tracking-tight">
                All data changes require analyst approval before going live. Rejected items are kept permanently.
              </p>
            </div>

            {/* URL Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paste URL</label>
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://www.bct.gov.tn/..."
                  className="w-full bg-black/40 border border-intel-border rounded-lg px-3 py-2 text-[10px] font-mono text-white focus:outline-none focus:border-intel-cyan/50 transition-colors"
                />
                {urlInput && (
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 rounded text-[8px] font-mono font-bold uppercase">
                      {detectedType !== 'unknown' ? DOCUMENT_TYPES.find(d => d.id === detectedType)?.icon : '📄'} 
                      {' '}{detectedType !== 'unknown' ? DOCUMENT_TYPES.find(d => d.id === detectedType)?.name : 'Unknown Source'}
                    </span>
                  </div>
                )}
                <button 
                  onClick={handleAddURL}
                  disabled={!urlInput || isExtracting}
                  className="w-full py-2 bg-intel-cyan text-intel-bg rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                >
                  Add URL
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4 py-2">
              <div className="h-px flex-1 bg-intel-border" />
              <span className="text-[8px] font-mono text-slate-600 uppercase">OR</span>
              <div className="h-px flex-1 bg-intel-border" />
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <div className="relative group">
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  accept=".pdf,.csv,.txt,.xlsx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-intel-border rounded-2xl p-6 text-center group-hover:border-intel-cyan/50 transition-all bg-white/2">
                  <Upload className="w-6 h-6 text-slate-600 mx-auto mb-2 group-hover:text-intel-cyan transition-colors" />
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Drop PDF, CSV, or TXT</p>
                  <p className="text-[8px] text-slate-600 uppercase mt-1">Or <span className="text-intel-cyan">Browse files</span></p>
                </div>
              </div>
            </div>

            {/* Quick Select */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Add by Source</label>
              <div className="grid grid-cols-2 gap-2">
                {DOCUMENT_TYPES.map(type => (
                  <button 
                    key={type.id}
                    onClick={() => setUrlInput(`https://www.${type.domain}/report-2026`)}
                    className="p-2 bg-white/5 border border-white/5 rounded-lg hover:border-intel-cyan/30 transition-all text-left group"
                  >
                    <div className="text-sm mb-1">{type.icon}</div>
                    <div className="text-[8px] font-mono text-slate-400 uppercase group-hover:text-white transition-colors">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Queue */}
            <div className="space-y-3 pt-4 border-t border-intel-border">
              <label className="text-[10px] font-bold text-white uppercase tracking-widest">Document Queue</label>
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="p-3 bg-black/40 border border-intel-border rounded-xl space-y-2 relative group">
                    <button 
                      onClick={() => setDocuments(prev => prev.filter(d => d.id !== doc.id))}
                      className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-intel-red"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <span className="text-sm">{DOCUMENT_TYPES.find(d => d.id === doc.type)?.icon || '📄'}</span>
                        <div className="overflow-hidden">
                          <div className="text-[10px] font-bold text-white truncate">{doc.name}</div>
                          <div className="text-[8px] font-mono text-slate-500 truncate">{doc.url.startsWith('local') ? 'Local File' : new URL(doc.url).hostname}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase flex items-center space-x-1",
                        doc.status === 'DONE' ? "bg-intel-green/10 text-intel-green border border-intel-green/20" :
                        doc.status === 'EXTRACTING' ? "bg-intel-orange/10 text-intel-orange border border-intel-orange/20" :
                        doc.status === 'ERROR' ? "bg-intel-red/10 text-intel-red border border-intel-red/20" :
                        "bg-slate-800 text-slate-500"
                      )}>
                        {doc.status === 'EXTRACTING' && <RefreshCcw className="w-2 h-2 animate-spin" />}
                        <span>{doc.status === 'DONE' ? `${doc.fieldCount} fields found` : doc.status}</span>
                      </div>
                      {doc.status === 'ERROR' && (
                        <button className="text-[8px] font-mono text-intel-cyan uppercase font-bold hover:underline">Retry</button>
                      )}
                    </div>

                    {doc.status === 'EXTRACTING' && (
                      <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-intel-cyan"
                          initial={{ width: 0 }}
                          animate={{ width: `${doc.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-intel-border rounded-xl opacity-30">
                    <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Queue Empty</span>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Sources */}
            <div className="pt-4 space-y-3 opacity-30">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suggested Sources</label>
                <span className="text-[7px] font-mono text-slate-600 uppercase italic">coming soon</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { icon: '🏦', name: 'bct.gov.tn', desc: 'FX reserves, inflation' },
                  { icon: '📊', name: 'ins.tn', desc: 'unemployment, GDP' },
                  { icon: '🌐', name: 'imf.org', desc: 'debt, fiscal data' },
                  { icon: '🏛', name: 'worldbank.org', desc: 'development indicators' },
                  { icon: '⚡', name: 'steg.com.tn', desc: 'energy data' },
                  { icon: '📰', name: 'tap.info.tn', desc: 'political events' }
                ].map((source, i) => (
                  <div key={i} className="flex items-center space-x-2 p-2 rounded bg-white/2 border border-white/5">
                    <span className="text-xs">{source.icon}</span>
                    <div className="overflow-hidden">
                      <div className="text-[8px] font-bold text-slate-400 truncate">{source.name}</div>
                      <div className="text-[7px] font-mono text-slate-600 truncate">{source.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: REVIEW QUEUE */}
        <div className="glass rounded-3xl border border-intel-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-intel-border flex items-center justify-between bg-white/5">
            <div className="flex items-center space-x-2">
              <span className="text-intel-cyan">◈</span>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Review Queue</h3>
            </div>
            <div className="px-2 py-0.5 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 rounded text-[10px] font-mono font-bold">
              {reviewQueue.length} PENDING
            </div>
          </div>

          {/* Mini Stats Row */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-black/20 border-b border-intel-border">
            {[
              { label: 'PENDING', value: reviewQueue.length, color: 'text-intel-orange' },
              { label: 'APPROVED', value: approvedChanges.length, color: 'text-intel-green' },
              { label: 'REJECTED', value: rejectedFields.length, color: 'text-intel-red' },
              { label: 'PUSHED', value: auditLog.filter(e => e.type === 'PUSH').length, color: 'text-intel-cyan' }
            ].map((stat, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/2 border border-white/5 text-center">
                <div className="text-[7px] font-mono text-slate-500 uppercase mb-0.5">{stat.label}</div>
                <div className={cn("text-xs font-bold font-mono", stat.color)}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {/* Review Items */}
            <AnimatePresence mode="popLayout">
              {reviewQueue.map((field, i) => (
                <motion.div 
                  key={field.field}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="intel-card p-4 rounded-2xl border border-intel-border space-y-4 group hover:border-intel-cyan/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono font-bold text-intel-cyan uppercase tracking-wider">{field.field}</div>
                      <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] font-mono text-slate-400 uppercase">{field.module}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase",
                          field.confidence === 'HIGH' ? "bg-intel-green/10 text-intel-green border border-intel-green/20" :
                          field.confidence === 'MEDIUM' ? "bg-intel-orange/10 text-intel-orange border border-intel-orange/20" :
                          "bg-intel-red/10 text-intel-red border border-intel-red/20"
                        )}>
                          Confidence: {field.confidence}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                      <div className="text-[7px] font-mono text-slate-500 uppercase">Current</div>
                      <div className="text-lg font-bold text-slate-500 font-mono line-through opacity-50">{field.oldValue ?? 'N/A'}</div>
                      <div className="text-[8px] font-mono text-slate-600 uppercase">{field.unit}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-700" />
                    <div className="p-3 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl space-y-1">
                      <div className="text-[7px] font-mono text-intel-cyan uppercase">Proposed</div>
                      <div className="text-lg font-bold text-white font-mono">{field.value}</div>
                      <div className="text-[8px] font-mono text-intel-cyan uppercase">{field.unit}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 border-l-2 border-intel-cyan rounded-r-xl">
                    <p className="text-[10px] text-slate-400 italic leading-relaxed">"{field.sourceQuote}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleApprove(field)}
                      className="flex items-center justify-center space-x-2 py-2 bg-intel-green/10 text-intel-green border border-intel-green/20 rounded-lg hover:bg-intel-green hover:text-intel-bg transition-all text-[10px] font-bold uppercase"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button 
                      onClick={() => handleReject(field)}
                      className="flex items-center justify-center space-x-2 py-2 bg-intel-red/10 text-intel-red border border-intel-red/20 rounded-lg hover:bg-intel-red hover:text-intel-bg transition-all text-[10px] font-bold uppercase"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Approved but not pushed */}
              {approvedChanges.map((field) => (
                <motion.div 
                  key={field.field}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="intel-card p-4 rounded-2xl border border-intel-green/30 bg-intel-green/5 space-y-4 opacity-70"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono font-bold text-intel-green uppercase tracking-wider">{field.field}</div>
                      <div className="text-[8px] font-mono text-intel-green uppercase font-bold">APPROVED — pending push</div>
                    </div>
                    <button 
                      onClick={() => handleUndo(field)}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                      title="Undo"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {reviewQueue.length === 0 && approvedChanges.length === 0 && !isExtracting && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 py-20">
                <div className="w-16 h-16 bg-intel-border rounded-full flex items-center justify-center">
                  <FileSearch className="w-8 h-8 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">No items in queue</h4>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto">
                    Ingest a document from the left panel to begin the extraction and review process.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="p-4 border-t border-intel-border bg-intel-bg/80 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1">
              <span>{approvedChanges.length} approved · {reviewQueue.length} pending · {rejectedFields.length} rejected</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleApproveAll}
                disabled={reviewQueue.length === 0}
                className="py-2 bg-intel-green/10 text-intel-green border border-intel-green/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-intel-green hover:text-intel-bg transition-all disabled:opacity-30"
              >
                Approve All
              </button>
              <button 
                onClick={handleRejectAll}
                disabled={reviewQueue.length === 0}
                className="py-2 bg-white/5 border border-white/10 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all disabled:opacity-30"
              >
                Reject Remaining
              </button>
            </div>

            <button 
              onClick={handlePush}
              disabled={approvedChanges.length === 0}
              className="w-full py-3 bg-intel-cyan text-intel-bg rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_30px_rgba(0,242,255,0.2)] disabled:opacity-30 disabled:shadow-none flex items-center justify-center space-x-3"
            >
              <span>Push {approvedChanges.length} changes to platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* COLUMN 3: AUDIT LOG */}
        <div className="glass rounded-3xl border border-intel-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-intel-border space-y-4 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-intel-cyan">⬡</span>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Audit Log</h3>
              </div>
              <div className="px-1.5 py-0.5 bg-white/5 text-slate-400 rounded text-[10px] font-mono">{auditLog.length}</div>
            </div>
            
            <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
              <button 
                onClick={() => setAuditTab('activity')}
                className={cn(
                  "flex-1 py-1.5 text-[9px] font-mono uppercase tracking-widest rounded transition-all",
                  auditTab === 'activity' ? "bg-intel-cyan/10 text-intel-cyan" : "text-slate-500 hover:text-slate-300"
                )}
              >
                Activity
              </button>
              <button 
                onClick={() => setAuditTab('changes')}
                className={cn(
                  "flex-1 py-1.5 text-[9px] font-mono uppercase tracking-widest rounded transition-all",
                  auditTab === 'changes' ? "bg-intel-cyan/10 text-intel-cyan" : "text-slate-500 hover:text-slate-300"
                )}
              >
                History
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {auditTab === 'activity' ? (
              auditLog.map((entry) => (
                <div key={entry.id} className="p-3 bg-white/2 border border-white/5 rounded-xl space-y-2 group hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase",
                      entry.type === 'PUSH' ? "bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20" :
                      entry.type === 'APPROVED' ? "bg-intel-green/10 text-intel-green border border-intel-green/20" :
                      entry.type === 'REJECTED' ? "bg-intel-red/10 text-intel-red border border-intel-red/20" :
                      entry.type === 'EXTRACTED' ? "bg-intel-purple/10 text-intel-purple border border-intel-purple/20" :
                      "bg-intel-orange/10 text-intel-orange border border-intel-orange/20"
                    )}>
                      {entry.type}
                    </span>
                    <span className="text-[8px] font-mono text-slate-600 uppercase">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-white truncate">{entry.field}</div>
                  <div className="text-[8px] font-mono text-slate-500 uppercase truncate">Source: {entry.source}</div>
                  {entry.value !== null && entry.oldValue !== undefined && (
                    <div className="flex items-center space-x-2 text-[9px] font-mono pt-1 border-t border-white/5">
                      <span className="text-slate-500">{entry.oldValue}</span>
                      <ArrowRight className="w-2 h-2 text-slate-700" />
                      <span className="text-intel-cyan font-bold">{entry.value}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="space-y-4">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-white/5">
                    {auditLog.filter(e => e.type === 'APPROVED' || e.type === 'PUSH').slice(0, 50).map((entry) => (
                      <tr key={entry.id} className="group">
                        <td className="py-3 pr-2">
                          <div className="text-[9px] font-mono text-white truncate max-w-[120px]">{entry.field}</div>
                          <div className="text-[7px] font-mono text-slate-600 uppercase">{new Date(entry.timestamp).toLocaleDateString()}</div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="text-[9px] font-mono text-intel-cyan font-bold">{entry.value}</div>
                          <div className="text-[7px] font-mono text-slate-600 uppercase">from {entry.oldValue ?? 'N/A'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-intel-border bg-black/40">
            <p className="text-[8px] font-mono text-slate-600 uppercase text-center leading-relaxed">
              Rejected items are kept permanently for audit compliance. Last 200 activity entries retained.
            </p>
          </div>
        </div>
      </div>

      {/* Toast System */}
      <div className="fixed bottom-8 right-8 z-[210] space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div 
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-intel-card border border-intel-cyan/30 px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3"
            >
              <ShieldCheck className="w-4 h-4 text-intel-cyan" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

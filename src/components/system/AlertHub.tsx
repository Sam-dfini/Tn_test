import React, { useState } from 'react';
import { ShieldAlert, Radio, AlertTriangle, Filter, Check, Clock, Globe, X, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAlerts } from '../../context/AlertContext';
import { SystemAlert } from '../../types/alert';
import { ModuleHeader, BackgroundGrid } from '../shared/ProfessionalShared';

export const AlertHub: React.FC = () => {
  const { alerts, markAsRead, markAllAsRead, dismissAlert, clearAll } = useAlerts();
  const [filter, setFilter] = useState<'ALL' | 'TACTICAL' | 'OPERATIONAL' | 'STRATEGIC'>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);

  const filteredAlerts = alerts.filter(a => filter === 'ALL' || a.severity === filter);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'STRATEGIC': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'OPERATIONAL': return 'text-intel-orange bg-intel-orange/10 border-intel-orange/30';
      case 'TACTICAL': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'STRATEGIC': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'OPERATIONAL': return <AlertTriangle className="w-5 h-5 text-intel-orange" />;
      case 'TACTICAL': return <Radio className="w-5 h-5 text-yellow-500" />;
      default: return <Radio className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader
        title="Alert Hub"
        subtitle="Centralized intelligence signal escalation and deduplication engine."
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Feed */}
        <div className="w-full md:w-2/3 flex flex-col space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-3 rounded-xl border border-intel-border">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              {['ALL', 'STRATEGIC', 'OPERATIONAL', 'TACTICAL'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all ${
                    filter === f
                      ? 'bg-intel-cyan text-black font-bold'
                      : 'bg-black/40 text-slate-400 hover:text-white border border-intel-border/50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-2 px-3 py-1.5 bg-black/40 border border-intel-border/50 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Check className="w-3 h-3" />
                <span className="text-[10px] font-mono uppercase">Mark All Read</span>
              </button>
              <button
                onClick={clearAll}
                className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-3 h-3" />
                <span className="text-[10px] font-mono uppercase">Clear All</span>
              </button>
            </div>
          </div>

          {/* Alert Feed */}
          <div className="flex-1 min-h-[500px] max-h-[700px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {filteredAlerts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-48 glass rounded-xl border border-intel-border/50 text-slate-500"
                >
                  <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm font-mono tracking-widest uppercase">No Active Alerts</span>
                </motion.div>
              ) : (
                filteredAlerts.map(alert => (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => {
                      setSelectedAlert(alert);
                      if (!alert.read) markAsRead(alert.id);
                    }}
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5 ${
                      selectedAlert?.id === alert.id ? 'ring-2 ring-intel-cyan bg-slate-800/80' : 'bg-black/60 hover:bg-slate-800/50'
                    } ${alert.read ? 'border-intel-border/30 opacity-70' : 'border-intel-border shadow-[0_0_15px_rgba(0,0,0,0.5)]'}`}
                  >
                    {!alert.read && (
                      <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-intel-cyan -mt-1 -mr-1 shadow-[0_0_10px_#00f2ff]" />
                    )}
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-bold tracking-widest ${getSeverityColor(alert.severity).split(' ')[0]}`}>
                              {alert.severity}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-[10px] font-mono text-intel-cyan uppercase tracking-wider">
                              {alert.domain}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className={`text-sm font-medium truncate ${alert.read ? 'text-slate-300' : 'text-white'}`}>
                          {alert.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Detail View */}
        <div className="w-full md:w-1/3 h-[500px] md:h-[770px] glass rounded-xl border border-intel-border p-6 overflow-y-auto">
          <BackgroundGrid />
          {selectedAlert ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative z-10 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${getSeverityColor(selectedAlert.severity)}`}>
                  {getSeverityIcon(selectedAlert.severity)}
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    {selectedAlert.severity} ALERT
                  </span>
                </div>
                <button
                  onClick={() => dismissAlert(selectedAlert.id)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                  title="Dismiss Alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white leading-tight mb-2">
                  {selectedAlert.title}
                </h2>
                <div className="flex items-center space-x-4 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(selectedAlert.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>{selectedAlert.source}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-intel-border/50 text-sm text-slate-300 leading-relaxed">
                {selectedAlert.message}
              </div>

              {selectedAlert.governorates && selectedAlert.governorates.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">
                    Affected Regions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlert.governorates.map(gov => (
                      <span key={gov} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700">
                        {gov}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedAlert.affectedEquations && selectedAlert.affectedEquations.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">
                    Equation Impact
                  </h4>
                  <div className="space-y-2">
                    {selectedAlert.affectedEquations.map(eq => (
                      <div key={eq} className="flex items-center justify-between p-2 bg-intel-cyan/5 border border-intel-cyan/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-intel-cyan" />
                          <span className="text-xs font-bold text-intel-cyan">{eq}</span>
                        </div>
                        <span className="text-[10px] text-intel-cyan/70 font-mono">Recomputing</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-slate-500">
              <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-mono tracking-widest uppercase">Select an alert to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { safeStorage } from '../utils/storage';

import { generateRandomId } from '../utils/idUtils';

export interface AuditEntry {
  id: string;
  type: 'PUSH' | 'APPROVED' | 'REJECTED' | 'EXTRACTED' | 'RESET';
  field: string;
  value: any;
  oldValue?: any;
  source: string;
  label: string;
  timestamp: string;
}

interface AuditContextType {
  auditLog: AuditEntry[];
  addAuditEntry: (entry: Omit<AuditEntry, 'id'>) => void;
  clearAuditLog: () => void;
}

export const AuditContext = createContext<AuditContextType>({} as AuditContextType);

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => {
    try {
      const saved = safeStorage.getItem('ti_audit_log');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try {
      safeStorage.setItem('ti_audit_log', JSON.stringify(auditLog.slice(0, 200)));
    } catch {}
  }, [auditLog]);

  const addAuditEntry = useCallback((entry: Omit<AuditEntry, 'id'>) => {
    setAuditLog(prev => [{
      ...entry,
      id: generateRandomId('audit')
    }, ...prev]);
  }, []);

  const clearAuditLog = useCallback(() => {
    setAuditLog([]);
  }, []);

  return (
    <AuditContext.Provider value={{ auditLog, addAuditEntry, clearAuditLog }}>
      {children}
    </AuditContext.Provider>
  );
};

export const useAuditLog = () => useContext(AuditContext);

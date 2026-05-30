import { SystemAlert } from '../types/alert';
import { Notification, NotificationType, NotificationPriority } from '../context/NotificationContext';

// Map AlertSeverity to NotificationPriority
const mapSeverityToPriority = (severity: string): NotificationPriority => {
  switch (severity.toUpperCase()) {
    case 'STRATEGIC':
      return 'CRITICAL';
    case 'OPERATIONAL':
      return 'HIGH';
    case 'TACTICAL':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
};

// Map domain to notification type
const mapDomainToType = (domain: string): NotificationType => {
  const d = domain.toUpperCase();
  if (d.includes('RRI') || d.includes('SYSTEM')) return 'RRI';
  if (d.includes('ALERT') || d.includes('FX') || d.includes('UGTT')) return 'ALERT';
  if (d.includes('PIPELINE') || d.includes('FIELD') || d.includes('DOC')) return 'PIPELINE';
  if (d.includes('RSS') || d.includes('NEWS') || d.includes('ARTICLE')) return 'RSS';
  if (d.includes('SOURCE')) return 'SOURCE';
  if (d.includes('AGRO') || d.includes('BREAD') || d.includes('SHORTAGE')) return 'ALERT';
  if (d.includes('SOCIAL') || d.includes('PROTEST') || d.includes('STRIKE')) return 'ALERT';
  if (d.includes('POLITICAL') || d.includes('ELITE') || d.includes('DEFECTION')) return 'ALERT';
  return 'SYSTEM';
};

/**
 * Convert a SystemAlert to a Notification
 * This is the single source of truth for alert-to-notification mapping
 */
export const mapSystemAlertToNotification = (
  alert: SystemAlert,
  triggerMetadata?: {
    triggerRule?: string;
    threshold?: number | string;
    observedValue?: number | string;
    previousValue?: number | string;
    delta?: number;
  }
): Notification => {
  const priority = mapSeverityToPriority(alert.severity);
  const type = mapDomainToType(alert.domain);

  // Build title with severity prefix for clarity
  const severityPrefix = priority === 'CRITICAL' ? '🚨 ' : 
                         priority === 'HIGH' ? '⚠️ ' : 
                         priority === 'MEDIUM' ? '🟡 ' : '⚪ ';
  
  const title = `${severityPrefix}${alert.title}`;

  // Build message with source and affected equations
  const sourceInfo = alert.source ? `[${alert.source}]` : '';
  const equationsInfo = alert.affectedEquations?.length 
    ? ` (${alert.affectedEquations.join(', ')})` 
    : '';
  
  const message = `${alert.message} ${sourceInfo}${equationsInfo}`.trim();

  // Build action if domain suggests navigation
  let action = undefined;
  if (alert.domain === 'POLITICAL' || alert.domain === 'SOCIAL') {
    action = {
      label: 'View Details',
      event: 'navigate-to-pipeline',
      detail: { tab: 'social' }
    };
  } else if (alert.domain === 'AGRICULTURE') {
    action = {
      label: 'View Agro',
      event: 'navigate-to-pipeline',
      detail: { tab: 'agro' }
    };
  } else if (alert.domain === 'SYSTEM') {
    action = {
      label: 'View System',
      event: 'navigate-main',
      detail: { tab: 'system' }
    };
  }

  return {
    id: alert.id,
    type,
    priority,
    title,
    message,
    timestamp: new Date(alert.timestamp).getTime(),
    read: alert.read || false,
    action,
    sourceName: alert.source,
    rriVariable: alert.affectedEquations?.[0],
    // PR4: Include trigger metadata for explainability
    triggerRule: triggerMetadata?.triggerRule,
    threshold: triggerMetadata?.threshold,
    observedValue: triggerMetadata?.observedValue,
    previousValue: triggerMetadata?.previousValue,
    delta: triggerMetadata?.delta,
  };
};

/**
 * Batch convert SystemAlerts to Notifications
 */
export const mapSystemAlertsToNotifications = (
  alerts: SystemAlert[],
  triggerMetadataMap?: Record<string, {
    triggerRule?: string;
    threshold?: number | string;
    observedValue?: number | string;
    previousValue?: number | string;
    delta?: number;
  }>
): Notification[] => {
  return alerts.map(alert => {
    const metadata = triggerMetadataMap?.[alert.id];
    return mapSystemAlertToNotification(alert, metadata);
  });
};

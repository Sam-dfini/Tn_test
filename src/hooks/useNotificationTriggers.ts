import { safeStorage } from '../utils/storage';
import { useEffect, useRef } from 'react';
import { usePipeline } from '../context/PipelineContext';
import { useNotifications } from '../context/NotificationContext';
import { getSeasonalForecast } from '../services/shortageDetector';

export const useNotificationTriggers = () => {
  const { data, rriState, auditLog } = usePipeline();
  const { addNotification } = useNotifications();

  // Track previous values to detect changes
  const prevRRI = useRef(rriState?.rri ?? 0);
  const prevVelocity = useRef(rriState?.velocity ?? 0);
  const prevFX = useRef(data?.economy?.fx_reserves ?? 0);
  const prevUGTT = useRef(data?.social?.ugtt_mobilisation_level ?? 'STABLE');
  const prevProtests = useRef(data?.social?.protest_events_30d ?? 0);
  const prevD54 = useRef(data?.social?.decree54_charged ?? 0);
  const prevPattern = useRef(rriState?.pattern_similarity ?? 0);
  const prevAuditLen = useRef(auditLog?.length ?? 0);
  const initialized = useRef(false);

  // One-time: seed notifications reflecting current state
  useEffect(() => {
    const hasSeeded = safeStorage.getItem('ti_notifications_seeded');
    if (hasSeeded) return;

    setTimeout(() => {
      // Current state summary
      if (rriState.rri >= 2.0) {
        addNotification({
          type: 'RRI',
          priority: rriState.rri >= 2.625 ? 'CRITICAL' : 'HIGH',
          title: `Current R(t) = ${(rriState?.rri ?? 0).toFixed(4)}`,
          message: `Platform initialized. P_rev = ${((rriState?.p_rev ?? 0) * 100).toFixed(1)}%. ${rriState.threshold_breaches?.length || 0} threshold breaches active.`,
          action: { label: 'View Risk Model', event: 'navigate-main', detail: { tab: 'risk' } },
        });
      }

      if (data.economy.fx_reserves < 90) {
        addNotification({
          type: 'ALERT',
          priority: 'HIGH',
          title: 'FX Reserves Below Warning',
          message: `Current: ${data.economy.fx_reserves} days. Warning threshold: 90 days.`,
          action: { label: 'View Economy', event: 'navigate-to-pipeline', detail: { tab: 'economy' } },
          rriVariable: 'A_FX',
        });
      }

      if (data.social.ugtt_mobilisation_level === 'HIGH') {
        addNotification({
          type: 'ALERT',
          priority: 'CRITICAL',
          title: 'UGTT Mobilisation: HIGH',
          message: `General strike threshold at 64%. ${data.social.ugtt_strike_count_2025 || 847} strikes in 2025.`,
          action: { label: 'View UGTT', event: 'navigate-to-pipeline', detail: { tab: 'political', subTab: 'ugtt' } },
          rriVariable: 'M_UGTT',
        });
      }

      if ((rriState?.pattern_similarity ?? 0) > 0.5) {
        addNotification({
          type: 'RRI',
          priority: 'HIGH',
          title: 'Historical Pattern Match Active',
          message: `HPS = ${((rriState?.pattern_similarity ?? 0) * 100).toFixed(0)}% — ${rriState?.pattern_label ?? 'Scanning...'}`,
          action: { label: 'View Methodology', event: 'open-methodology', detail: { equation: '20' } },
        });
      }

      safeStorage.setItem('ti_notifications_seeded', 'true');
    }, 1000); // wait 1s for RRI to calculate

  }, []); // run once on mount

  // Seasonal shortage warning — fires once per week
  useEffect(() => {
    const weekKey = `shortage_seasonal_${new Date().toISOString().slice(0, 7)}`;
    if (safeStorage.getItem(weekKey)) return;

    const forecasts = getSeasonalForecast();
    const highPriority = forecasts.filter(f => f.priority === 'high');

    if (highPriority.length > 0) {
      addNotification({
        type: 'ALERT',
        priority: 'MEDIUM',
        title: `Seasonal Shortage Risk: ${highPriority[0].type.toUpperCase()}`,
        message: `${highPriority[0].warning}. ${highPriority[0].timeframe}. Interior governorates most vulnerable.`,
        action: {
          label: 'View Shortage Monitor',
          event: 'navigate-to-pipeline',
          detail: { tab: 'economy', subTab: 'shortages' }
        },
        rriVariable: 'B22',
      });
      safeStorage.setItem(weekKey, '1');
    }
  }, [addNotification]); // run once on mount (or when addNotification changes)

  useEffect(() => {
    // Skip first render — just record initial values
    if (!initialized.current) {
      initialized.current = true;
      prevRRI.current = rriState.rri;
      prevVelocity.current = rriState.velocity;
      prevFX.current = data.economy.fx_reserves;
      prevUGTT.current = data.social.ugtt_mobilisation_level;
      prevProtests.current = data.social.protest_events_30d;
      prevD54.current = data.social.decree54_charged;
      prevPattern.current = rriState.pattern_similarity;
      prevAuditLen.current = auditLog.length;
      return;
    }

    // ── RRI THRESHOLD BREACH ────────────────────────────────
    if (rriState && typeof rriState.rri === 'number' && rriState.rri >= 2.625 && prevRRI.current < 2.625) {
      addNotification({
        type: 'RRI',
        priority: 'CRITICAL',
        title: '⚠ Revolution Threshold Breached',
        message: `R(t) = ${(rriState?.rri ?? 0).toFixed(4)} has crossed the 50% revolution probability threshold. P_rev = ${( (rriState?.p_rev || 0) * 100).toFixed(1)}%.`,
        action: {
          label: 'View Risk Model',
          event: 'navigate-main',
          detail: { tab: 'risk' }
        },
        rriDelta: rriState.rri - prevRRI.current,
      });
    }

    // ── THRESHOLD BREACH DETECTED ───────────────────────────
    if (rriState && rriState.threshold_breaches && Array.isArray(rriState.threshold_breaches) && rriState.threshold_breaches.length > 0) {
      const lastBreach = rriState.threshold_breaches[rriState.threshold_breaches.length - 1];
      if (lastBreach && typeof lastBreach === 'object') {
        const breachKey = `breach_${lastBreach.variable || 'v'}_${lastBreach.value || '0'}`;
        if (!safeStorage.getItem(breachKey)) {
          const lVal = typeof lastBreach.value === 'number' ? lastBreach.value.toFixed(2) : lastBreach.value;
          const lThr = typeof lastBreach.threshold === 'number' ? lastBreach.threshold.toFixed(2) : lastBreach.threshold;
          const lImp = typeof lastBreach.impact === 'number' ? lastBreach.impact.toFixed(3) : '0.000';
          const label = lastBreach.label || lastBreach.variable || 'Unknown Variable';

          addNotification({
            type: 'ALERT',
            priority: 'HIGH',
            title: `Threshold Breach: ${label}`,
            message: `${label} reached ${lVal} (Limit: ${lThr}). RRI impact: +${lImp}.`,
            action: {
              label: 'View Variable',
              event: 'navigate-to-pipeline',
              detail: { tab: 'pipeline' }
            },
            rriVariable: lastBreach.variable,
          });
          safeStorage.setItem(breachKey, 'true');
        }
      }
    }

    // ── RRI SIGNIFICANT JUMP (>0.10 in one recalc) ──────────
    const rriJump = (rriState?.rri ?? 0) - (prevRRI.current ?? 0);
    if (Math.abs(rriJump) > 0.10) {
      addNotification({
        type: 'RRI',
        priority: rriJump > 0 ? 'HIGH' : 'MEDIUM',
        title: rriJump > 0
          ? `R(t) Jumped +${rriJump.toFixed(3)}`
          : `R(t) Improved ${rriJump.toFixed(3)}`,
        message: `Revolutionary Risk Index moved from ${(prevRRI.current ?? 0).toFixed(4)} to ${(rriState?.rri ?? 0).toFixed(4)}. P_rev = ${((rriState?.p_rev ?? 0) * 100).toFixed(1)}%.`,
        action: {
          label: 'View Risk Model',
          event: 'navigate-main',
          detail: { tab: 'risk' }
        },
        rriDelta: rriJump,
      });
    }

    // ── VELOCITY ACCELERATION ───────────────────────────────
    if ((rriState?.velocity ?? 0) > 0.20 && (prevVelocity.current ?? 0) <= 0.20) {
      addNotification({
        type: 'RRI',
        priority: 'HIGH',
        title: 'Rapid Deterioration — V(t) Accelerating',
        message: `Velocity index reached +${(rriState?.velocity ?? 0).toFixed(3)} (${rriState?.velocity_label || 'DETERIORATING'}). Multiple variables deteriorating simultaneously.`,
        action: {
          label: 'View Velocity',
          event: 'navigate-main',
          detail: { tab: 'risk' }
        },
      });
    }

    // ── PATTERN MATCH ACTIVATED ─────────────────────────────
    if ((rriState?.pattern_similarity ?? 0) > 0.65 &&
        (prevPattern.current ?? 0) <= 0.65) {
      addNotification({
        type: 'RRI',
        priority: 'HIGH',
        title: 'Historical Pattern Match Activated',
        message: `HPS = ${((rriState?.pattern_similarity ?? 0) * 100).toFixed(0)}% — ${rriState?.pattern_label ?? 'Scanning...'}. Current variable vector matches a known pre-crisis state.`,
        action: {
          label: 'View Methodology',
          event: 'open-methodology',
          detail: { equation: '20' }
        },
      });
    }

    // ── FX RESERVES WARNING ─────────────────────────────────
    if (data.economy.fx_reserves < 90 && prevFX.current >= 90) {
      addNotification({
        type: 'ALERT',
        priority: 'HIGH',
        title: 'FX Reserves Below Warning Threshold',
        message: `BCT foreign exchange reserves fell to ${data.economy.fx_reserves} days import cover. Warning threshold: 90 days. Crisis threshold: 60 days.`,
        action: {
          label: 'View Economy',
          event: 'navigate-to-pipeline',
          detail: { tab: 'economy', subTab: 'macro' }
        },
        rriVariable: 'A_FX',
      });
    }

    if (data.economy.fx_reserves < 60 && prevFX.current >= 60) {
      addNotification({
        type: 'ALERT',
        priority: 'CRITICAL',
        title: '🚨 FX Reserves Crisis Threshold Breached',
        message: `Reserves at ${data.economy.fx_reserves} days — BELOW CRISIS THRESHOLD of 60 days. Import disruptions, medicine shortages risk imminent.`,
        action: {
          label: 'View Economy',
          event: 'navigate-to-pipeline',
          detail: { tab: 'economy', subTab: 'macro' }
        },
        rriVariable: 'A_FX',
      });
    }

    // ── UGTT ESCALATION ─────────────────────────────────────
    if (data.social.ugtt_mobilisation_level === 'HIGH' &&
        prevUGTT.current !== 'HIGH') {
      addNotification({
        type: 'ALERT',
        priority: 'CRITICAL',
        title: 'UGTT Mobilisation at HIGH — Strike Imminent',
        message: `UGTT has reached HIGH mobilisation level. General strike probability: 64%. 72-hour strike notice may be filed.`,
        action: {
          label: 'View UGTT Monitor',
          event: 'navigate-to-pipeline',
          detail: { tab: 'political', subTab: 'ugtt' }
        },
        rriVariable: 'M_UGTT',
      });
    }

    // ── PROTEST SURGE ───────────────────────────────────────
    if (data.social.protest_events_30d > 30 &&
        prevProtests.current <= 30) {
      addNotification({
        type: 'ALERT',
        priority: 'HIGH',
        title: 'Protest Frequency Surge',
        message: `Protest events reached ${data.social.protest_events_30d}/month — above 30-event alert threshold. Check governorate breakdown.`,
        action: {
          label: 'View Social',
          event: 'navigate-to-pipeline',
          detail: { tab: 'social' }
        },
        rriVariable: 'E51',
      });
    }

    // ── NEW DECREE 54 CHARGE ────────────────────────────────
    if (data.social.decree54_charged > prevD54.current) {
      const newCharges = data.social.decree54_charged - prevD54.current;
      addNotification({
        type: 'ALERT',
        priority: 'HIGH',
        title: `Decree 54: ${newCharges} New Charge${newCharges > 1 ? 's' : ''}`,
        message: `Total Decree 54 charged now ${data.social.decree54_charged}. Press freedom and opposition suppression index updated.`,
        action: {
          label: 'View Freedom Index',
          event: 'navigate-to-pipeline',
          detail: { tab: 'political', subTab: 'decree54' }
        },
        rriVariable: 'D44',
      });
    }

    // ── PIPELINE SIGNAL ───────────────────────────────────────
    if (auditLog.length > prevAuditLen.current) {
      const newEntries = auditLog.slice(0, auditLog.length - prevAuditLen.current);
      const pushEntries = newEntries.filter(
        e => e.type === 'PUSH' || e.type === 'APPROVED' || e.type === 'EXTRACTED'
      );
      
      if (pushEntries.length > 0) {
        // Find the most significant change
        const mainEntry = pushEntries[0];
        const isShock = pushEntries.length > 5 || 
                      (mainEntry.type === 'PUSH' && Math.abs(mainEntry.value - mainEntry.oldValue) > 20);

        addNotification({
          type: 'PIPELINE',
          priority: isShock ? 'HIGH' : 'MEDIUM',
          title: isShock ? '⚡ SYSTEM SHOCK DETECTED' : '📡 SIGNAL INGESTED',
          message: isShock 
            ? `Multiple concurrent variables shifted. System volatility increasing. New R(t): ${(rriState?.rri ?? 0).toFixed(4)}.`
            : `Pipeline update: ${mainEntry.label} → ${mainEntry.value}. Recalculating systemic risk vectors.`,
          action: {
            label: 'Open Debugger',
            event: 'navigate-to-pipeline',
            detail: { tab: 'pipeline' }
          },
        });
      }
    }

    // ── URGENT NEWS MONITOR ────────────────────────────────
    const handleNewArticle = (e: any) => {
      const article = e.detail;
      const urgentKeywords = [
        'accident', 'protest', 'strike', 'water cut', 'electricity', 
        'blackout', 'road block', 'clash', 'arrest', 'fire', 'explosion',
        'emergency', 'crisis', 'shortage'
      ];
      
      const title = article.title.toLowerCase();
      const summary = (article.summary || '').toLowerCase();
      
      const isUrgent = urgentKeywords.some(kw => 
        title.includes(kw) || summary.includes(kw)
      ) || article.severity >= 4;

      if (isUrgent) {
        addNotification({
          type: 'RSS',
          priority: article.severity >= 5 ? 'CRITICAL' : 'HIGH',
          title: `🚨 URGENT: ${article.title}`,
          message: `${article.source_name}: ${article.summary?.slice(0, 100)}...`,
          action: {
            label: 'View Article',
            event: 'navigate-main',
            detail: { tab: 'newsfeed', articleId: article.id }
          },
        });
      }
    };

    window.addEventListener('ti:rss:article', handleNewArticle);

    // Update refs
    prevRRI.current = rriState.rri;
    prevVelocity.current = rriState.velocity;
    prevFX.current = data.economy.fx_reserves;
    prevUGTT.current = data.social.ugtt_mobilisation_level;
    prevProtests.current = data.social.protest_events_30d;
    prevD54.current = data.social.decree54_charged;
    prevPattern.current = rriState.pattern_similarity;
    prevAuditLen.current = auditLog.length;

    return () => {
      window.removeEventListener('ti:rss:article', handleNewArticle);
    };

  }, [
    rriState.rri,
    rriState.velocity,
    rriState.pattern_similarity,
    data.economy.fx_reserves,
    data.social.ugtt_mobilisation_level,
    data.social.protest_events_30d,
    data.social.decree54_charged,
    auditLog.length,
    addNotification
  ]);
};

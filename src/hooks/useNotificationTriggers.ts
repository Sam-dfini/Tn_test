import { useEffect, useRef } from 'react';
import { usePipeline } from '../context/PipelineContext';
import { useNotifications } from '../context/NotificationContext';

export const useNotificationTriggers = () => {
  const { data, rriState, auditLog } = usePipeline();
  const { addNotification } = useNotifications();

  // Track previous values to detect changes
  const prevRRI = useRef(rriState.rri);
  const prevVelocity = useRef(rriState.velocity);
  const prevFX = useRef(data.economy.fx_reserves);
  const prevUGTT = useRef(data.social.ugtt_mobilisation_level);
  const prevProtests = useRef(data.social.protest_events_30d);
  const prevD54 = useRef(data.social.decree54_charged);
  const prevPattern = useRef(rriState.pattern_similarity);
  const prevAuditLen = useRef(auditLog.length);
  const initialized = useRef(false);

  // One-time: seed notifications reflecting current state
  useEffect(() => {
    const hasSeeded = localStorage.getItem('ti_notifications_seeded');
    if (hasSeeded) return;

    setTimeout(() => {
      // Current state summary
      if (rriState.rri >= 2.0) {
        addNotification({
          type: 'RRI',
          priority: rriState.rri >= 2.625 ? 'CRITICAL' : 'HIGH',
          title: `Current R(t) = ${rriState.rri.toFixed(4)}`,
          message: `Platform initialized. P_rev = ${(rriState.p_rev * 100).toFixed(1)}%. ${rriState.threshold_breaches?.length || 0} threshold breaches active.`,
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

      if (rriState.pattern_similarity > 0.5) {
        addNotification({
          type: 'RRI',
          priority: 'HIGH',
          title: 'Historical Pattern Match Active',
          message: `HPS = ${(rriState.pattern_similarity * 100).toFixed(0)}% — ${rriState.pattern_label}`,
          action: { label: 'View Methodology', event: 'open-methodology', detail: { equation: '20' } },
        });
      }

      localStorage.setItem('ti_notifications_seeded', 'true');
    }, 1000); // wait 1s for RRI to calculate

  }, []); // run once on mount

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
    if (rriState.rri >= 2.625 && prevRRI.current < 2.625) {
      addNotification({
        type: 'RRI',
        priority: 'CRITICAL',
        title: '⚠ Revolution Threshold Breached',
        message: `R(t) = ${rriState.rri.toFixed(4)} has crossed the 50% revolution probability threshold. P_rev = ${(rriState.p_rev * 100).toFixed(1)}%.`,
        action: {
          label: 'View Risk Model',
          event: 'navigate-main',
          detail: { tab: 'risk' }
        },
        rriDelta: rriState.rri - prevRRI.current,
      });
    }

    // ── RRI SIGNIFICANT JUMP (>0.10 in one recalc) ──────────
    const rriJump = rriState.rri - prevRRI.current;
    if (Math.abs(rriJump) > 0.10) {
      addNotification({
        type: 'RRI',
        priority: rriJump > 0 ? 'HIGH' : 'MEDIUM',
        title: rriJump > 0
          ? `R(t) Jumped +${rriJump.toFixed(3)}`
          : `R(t) Improved ${rriJump.toFixed(3)}`,
        message: `Revolutionary Risk Index moved from ${prevRRI.current.toFixed(4)} to ${rriState.rri.toFixed(4)}. P_rev = ${(rriState.p_rev * 100).toFixed(1)}%.`,
        action: {
          label: 'View Risk Model',
          event: 'navigate-main',
          detail: { tab: 'risk' }
        },
        rriDelta: rriJump,
      });
    }

    // ── VELOCITY ACCELERATION ───────────────────────────────
    if (rriState.velocity > 0.20 && prevVelocity.current <= 0.20) {
      addNotification({
        type: 'RRI',
        priority: 'HIGH',
        title: 'Rapid Deterioration — V(t) Accelerating',
        message: `Velocity index reached +${rriState.velocity.toFixed(3)} (${rriState.velocity_label}). Multiple variables deteriorating simultaneously.`,
        action: {
          label: 'View Velocity',
          event: 'navigate-main',
          detail: { tab: 'risk' }
        },
      });
    }

    // ── PATTERN MATCH ACTIVATED ─────────────────────────────
    if (rriState.pattern_similarity > 0.65 &&
        prevPattern.current <= 0.65) {
      addNotification({
        type: 'RRI',
        priority: 'HIGH',
        title: 'Historical Pattern Match Activated',
        message: `HPS = ${(rriState.pattern_similarity * 100).toFixed(0)}% — ${rriState.pattern_label}. Current variable vector matches a known pre-crisis state.`,
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

    // ── PIPELINE PUSH ───────────────────────────────────────
    if (auditLog.length > prevAuditLen.current) {
      const newEntries = auditLog.slice(
        0, auditLog.length - prevAuditLen.current
      );
      const pushEntries = newEntries.filter(
        e => e.type === 'PUSH' || e.type === 'APPROVED'
      );
      if (pushEntries.length > 0) {
        addNotification({
          type: 'PIPELINE',
          priority: 'LOW',
          title: 'Pipeline Push Complete',
          message: `${pushEntries.length} field${pushEntries.length > 1 ? 's' : ''} updated. R(t) recalculated: ${rriState.rri.toFixed(4)}.`,
          action: {
            label: 'View Pipeline',
            event: 'navigate-to-pipeline',
            detail: { tab: 'pipeline' }
          },
        });
      }
    }

    // Update refs
    prevRRI.current = rriState.rri;
    prevVelocity.current = rriState.velocity;
    prevFX.current = data.economy.fx_reserves;
    prevUGTT.current = data.social.ugtt_mobilisation_level;
    prevProtests.current = data.social.protest_events_30d;
    prevD54.current = data.social.decree54_charged;
    prevPattern.current = rriState.pattern_similarity;
    prevAuditLen.current = auditLog.length;

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

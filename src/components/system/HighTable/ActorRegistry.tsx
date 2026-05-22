import React from 'react';

const POSTURE_COLORS: Record<string, string> = {
  passive: '#4A5568',
  defensive: '#D97706',
  aggressive: '#DC2626',
  negotiating: '#2563EB',
  collapsing: '#7C3AED',
};

const ACTOR_ORDER = [
  'PRES', 'UGTT', 'ARM', 'BCT', 'INT', 'DONOR',
  'PPL', 'LPR', 'DZA', 'EU', 'UTICA',
];

const ACTOR_NAMES: Record<string, string> = {
  PRES: 'Presidency',
  UGTT: 'Labor Union',
  ARM: 'Military',
  BCT: 'Central Bank',
  INT: 'Internal Security',
  DONOR: 'Donor Community',
  PPL: 'Opposition',
  LPR: 'Legislature',
  DZA: 'Algeria',
  EU: 'European Union',
  UTICA: 'Business Assoc.',
};

interface Posture {
  actor_id: string;
  posture?: string;
  stress_level?: number;
}

interface Session {
  dominant_coalition?: string[];
  dissenting_actors?: string[];
  veto_actor?: string;
  resolution_type?: string;
  confidence?: number;
}

interface Props {
  snapshot?: {
    actor_postures?: Posture[];
    rri?: number;
    p_revolution?: number;
  };
  session?: Session;
  onActorSelect: (id: string) => void;
}

export const ActorRegistry: React.FC<Props> = ({
  snapshot, session, onActorSelect,
}) => {
  const postures = snapshot?.actor_postures ?? [];

  return (
    <div className="actor-registry">
      <div className="registry-header">
        <span>HIGH TABLE</span>
        <span className="registry-count">{postures.length} ACTORS</span>
      </div>

      {ACTOR_ORDER.map(entityId => {
        const posture = postures.find(p => p.actor_id === entityId);
        const inCoalition = session?.dominant_coalition?.includes(entityId);
        const isDissenting = session?.dissenting_actors?.includes(entityId);
        const isVetoing = session?.veto_actor === entityId;
        const postureLabel = posture?.posture ?? 'passive';

        return (
          <div
            key={entityId}
            className={`registry-row${
              inCoalition ? ' coalition' : ''
            }${isDissenting ? ' dissenting' : ''}${
              isVetoing ? ' vetoing' : ''
            }`}
            onClick={() => onActorSelect(entityId)}
          >
            <div
              className="posture-dot"
              style={{ background: POSTURE_COLORS[postureLabel] || '#4A5568' }}
            />
            <span className="entity-id">{entityId}</span>
            <span className="actor-name">{ACTOR_NAMES[entityId]}</span>
            <span className="posture-badge">
              {isVetoing ? 'VETO' : postureLabel.toUpperCase()}
            </span>
            <div className="stress-bar">
              <div
                className="stress-fill"
                style={{
                  width: `${(posture?.stress_level ?? 0) * 100}%`,
                  background: POSTURE_COLORS[postureLabel] || '#4A5568',
                }}
              />
            </div>
          </div>
        );
      })}

      {session && (
        <div className="deliberation-summary">
          <div className="summary-header">LAST DELIBERATION</div>
          <div className="resolution-type">
            {(session.resolution_type ?? 'PENDING').toUpperCase()}
          </div>
          <div className="confidence-score">
            CONFIDENCE {((session.confidence ?? 0) * 100).toFixed(0)}%
          </div>
          {session.veto_actor && (
            <div className="veto-alert">
              VETO: {session.veto_actor}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

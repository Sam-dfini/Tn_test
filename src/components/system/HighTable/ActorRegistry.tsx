import React from 'react';

const POSTURE_COLORS: Record<string, string> = {
  passive:     '#4A5568',
  defensive:   '#D97706',
  aggressive:  '#DC2626',
  negotiating: '#2563EB',
  collapsing:  '#7C3AED',
};

const ACTOR_NAMES: Record<string, string> = {
  PRES:  'Presidency',
  ARM:   'Military',
  INT:   'Internal Security',
  BCT:   'Central Bank',
  UTICA: 'Business Assoc.',
  DONOR: 'Donor Community',
  UGTT:  'Labor Union',
  LPR:   'Legislature',
  LTDH:  'Human Rights',
  PPL:   'Opposition',
  EU:    'European Union',
  DZA:   'Algeria',
  KSA:   'Saudi Arabia',
  USA:   'United States',
};

// Ring-grouped actor layout matching concentric architecture
const RING_GROUPS = [
  {
    key: 'core',
    label: 'CARTHAGE ECHELON',
    color: '#7C3AED',
    actors: ['PRES'],
  },
  {
    key: 'ring1',
    label: 'SECURITY COUNCIL',
    color: '#DC2626',
    actors: ['ARM', 'INT'],
  },
  {
    key: 'ring2',
    label: 'ECONOMIC COUNCIL',
    color: '#2563EB',
    actors: ['BCT', 'UTICA', 'DONOR'],
  },
  {
    key: 'ring3',
    label: 'CIVIL-POLITICAL',
    color: '#D97706',
    actors: ['UGTT', 'LPR', 'LTDH', 'PPL'],
  },
  {
    key: 'ring4',
    label: 'EXTERNAL POWERS',
    color: '#4B5563',
    actors: ['EU', 'DZA', 'KSA', 'USA'],
  },
] as const;

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
  snapshot?: { actor_postures?: Posture[]; rri?: number; p_revolution?: number; };
  session?: Session;
  selectedActor?: string | null;
  onActorSelect: (id: string) => void;
}

export const ActorRegistry: React.FC<Props> = ({
  snapshot, session, selectedActor, onActorSelect,
}) => {
  const postures = snapshot?.actor_postures ?? [];
  const totalActors = RING_GROUPS.flatMap(g => g.actors).length;

  return (
    <div className="actor-registry">
      <div className="registry-header">
        <span>HIGH TABLE</span>
        <span className="registry-count">{totalActors} ACTORS</span>
      </div>

      {RING_GROUPS.map(group => (
        <div key={group.key} className="ring-group">
          <div
            className="ring-group-header"
            style={{ borderLeftColor: group.color, color: group.color }}
          >
            {group.label}
          </div>

          {group.actors.map(entityId => {
            const posture = postures.find(p => p.actor_id === entityId);
            const inCoalition = session?.dominant_coalition?.includes(entityId);
            const isDissenting = session?.dissenting_actors?.includes(entityId);
            const isVetoing = session?.veto_actor === entityId;
            const postureLabel = posture?.posture ?? 'passive';
            const stress = posture?.stress_level ?? 0;

            return (
              <div
                key={entityId}
                className={[
                  'registry-row',
                  inCoalition  ? 'coalition'  : '',
                  isDissenting ? 'dissenting' : '',
                  isVetoing    ? 'vetoing'    : '',
                  selectedActor === entityId ? 'selected' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => onActorSelect(entityId)}
              >
                <div
                  className="posture-dot"
                  style={{ background: POSTURE_COLORS[postureLabel] ?? '#4A5568' }}
                />
                <span className="entity-id" style={{ color: group.color, opacity: 0.9 }}>
                  {entityId}
                </span>
                <span className="actor-name">{ACTOR_NAMES[entityId] ?? entityId}</span>
                <span
                  className="posture-badge"
                  style={{ borderColor: isVetoing ? '#DC2626' : 'transparent',
                           color: isVetoing ? '#DC2626' : undefined }}
                >
                  {isVetoing ? 'VETO' : postureLabel.slice(0, 4).toUpperCase()}
                </span>
                <div className="stress-bar">
                  <div
                    className="stress-fill"
                    style={{
                      width: `${stress * 100}%`,
                      background: stress > 0.7
                        ? '#DC2626'
                        : stress > 0.45
                          ? '#D97706'
                          : POSTURE_COLORS[postureLabel] ?? '#4A5568',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {session?.resolution_type && (
        <div className="deliberation-summary">
          <div className="summary-header">LAST DELIBERATION</div>
          <div className="resolution-type">
            {session.resolution_type.toUpperCase()}
          </div>
          <div className="confidence-score">
            CONFIDENCE {((session.confidence ?? 0) * 100).toFixed(0)}%
          </div>
          {session.veto_actor && (
            <div className="veto-alert">VETO: {session.veto_actor}</div>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { RRIGaugeBlock } from './blocks/RRIGaugeBlock';
import { GovernorateHeatmapBlock } from './blocks/GovernorateHeatmapBlock';
import { MonteCarloBlock } from './blocks/MonteCarloBlock';
import { ActorTimelineBlock } from './blocks/ActorTimelineBlock';
import { EliteNetworkBlock } from './blocks/EliteNetworkBlock';
import { EconomicStressBlock } from './blocks/EconomicStressBlock';
import { NarrativeWarfareBlock } from './blocks/NarrativeWarfareBlock';
import { ComparativeHistoricalBlock } from './blocks/ComparativeHistoricalBlock';
import { ProtestSIRBlock } from './blocks/ProtestSIRBlock';
import { ConfidenceMeterBlock } from './blocks/ConfidenceMeterBlock';
import { WaterStressBlock } from './blocks/WaterStressBlock';
import { MigrationFlowBlock } from './blocks/MigrationFlowBlock';
import { InterventionRankerBlock } from './blocks/InterventionRankerBlock';

interface BlockInstance {
  block_id: string;
  parameters?: any;
  data_snapshot?: any;
  confidence?: number;
}

interface Props {
  block: BlockInstance;
}

const BLOCK_COMPONENTS: Record<string, React.FC<{ parameters?: any; data?: any; confidence?: number }>> = {
  'rri-gauge': RRIGaugeBlock,
  'governorate-heatmap': GovernorateHeatmapBlock,
  'monte-carlo-futures': MonteCarloBlock,
  'actor-timeline': ActorTimelineBlock,
  'elite-network': EliteNetworkBlock,
  'economic-stress': EconomicStressBlock,
  'narrative-warfare': NarrativeWarfareBlock,
  'comparative-historical': ComparativeHistoricalBlock,
  'protest-sir': ProtestSIRBlock,
  'confidence-meter': ConfidenceMeterBlock,
  'water-stress': WaterStressBlock,
  'migration-flow': MigrationFlowBlock,
  'intervention-ranker': InterventionRankerBlock,
};

export const BlockRenderer: React.FC<Props> = ({ block }) => {
  const Component = BLOCK_COMPONENTS[block.block_id];

  return (
    <div className="block-wrapper">
      <div className="block-header">
        <span className="block-id">{block.block_id}</span>
        <span className="block-confidence">
          <span className="bar"><span className="bar-fill" style={{ width: `${(block.confidence ?? 0) * 100}%`, background: (block.confidence ?? 0) > 0.65 ? '#10b981' : (block.confidence ?? 0) > 0.4 ? '#f59e0b' : '#ef4444' }} /></span>
          <span className="val">{((block.confidence ?? 0) * 100).toFixed(0)}%</span>
        </span>
      </div>
      {Component ? (
        <Component
          parameters={block.parameters}
          data={block.data_snapshot}
          confidence={block.confidence}
        />
      ) : (
        <div style={{ padding: 12, fontSize: 9, color: '#6B7280' }}>
          Unknown block: {block.block_id}
        </div>
      )}
    </div>
  );
};

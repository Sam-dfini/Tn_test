import React, { useState } from 'react';
import { Wheat, Droplets, Zap, Package, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NationalAgriculturalPulse } from '../modes/NationalAgriculturalPulse';
import { FeedIntelligenceHub } from './FeedIntelligenceHub';
import { PoultryEggsIntelligence } from './PoultryEggsIntelligence';
import { LivestockMeatIntelligence } from './LivestockMeatIntelligence';
import { MilkDairyIntelligence } from './MilkDairyIntelligence';

export const FoodSupplyChains: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pulse' | 'feed' | 'poultry' | 'livestock' | 'dairy'>('pulse');

  const tabs = [
    { id: 'pulse', label: 'Agricultural Pulse', icon: Leaf },
    { id: 'feed', label: 'Feed Intelligence', icon: Wheat },
    { id: 'poultry', label: 'Poultry & Eggs', icon: Zap },
    { id: 'livestock', label: 'Livestock & Meat', icon: Package },
    { id: 'dairy', label: 'Milk & Dairy', icon: Droplets },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Sub-navigation Header */}
      <div className="flex items-center space-x-1 mb-6 bg-surface-container border border-outline-variant rounded-xl p-1 w-fit max-w-full overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'pulse' && <NationalAgriculturalPulse />}
          {activeTab === 'feed' && <FeedIntelligenceHub />}
          {activeTab === 'poultry' && <PoultryEggsIntelligence />}
          {activeTab === 'livestock' && <LivestockMeatIntelligence />}
          {activeTab === 'dairy' && <MilkDairyIntelligence />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

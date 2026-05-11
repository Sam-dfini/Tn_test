import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, SearchX, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  onRetry?: () => void;
  actionLabel?: string;
  className?: string;
  variant?: 'default' | 'error' | 'search';
}

const VARIANT_MAP = {
  default: {
    icon: SearchX,
    color: 'text-slate-500',
    bg: 'bg-white/[0.03]',
    border: 'border-white/[0.08]'
  },
  error: {
    icon: AlertCircle,
    color: 'text-intel-red',
    bg: 'bg-intel-red/5',
    border: 'border-intel-red/20'
  },
  search: {
    icon: SearchX,
    color: 'text-intel-cyan',
    bg: 'bg-intel-cyan/5',
    border: 'border-intel-cyan/20'
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  onRetry, 
  actionLabel = 'Retry Connection',
  className,
  variant = 'default'
}) => {
  const v = VARIANT_MAP[variant];
  const IconComponent = icon || <v.icon className={cn("w-8 h-8", v.color)} />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 space-y-5 text-center",
        className
      )}
    >
      <div className="relative">
        {/* Animated decorative rings */}
        <div className="absolute inset-0 -m-4 rounded-full border border-white/5 animate-pulse" />
        <div className="absolute inset-0 -m-8 rounded-full border border-white/[0.02]" />
        
        <div className={cn(
          "w-16 h-16 rounded-2xl border flex items-center justify-center relative z-10",
          v.bg, v.border
        )}>
          {IconComponent}
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h3>
        {description && (
          <p className="text-xs text-slate-500 leading-relaxed font-mono">
            {description}
          </p>
        )}
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-[10px] font-mono font-bold text-intel-cyan border border-intel-cyan/30 px-4 py-2 rounded-lg hover:bg-intel-cyan/10 hover:border-intel-cyan transition-all group"
        >
          <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
          [ {actionLabel.toUpperCase()} ]
        </button>
      )}
    </motion.div>
  );
};

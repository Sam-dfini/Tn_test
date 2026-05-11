import React from "react";
import { motion } from "motion/react";
import { cn } from "../../utils/cn";

const Tabs = ({ children, defaultValue, value: controlledValue, onValueChange, className, ...props }: any) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const value = controlledValue ?? internalValue;
  const setValue = (v: string) => {
    setInternalValue(v);
    onValueChange?.(v);
  };
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { value, setValue });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, value, setValue, className, ...props }: any) => {
  return (
    <div
      role="tablist"
      className={cn(
        "relative inline-flex items-center gap-0.5 rounded-lg bg-white/[0.04] p-1 border border-white/[0.08]",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { activeValue: value, setValue });
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger = ({ children, value, activeValue, setValue, className, disabled, ...props }: any) => {
  const isActive = activeValue === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && setValue(value)}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5",
        "text-xs font-mono font-bold uppercase tracking-wide transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-intel-cyan/50",
        "disabled:pointer-events-none disabled:opacity-40",
        isActive ? "text-intel-cyan" : "text-slate-500 hover:text-white",
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.span
          layoutId="tab-active-bg"
          className="absolute inset-0 rounded-md bg-intel-cyan/10 border border-intel-cyan/20"
          transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

const TabsContent = ({ children, value, activeValue, className, ...props }: any) => {
  if (value !== activeValue) return null;
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role="tabpanel"
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };

/**
 * TunisiaIntel Boot Sequence Tracker
 * Captures ALL terminal output to log file
 */

import fs from 'fs';

export interface BootEvent {
  timestamp: number;
  phase: string;
  step: string;
  duration: number;
  metadata?: Record<string, any>;
}

export const BOOT_PHASES = {
  APP_INIT: 'APP_INIT',
  AUTH: 'AUTH',
  DATA_LOADING: 'DATA_LOADING',
  UI_RENDER: 'UI_RENDER',
  PIPELINE: 'PIPELINE',
  REALTIME_SYNC: 'REALTIME_SYNC',
  LAZY_LOAD: 'LAZY_LOAD',
  BACKEND: 'BACKEND',
  COMPLETE: 'COMPLETE',
} as const;

const bootLog: BootEvent[] = [];
const bootStartTime = Date.now();

// Check if we're in Node.js environment
const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node;

// Log file path - only used in Node.js
const LOG_FILE = isNode ? (process.cwd() + '/boot_sequence.log') : '';

// File stream for continuous writing
let fileStream: fs.WriteStream | null = null;

function initLogFile(): void {
  if (!isNode) return;
  try {
    // Clear existing file and write header
    const header = `${'='.repeat(80)}
TUNISIAINTEL BOOT SEQUENCE LOG
Started: ${new Date().toISOString()}
${'='.repeat(80)}\n\n`;
    fs.writeFileSync(LOG_FILE, header);
    fileStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
  } catch (e) {
    console.error('Failed to init boot log file:', e);
  }
}

function writeToFile(message: string): void {
  if (!isNode) return;
  try {
    if (fileStream) {
      fileStream.write(message + '\n');
    } else {
      fs.appendFileSync(LOG_FILE, message + '\n');
    }
  } catch (e) {
    // Silently fail
  }
}

// Capture ALL console output
if (isNode) {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.log = (...args) => {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    writeToFile(msg);
    originalLog.apply(console, args);
  };

  console.error = (...args) => {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    writeToFile('[ERROR] ' + msg);
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    writeToFile('[WARN] ' + msg);
    originalWarn.apply(console, args);
  };

  console.info = (...args) => {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    writeToFile(msg);
    originalInfo.apply(console, args);
  };

  // Initialize log file on module load
  initLogFile();
}

function logSection(title: string): void {
  const msg = `\n${'-'.repeat(60)}\n>>> ${title}\n${'-'.repeat(60)}`;
  console.log(msg);
}

export function logBootEvent(
  phase: string,
  step: string,
  startTime: number,
  metadata?: Record<string, any>
): void {
  const event: BootEvent = {
    timestamp: Date.now(),
    phase,
    step,
    duration: Date.now() - startTime,
    metadata,
  };
  bootLog.push(event);
  
  const msg = `[${new Date().toISOString()}] [${phase.padEnd(15)}] ${step} (+${event.duration}ms)${metadata ? ` | ${JSON.stringify(metadata)}` : ''}`;
  console.log(msg);
}

export function logBootStep(
  phase: string,
  step: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  const event: BootEvent = {
    timestamp: Date.now(),
    phase,
    step,
    duration,
    metadata,
  };
  bootLog.push(event);
  
  const msg = `[${new Date().toISOString()}] [${phase.padEnd(15)}] ${step} (${duration}ms)${metadata ? ` | ${JSON.stringify(metadata)}` : ''}`;
  console.log(msg);
}

export function getBootLog(): BootEvent[] {
  return [...bootLog];
}

export function getBootByPhase(): Record<string, BootEvent[]> {
  return bootLog.reduce((acc, event) => {
    if (!acc[event.phase]) {
      acc[event.phase] = [];
    }
    acc[event.phase].push(event);
    return acc;
  }, {} as Record<string, BootEvent[]>);
}

export function getBootSummary(): {
  totalDuration: number;
  phases: Record<string, { count: number; totalDuration: number; events: string[] }>;
  slowestSteps: BootEvent[];
  isComplete: boolean;
} {
  const phases: Record<string, { count: number; totalDuration: number; events: string[] }> = {};

  bootLog.forEach(event => {
    if (!phases[event.phase]) {
      phases[event.phase] = { count: 0, totalDuration: 0, events: [] };
    }
    phases[event.phase].count++;
    phases[event.phase].totalDuration += event.duration;
    phases[event.phase].events.push(event.step);
  });

  const slowestSteps = [...bootLog]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  return {
    totalDuration: Date.now() - bootStartTime,
    phases,
    slowestSteps,
    isComplete: bootLog.some(e => e.phase === BOOT_PHASES.COMPLETE),
  };
}

export function printBootSummary(): void {
  const summary = getBootSummary();
  
  const lines = [
    '',
    '╔══════════════════════════════════════════════════════════════╗',
    '║           TUNISIAINTEL BOOT SEQUENCE SUMMARY                  ║',
    '╠══════════════════════════════════════════════════════════════╣',
    `║ Total Boot Time: ${summary.totalDuration}ms`,
    '╠══════════════════════════════════════════════════════════════╣',
  ];
  
  Object.entries(summary.phases).forEach(([phase, data]) => {
    lines.push(`║ ${phase.padEnd(15)} │ ${data.count} steps │ ${data.totalDuration.toString().padStart(6)}ms`);
  });
  
  lines.push('╠══════════════════════════════════════════════════════════════╣');
  lines.push('║ TOP 10 SLOWEST STEPS:');
  summary.slowestSteps.forEach((step, i) => {
    lines.push(`║   ${(i + 1).toString().padStart(2)}. ${step.step.padEnd(30)} (${step.duration.toString().padStart(5)}ms) [${step.phase}]`);
  });
  
  lines.push('╠══════════════════════════════════════════════════════════════╣');
  lines.push(`║ Status: ${summary.isComplete ? '✓ COMPLETE' : '○ IN PROGRESS'}`);
  lines.push('╚══════════════════════════════════════════════════════════════╝');
  lines.push('');
  
  const output = lines.join('\n');
  console.log(output);
}

export function finalizeBootLog(): void {
  printBootSummary();
  
  if (fileStream) {
    fileStream.end();
  }
}

export function resetBootLog(): void {
  bootLog.length = 0;
  initLogFile();
}

export const BootMarkers = {
  APP_MOUNT: () => logBootEvent(BOOT_PHASES.APP_INIT, 'App Mounted', bootStartTime),
  
  BACKEND_START: () => logBootEvent(BOOT_PHASES.BACKEND, 'Backend Starting', Date.now()),
  BACKEND_EXPRESS_INIT: () => logBootEvent(BOOT_PHASES.BACKEND, 'Express Server Init', Date.now()),
  BACKEND_ROUTES_REGISTER: () => logBootEvent(BOOT_PHASES.BACKEND, 'Routes Registered', Date.now()),
  BACKEND_WEBSOCKET_INIT: () => logBootEvent(BOOT_PHASES.BACKEND, 'WebSocket Init', Date.now()),
  BACKEND_SOCKETIO_INIT: () => logBootEvent(BOOT_PHASES.BACKEND, 'Socket.IO Init', Date.now()),
  BACKEND_PYTHON_BACKEND_START: () => logBootEvent(BOOT_PHASES.BACKEND, 'Python Backend Spawning', Date.now()),
  BACKEND_READY: () => logBootEvent(BOOT_PHASES.BACKEND, 'Backend Ready', Date.now()),
  
  VITE_START: () => logBootEvent(BOOT_PHASES.APP_INIT, 'Vite Dev Server Starting', Date.now()),
  VITE_READY: () => logBootEvent(BOOT_PHASES.APP_INIT, 'Vite Dev Server Ready', Date.now()),
  
  AUTH_CHECK: () => logBootEvent(BOOT_PHASES.AUTH, 'Auth Check Started', Date.now()),
  AUTH_COMPLETE: () => logBootEvent(BOOT_PHASES.AUTH, 'Auth Complete', Date.now()),
  DATA_FETCH_START: () => logBootEvent(BOOT_PHASES.DATA_LOADING, 'Data Fetch Started', Date.now()),
  PIPELINE_LOAD: () => logBootEvent(BOOT_PHASES.PIPELINE, 'Pipeline Data Load Started', Date.now()),
  PIPELINE_COMPLETE: () => logBootEvent(BOOT_PHASES.PIPELINE, 'Pipeline Ready', Date.now()),
  UI_RENDER_START: () => logBootEvent(BOOT_PHASES.UI_RENDER, 'UI Render Started', Date.now()),
  FIRST_PAINT: () => logBootEvent(BOOT_PHASES.UI_RENDER, 'First Contentful Paint', Date.now()),
  REALTIME_CONNECT: () => logBootEvent(BOOT_PHASES.REALTIME_SYNC, 'Realtime Channel Connected', Date.now()),
  LAZY_LOAD_START: (component: string) => logBootEvent(BOOT_PHASES.LAZY_LOAD, `Loading: ${component}`, Date.now()),
  LAZY_LOAD_COMPLETE: (component: string) => logBootEvent(BOOT_PHASES.LAZY_LOAD, `Loaded: ${component}`, Date.now()),
  BOOT_COMPLETE: () => {
    logBootEvent(BOOT_PHASES.COMPLETE, 'Application Ready', Date.now());
    finalizeBootLog();
  },
};

export { logSection };

export default {
  logBootEvent,
  logBootStep,
  logSection,
  getBootLog,
  getBootByPhase,
  getBootSummary,
  printBootSummary,
  finalizeBootLog,
  resetBootLog,
  BootMarkers,
  BOOT_PHASES,
};
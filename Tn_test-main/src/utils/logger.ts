export type LogStage = "INGESTION" | "DB" | "SIGNAL" | "EVENT" | "UI" | "SATELLITE";
export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface LogEvent {
  stage: LogStage;
  level: LogLevel;
  message: string;
  payload?: any;
  traceId?: string;
  timestamp: string;
}

class PipelineLogger {
  private static instance: PipelineLogger;
  private logs: LogEvent[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance() {
    if (!PipelineLogger.instance) {
      PipelineLogger.instance = new PipelineLogger();
    }
    return PipelineLogger.instance;
  }

  log(event: Omit<LogEvent, 'timestamp'>) {
    const fullEvent: LogEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // Console output for development/server logs
    const color = event.level === "ERROR" ? "\x1b[31m" : event.level === "WARN" ? "\x1b[33m" : "\x1b[32m";
    const reset = "\x1b[0m";
    
    console.log(`${color}[${fullEvent.timestamp}] [${event.stage}] [${event.level}]${reset} ${event.message}`, event.payload || "");

    this.logs.unshift(fullEvent);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Optional: Emit to a listener (like React Context)
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent('pipeline_log', { detail: fullEvent });
      window.dispatchEvent(customEvent);
    }
  }

  getLogs() {
    return this.logs;
  }
}

export const logger = PipelineLogger.getInstance();

export const pipelineErrors: any[] = [];
const MAX_ERRORS = 500;

export function logPipelineError(error: any) {
  console.error("[PIPELINE ERROR]", error);
  const errorObj = {
    message: error.message || String(error),
    stack: error.stack,
    time: Date.now(),
    id: Math.random().toString(36).substr(2, 9)
  };
  pipelineErrors.unshift(errorObj);
  if (pipelineErrors.length > MAX_ERRORS) {
    pipelineErrors.pop();
  }
  
  // also log via the standard logger
  logger.log({
    stage: "INGESTION", 
    level: "ERROR",
    message: `Pipeline Error: ${errorObj.message}`,
    payload: errorObj
  });
}

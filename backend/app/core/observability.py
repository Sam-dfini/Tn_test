import logging
import time
from typing import Dict, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("TunisiaIntel")

class SystemObservability:
    """
    Handles logging, monitoring, and metrics for the platform.
    """
    def __init__(self):
        self.metrics = {
            "api_calls": 0,
            "agent_tasks": 0,
            "anomalies_detected": 0,
            "errors": 0
        }

    def log_event(self, event_type: str, payload: Dict[str, Any], level: str = "INFO"):
        """
        Logs an event with a specific level and payload.
        """
        msg = f"[{event_type}] {payload}"
        if level == "INFO":
            logger.info(msg)
        elif level == "WARNING":
            logger.warning(msg)
        elif level == "ERROR":
            logger.error(msg)
            self.metrics["errors"] += 1
            self._handle_failure(event_type, payload)

    def _handle_failure(self, event_type: str, payload: Dict[str, Any]):
        """
        Detects critical failures and attempts automated recovery.
        """
        # 1. Detect critical failures
        critical_events = ["MISSION_FAILURE", "DATABASE_ERROR", "AGENT_CRASH"]
        if event_type in critical_events:
            logger.critical(f"CRITICAL FAILURE DETECTED: {event_type}")
            
            # 2. Automated Recovery Logic
            if event_type == "MISSION_FAILURE":
                mission_id = payload.get("mission_id")
                logger.info(f"Attempting recovery for mission {mission_id}...")
                # (In a real system, we'd trigger a retry or cleanup)
            
            # 3. Store incident in DB
            # db.table("system_incidents").insert({
            #     "component": "TunisiaIntel",
            #     "incident_type": event_type,
            #     "severity": "CRITICAL",
            #     "payload": payload,
            #     "created_at": datetime.now()
            # }).execute()

    def track_metric(self, metric_name: str, value: int = 1):
        """
        Increments a specific metric.
        """
        if metric_name in self.metrics:
            self.metrics[metric_name] += value

    def get_health_status(self) -> Dict[str, Any]:
        """
        Returns the current health status of the system.
        """
        return {
            "status": "HEALTHY" if self.metrics["errors"] < 10 else "DEGRADED",
            "metrics": self.metrics,
            "timestamp": datetime.now().isoformat()
        }

class PerformanceMonitor:
    """
    Measures and logs the execution time of critical tasks.
    """
    def __init__(self, task_name: str):
        self.task_name = task_name
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        logger.info(f"Task {self.task_name} completed in {duration:.4f} seconds")
        # (In a real system, we'd store this in a metrics DB)
        return False

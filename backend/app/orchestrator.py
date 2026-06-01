import asyncio
import json
from typing import List, Dict, Any, Optional, Callable
from pydantic import BaseModel
from datetime import datetime

from .agents.extractor import ExtractorAgent
from .agents.analyst import AnalystAgent
from .agents.predictor import PredictorAgent
from .agents.resource_scout import ResourceScoutAgent
from .agents.disinformation_analyst import DisinformationAnalystAgent
from .agents.social_movement_tracker import SocialMovementTrackerAgent
from .agents.economic_forecaster import EconomicForecasterAgent
from .agents.security_analyst import SecurityAnalystAgent
from .signals.extraction import EventExtractionEngine
from .signals.scoring import SourceScoringSystem
from .signals.deduplication import DeduplicationEngine
from .signals.quality import SignalQualityLayer
from .signals.social import SocialSignalAggregator
from .services.rri_engine import calculate_rri as py_calculate_rri, _load_variables
from .services.state_snapshot import write_snapshot
from .services.deliberation_engine import deliberation_engine
from .intelligence.engines import FusionEngine, CorrelationEngine, AnomalyDetectionEngine, ScenarioSimulator
from .intelligence.agri import AgroIntelligenceEngine
from .reliability.layers import DataQualityLayer, ValidationLayer, FeedbackSystem, RiskDecompositionEngine, SignalLifecycleManager, ConflictResolver
from .reliability.simulation import AdvancedScenarioSimulator
from .simulator.engine import TunisiaSimulator
from .strategy.engine import DecisionEngine
from .core.database import db
from .core.observability import SystemObservability, PerformanceMonitor
from .api.ws import manager

class MissionState(BaseModel):
    mission_id: str
    status: str # 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
    current_step: str
    start_time: datetime
    end_time: Optional[datetime] = None
    results: Dict[str, Any] = {}
    errors: List[str] = []

class Event(BaseModel):
    type: str # 'NEW_DATA', 'ANOMALY_DETECTED', 'RISK_THRESHOLD_EXCEEDED'
    payload: Dict[str, Any]
    timestamp: datetime = datetime.now()

class MissionOrchestrator:
    """
    The "Brain" of TunisiaIntel.
    Coordinates multiple agents, intelligence engines, and strategy layers.
    """
    def __init__(self):
        # Agents
        self.extractor = ExtractorAgent()
        self.event_extractor = EventExtractionEngine() # New
        self.analyst = AnalystAgent()
        self.predictor = PredictorAgent()
        
        # Specialized Agents
        self.resource_scout = ResourceScoutAgent()
        self.disinformation_analyst = DisinformationAnalystAgent()
        self.movement_tracker = SocialMovementTrackerAgent()
        self.economic_forecaster = EconomicForecasterAgent()
        self.security_analyst = SecurityAnalystAgent()
        
        # Signal Engine
        self.source_scoring = SourceScoringSystem()
        self.deduplicator = DeduplicationEngine()
        self.signal_quality = SignalQualityLayer()
        self.social_aggregator = SocialSignalAggregator()
        
        # Engines
        # RRI computation now goes through py_calculate_rri + write_snapshot
        # (legacy RRIEngine kept for backward compat but not actively used)
        self._rri_engine_legacy = None
        self.fusion_engine = FusionEngine()
        self.correlation_engine = CorrelationEngine()
        self.anomaly_detector = AnomalyDetectionEngine()
        self.agro_engine = AgroIntelligenceEngine()
        self.scenario_simulator = AdvancedScenarioSimulator() # Upgraded
        self.tunisia_simulator = TunisiaSimulator() # New
        self.decision_engine = DecisionEngine()
        
        # Reliability Layers
        self.data_quality = DataQualityLayer()
        self.validator = ValidationLayer()
        self.feedback = FeedbackSystem()
        self.risk_decomposer = RiskDecompositionEngine()
        self.lifecycle_manager = SignalLifecycleManager()
        self.conflict_resolver = ConflictResolver()
        
        # Observability
        self.observability = SystemObservability()
        
        # Event Bus
        self.subscribers: Dict[str, List[Callable]] = {}
        
        # State Tracking
        self.missions: Dict[str, MissionState] = {}

    def subscribe(self, event_type: str, callback: Callable):
        """
        Subscribes a callback to an event type.
        """
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(callback)

    async def emit(self, event: Event):
        """
        Emits an event to all subscribers and broadcasts via WebSockets.
        """
        # Broadcast to WebSockets
        await manager.broadcast({
            "type": event.type,
            "payload": event.payload,
            "timestamp": event.timestamp.isoformat()
        })
        
        if event.type in self.subscribers:
            tasks = [callback(event) for callback in self.subscribers[event.type]]
            await asyncio.gather(*tasks)

    async def run_intelligence_loop(self, news_items: List[Dict[str, Any]], social_mentions: List[Dict[str, Any]] = []):
        """
        The core continuous intelligence loop:
        INGEST → EXTRACT → VALIDATE → DEDUPLICATE → SCORE → ANALYZE → UPDATE RRI → DETECT → ALERT → STORE
        """
        mission_id = f"intel_loop_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        state = MissionState(
            mission_id=mission_id,
            status="RUNNING",
            current_step="INGEST",
            start_time=datetime.now()
        )
        self.missions[mission_id] = state

        try:
            with PerformanceMonitor("IntelligenceLoop"):
                # 1. INGEST
                state.current_step = "INGEST"
                await self.emit(Event(type="MISSION_STEP_UPDATE", payload={"step": state.current_step, "mission_id": mission_id}))
                news_items.sort(key=lambda x: x.get("priority", "MEDIUM"), reverse=True)
                
                # 2. EXTRACT
                state.current_step = "EXTRACT"
                await self.emit(Event(type="MISSION_STEP_UPDATE", payload={"step": state.current_step, "mission_id": mission_id}))
                raw_signals = []
                extracted_events = []
                for item in news_items:
                    source_id = item.get("source_id", "unknown")
                    source_meta = await self.source_scoring.get_source(source_id)
                    reliability = source_meta.reliability_score if source_meta else 0.5
                    
                    signal = await self.event_extractor.extract_signal(item["content"], datetime.now(), source_id, reliability)
                    raw_signals.append(signal)
                    
                    events = await self.event_extractor.extract_event(item["content"], datetime.now(), source_id)
                    extracted_events.extend(events)

                # 3. VALIDATE
                state.current_step = "VALIDATE"
                await self.emit(Event(type="MISSION_STEP_UPDATE", payload={"step": state.current_step, "mission_id": mission_id}))
                valid_signals = self.signal_quality.filter_noise(raw_signals)
                
                # 4. DEDUPLICATE
                state.current_step = "DEDUPLICATE"
                await self.emit(Event(type="MISSION_STEP_UPDATE", payload={"step": state.current_step, "mission_id": mission_id}))
                grouped_signals = {}
                for s in valid_signals:
                    key = f"{s.type}_{s.location}"
                    if key not in grouped_signals: grouped_signals[key] = []
                    grouped_signals[key].append(s)
                
                merged_signals = []
                social_signals = self.social_aggregator.aggregate_social_signals(social_mentions)
                for group in grouped_signals.values():
                    merged = self.deduplicator.merge_signals(group)
                    merged = self.social_aggregator.boost_confidence(merged, social_signals)
                    merged_signals.append(merged)

                # 5. SCORE
                state.current_step = "SCORE"
                await self.emit(Event(type="MISSION_STEP_UPDATE", payload={"step": state.current_step, "mission_id": mission_id}))
                for s in merged_signals:
                    s_dict = self.lifecycle_manager.apply_decay(s.model_dump())
                    s.intensity = s_dict["intensity"]
                    s.metadata["final_weight"] = self.source_scoring.calculate_signal_weight(
                        s.source_reliability_score, s.confidence_score, 0.1, s.intensity
                    )

                # 6. ANALYZE
                state.current_step = "ANALYZE"
                await self.emit(Event(type="MISSION_STEP_UPDATE", payload={"step": state.current_step, "mission_id": mission_id}))
                
                # Run Agro Intelligence in parallel with other modules
                agro_inputs = self._get_latest_agro_metrics() # Helper to get satellite + econ metrics
                
                analysis_tasks = [
                    self.resource_scout.run(merged_signals, context={"news_items": news_items}),
                    self.disinformation_analyst.run(news_items, context={"social_mentions": social_mentions}),
                    self.movement_tracker.run(extracted_events, context={"merged_signals": merged_signals}),
                    self.economic_forecaster.run({}, context={"merged_signals": merged_signals}),
                    self.security_analyst.run({}, context={"merged_signals": merged_signals}),
                    # self.agro_engine.process_all_national(agro_inputs) 
                ]
                specialized_results = await asyncio.gather(*analysis_tasks)
                narrative = await self.analyst.analyze_trends(
                    [s.model_dump() for s in merged_signals], 
                    [], 
                    context={"specialized_insights": specialized_results}
                )

                # 7. UPDATE RRI (full engine)
                state.current_step = "UPDATE RRI"
                await self.emit(Event(type="MISSION_STEP_UPDATE", payload={"step": state.current_step, "mission_id": mission_id}))
                
                # Build pipeline-data overrides from merged signals
                pipeline_overrides: Dict[str, float] = {}
                for s in merged_signals:
                    s_dict = s.model_dump() if hasattr(s, 'model_dump') else s
                    field = s_dict.get("pipeline_field") or s_dict.get("type", "").replace("signal.", "economy.")
                    value = s_dict.get("intensity") or s_dict.get("value") or s_dict.get("confidence", 0.0)
                    if field and value:
                        pipeline_overrides[field] = value
                
                # Compute full RRI state with all 24 equations
                vars = _load_variables()
                rri_result = py_calculate_rri(
                    vars=vars,
                    overrides=pipeline_overrides if pipeline_overrides else None,
                )
                current_rri = rri_result.get("rri", 0.0)
                
                # Write canonical snapshot to state layer
                snapshot = write_snapshot(
                    rri_result=rri_result,
                    articles_processed=len(news_items),
                )
                
                await self.emit(Event(type="RRI_UPDATED", payload={
                    "rri": current_rri,
                    "state_version_id": snapshot.get("state_version_id"),
                    "velocity": rri_result.get("velocity"),
                    "p_rev": rri_result.get("p_rev"),
                }))
                
                # 8. DETECT
                state.current_step = "DETECT"
                await self.emit(Event(type="MISSION_STEP_UPDATE", payload={"step": state.current_step, "mission_id": mission_id}))
                anomalies = []
                for s in merged_signals:
                    anomaly = self.anomaly_detector.detect(s.intensity, [0.5] * 10)
                    if anomaly["is_anomaly"]:
                        anomaly["variable_code"] = s.type
                        anomalies.append(anomaly)
                        await self.emit(Event(type="ANOMALY_DETECTED", payload=anomaly))

                # 9. ALERT
                state.current_step = "ALERT"
                await self.emit(Event(type="MISSION_STEP_UPDATE", payload={"step": state.current_step, "mission_id": mission_id}))
                recommendations = self.decision_engine.analyze(current_rri, anomalies, [])
                if current_rri > 0.6 or anomalies:
                    await self.emit(Event(type="ALERT_TRIGGERED", payload={"rri": current_rri, "anomalies": len(anomalies)}))

                # 10. STORE
                state.current_step = "STORE"
                await self.emit(Event(type="MISSION_STEP_UPDATE", payload={"step": state.current_step, "mission_id": mission_id}))
                await self._persist_mission_data(merged_signals, extracted_events, current_rri, narrative)
                
                state.status = "COMPLETED"
                state.end_time = datetime.now()
                state.results = {
                    "rri": current_rri,
                    "state_version_id": snapshot.get("state_version_id"),
                    "processed": len(news_items),
                    "narrative": narrative,
                }
                await self.emit(Event(type="MISSION_COMPLETED", payload=state.results))
                return state

        except Exception as e:
            state.status = "FAILED"
            state.errors.append(str(e))
            self.observability.log_event("MISSION_FAILURE", {"error": str(e)}, level="ERROR")
            return state

    async def start_continuous_intelligence(self, interval_seconds: int = 300):
        """
        Runs the intelligence loop continuously in the background.
        """
        # from .services.rss_service import rss_service
        self.is_running_continuously = True
        while self.is_running_continuously:
            try:
                # 1. Sync RSS feeds to get latest news
                # await rss_service.fetch_all()
                pass
                
                # 2. Run the internal deep analysis loop (Placeholder for now)
                await self.run_intelligence_loop([], []) 
                
                await asyncio.sleep(interval_seconds)
            except Exception as e:
                self.observability.log_event("CONTINUOUS_LOOP_ERROR", {"error": str(e)}, level="ERROR")
                await asyncio.sleep(10)

    def stop_continuous_intelligence(self):
        """Stops the loop."""
        self.is_running_continuously = False

    async def _persist_mission_data(self, signals: List[Any], events: List[Any], rri: float, narrative: str):
        """
        Persists signals, events, and mission results to Supabase.
        """
        try:
            # 1. Store Signals
            signal_data = [s.model_dump(mode='json') for s in signals]
            if signal_data:
                db.table("signals").insert(signal_data).execute()
            
            # 2. Store Events
            event_data = [e.model_dump(mode='json') for e in events]
            if event_data:
                db.table("events").insert(event_data).execute()
                
            # 3. Store RRI Update
            db.table("rri_history").insert({
                "rri_score": rri,
                "narrative": narrative,
                "timestamp": datetime.now().isoformat()
            }).execute()
            
            self.observability.log_event("STORAGE_SUCCESS", {"signals": len(signals), "events": len(events)})
        except Exception as e:
            self.observability.log_event("STORAGE_FAILURE", {"error": str(e)}, level="ERROR")

    async def _check_human_validations(self, signals: List[Any]):
        """
        Checks for human adjustments to signals and updates them.
        Batch fetches all validations in a single query instead of N+1.
        """
        if not signals:
            return
        signal_ids = [str(s.id) for s in signals]
        try:
            result = db.table("human_validations") \
                .select("*") \
                .in_("target_id", signal_ids) \
                .eq("target_type", "SIGNAL") \
                .order("created_at", desc=True) \
                .execute()
            # Group by target_id, keep latest per signal
            validations_by_id: dict = {}
            for v in (result.data or []):
                tid = v["target_id"]
                if tid not in validations_by_id:
                    validations_by_id[tid] = v
            # Apply to signals
            sig_map = {str(s.id): s for s in signals}
            for tid, v in validations_by_id.items():
                s = sig_map.get(tid)
                if s and v.get("adjusted_confidence") is not None:
                    s.confidence_score = v["adjusted_confidence"]
                    s.metadata["human_validated"] = True
                    s.metadata["analyst_id"] = v.get("analyst_id")
        except Exception as e:
            print(f"[orchestrator] _check_human_validations failed: {e}")

    def _get_latest_agro_metrics(self) -> Dict[str, Any]:
        """
        Retrieves the latest satellite and climate metrics from the DB.
        """
        try:
            # Fetch latest reading for each governorate
            result = db.table("agri_readings") \
                .select("governorate, ndvi, rainfall_anomaly, soil_moisture") \
                .order("fetched_at", desc=True) \
                .execute()
            
            if not result.data:
                return {}

            # We need one reading per governorate, result.data likely has many
            # Let's group by governorate and take the first (latest)
            latest = {}
            for r in result.data:
                gov = r["governorate"]
                if gov not in latest:
                    latest[gov] = {
                        "ndvi": r.get("ndvi", 0.45),
                        "rainfall_anomaly": r.get("rainfall_anomaly", 0),
                        "soil_moisture": r.get("soil_moisture", 0.35),
                        "temperature": 22 # Default fallback as it's not in the schema currently
                    }
            return latest
        except Exception as e:
            print(f"Error fetching agro metrics: {e}")
            return {}

    def _get_schema_for_category(self, category: str) -> List[Dict[str, str]]:
        """
        Returns the extraction schema for a given category.
        """
        # (This would pull from the DB or a config service)
        return [
            {"field": "economy.inflation", "label": "Inflation Rate", "unit": "%"},
            {"field": "social.protest_events_30d", "label": "Protest Events", "unit": "events"}
        ]

    async def on_chain_activated(self, chain_id: str, snapshot: dict):
        """
        When an ontology chain crosses its activation threshold,
        automatically trigger a deliberation session.
        """
        try:
            from .ontology.service import get_chain
            chain = get_chain(chain_id)
            chain_name = chain.get("chain_name", chain_id) if chain else chain_id
            trigger_category = chain.get("trigger_category", "unknown") if chain else "unknown"
            scenario = f"Chain activated: {chain_name} — {trigger_category}"

            task = asyncio.create_task(
                deliberation_engine.run(
                    scenario=scenario,
                    trigger_type="ontology_chain",
                    trigger_source=chain_id,
                    state_version_id=snapshot.get("state_version_id"),
                )
            )
            # Prevent GC before task completes; log on failure
            task.add_done_callback(
                lambda t: print(f"[orchestrator] deliberation task failed: {t.exception()}") if not t.cancelled() and t.exception() else None
            )
        except Exception as e:
            print(f"[orchestrator] on_chain_activated failed: {e}")

# Singleton instance
orchestrator = MissionOrchestrator()

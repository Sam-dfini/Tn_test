import logging
import asyncio
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from ..orchestrator import orchestrator, MissionState
from ..core.database import db
from ..intelligence.state_machine import get_state_machine
from ..services.telegram_service import get_telegram_collector
from ..intelligence.narrative_warfare import get_narrative_engine, FRAMES
from ..intelligence.sci import get_sci_engine
from ..intelligence.emotional_heatmap import get_heatmap_engine
from ..intelligence.calibration import get_calibration_engine
from ..services.variable_pipeline import variable_pipeline
from ..services.rri_engine import calculate_rri, run_full_monte_carlo, compute_current_rri, _load_variables
from ..services.state_snapshot import (
    write_snapshot,
    get_latest_snapshot,
    get_snapshot_by_version,
    set_active_shocks,
    get_active_shocks,
)

logger = logging.getLogger(__name__)

# from ..services.rss_service import rss_service


router = APIRouter()

@router.post("/rss/sync", response_model=Dict[str, Any])
async def sync_rss_feeds(force: bool = False):
    # RSS service disabled
    return {"status": "disabled"}
    # try:
    #     result = await rss_service.fetch_all(force=force)
    #     return {
    #         "status": "success",
    #         "new_articles": result["new_articles"],
    #         "feeds_processed": result["feeds_processed"],
    #         "total_discovered": result["total_discovered"],
    #         "errors": result["errors"]
    #     }
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=str(e))

@router.get("/articles", response_model=Dict[str, Any])
async def get_articles(limit: int = 50, category: Optional[str] = None):
    query = db.table("articles").select("*").order("published_at", desc=True).limit(limit)
    if category:
        query = query.eq("category", category)
    res = query.execute()
    return res.data

@router.get("/events", response_model=Dict[str, Any])
async def get_events(limit: int = 50):
    res = db.table("events").select("*").order("last_updated", desc=True).limit(limit).execute()
    return res.data

@router.get("/rss", response_model=Dict[str, Any])
async def proxy_rss(url: str):
    """
    Proxies RSS feeds to bypass CORS and handle SSL issues.
    """
    # RSS service disabled
    raise HTTPException(status_code=503, detail="RSS service disabled")
    # try:
    #     response = await rss_service.client.get(url)
    #     response.raise_for_status()
    #     return response.text
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")

class ExtractionRequest(BaseModel):
    content: str
    extraction_schema: List[Dict[str, str]]

class DailySyncRequest(BaseModel):
    news_items: List[Dict[str, Any]]

@router.post("/extract", response_model=Dict[str, Any])
async def handle_extraction(payload: ExtractionRequest):
    """
    API endpoint for data extraction.
    """
    try:
        # Using the new act() method for extraction
        perception = await orchestrator.extractor.perceive(payload.content, {"schema": payload.extraction_schema})
        thought = await orchestrator.extractor.think(perception)
        return await orchestrator.extractor.act(thought, perception)
    except Exception as e:
        if "AI_RATE_LIMIT_EXCEEDED" in str(e):
            raise HTTPException(status_code=429, detail="AI Service is currently rate-limited. Please try again soon.")
        raise HTTPException(status_code=500, detail=str(e))

class NewsItem(BaseModel):
    source_id: str
    content: str
    priority: Optional[str] = "MEDIUM"

class IntelligenceRequest(BaseModel):
    news_items: List[NewsItem]

@router.post("/intelligence", response_model=Dict[str, Any])
async def run_intelligence(request: IntelligenceRequest):
    news_dicts = [item.model_dump() for item in request.news_items]
    state = await orchestrator.run_intelligence_loop(news_dicts)
    return {
        "mission_id": state.mission_id,
        "status": state.status,
        "rri": state.results.get("rri", 0),
        "signals_processed": state.results.get("signals_processed", 0),
        "narrative": state.results.get("narrative", ""),
        "errors": state.errors,
    }

@router.get("/rri", response_model=Dict[str, Any])
async def get_current_rri():
    """
    API endpoint for retrieving the current RRI.
    Returns the latest full state snapshot if available, otherwise computes on-the-fly.
    """
    # Try canonical state layer first
    snapshot = get_latest_snapshot()
    if snapshot:
        return snapshot

    # Fallback: compute on-the-fly
    result = calculate_rri()
    return {
        "rri": result["rri"],
        "p_rev": result["p_rev"],
        "velocity": result["velocity"],
        "compound_stress": result["compound_stress"],
        "cascade_probability": result["cascade_probability"],
        "salience": result["salience"],
        "category_scores": result["category_scores"],
        "model_confidence": result["model_confidence"],
        "timestamp": result["last_calculated"],
    }


@router.post("/rri/compute", response_model=Dict[str, Any])
async def compute_rri_full(overrides: Optional[Dict[str, float]] = None):
    """
    Compute RRI full state on demand. Optionally accepts pipeline field overrides.
    Writes result to the canonical state layer.
    Active shocks already stored via POST /state/active-shocks are included
    in the snapshot.
    """
    result = calculate_rri(overrides=overrides)
    snapshot = write_snapshot(rri_result=result)
    return {
        "snapshot": snapshot,
        "rri": result["rri"],
        "p_rev": result["p_rev"],
        "velocity": result["velocity"],
        "compound_stress": result["compound_stress"],
        "category_scores": result["category_scores"],
    }


@router.get("/rri/full", response_model=Dict[str, Any])
async def get_full_rri_state():
    """
    Returns the complete RRI state (all 24 equations, all fields).
    """
    snapshot = get_latest_snapshot()
    if snapshot:
        return snapshot
    result = calculate_rri()
    write_snapshot(rri_result=result)
    return result


@router.post("/rri/monte-carlo", response_model=Dict[str, Any])
async def run_mc_simulation(overrides: Optional[Dict[str, float]] = None):
    """Run Monte Carlo simulation and return histogram + confidence intervals."""
    result = run_full_monte_carlo(overrides=overrides)
    return result


# ── State Snapshots ─────────────────────────────────────────────

@router.get("/state/latest", response_model=Dict[str, Any])
async def state_latest():
    """Return the most recent non-simulation national state snapshot."""
    snapshot = get_latest_snapshot()
    if not snapshot:
        return {"status": "no_snapshot_yet"}
    return snapshot


@router.get("/state/{version_id}", response_model=Dict[str, Any])
async def state_by_version(version_id: str):
    """Return a specific snapshot by state_version_id."""
    snapshot = get_snapshot_by_version(version_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return snapshot


# ── Active Shocks (frontend ↔ backend bridge) ──────────────────


class ActiveShocksRequest(BaseModel):
    shocks: List[Dict[str, Any]]


@router.get("/state/active-shocks", response_model=Dict[str, Any])
async def get_active_shocks_endpoint():
    """Return active shocks stored on the backend."""
    return {"active_shocks": get_active_shocks()}


@router.post("/state/active-shocks", response_model=Dict[str, Any])
async def post_active_shocks(req: ActiveShocksRequest):
    """Store active shocks from the frontend so write_snapshot persists them."""
    validated = []
    for shock in req.shocks:
        s = dict(shock)
        # Clamp intensity to valid 0–1 range
        try:
            s["intensity"] = max(0.0, min(1.0, float(s.get("intensity", 0))))
        except (TypeError, ValueError):
            s["intensity"] = 0.0
        # Ensure required fields exist
        if not s.get("id") or not s.get("type"):
            continue
        validated.append(s)
    set_active_shocks(validated)
    return {"status": "ok", "count": len(validated)}


@router.get("/signals/{signal_id}", response_model=Dict[str, Any])
async def get_signal(signal_id: str):
    """
    API endpoint for retrieving specific signal details.
    """
    result = db.table("signals").select("*").eq("id", signal_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Signal not found")
    return result.data[0]

@router.get("/correlations/{event_id}", response_model=Dict[str, Any])
async def get_correlations(event_id: str):
    """
    API endpoint for retrieving event correlations.
    """
    # Get event
    event_result = db.table("events").select("*").eq("id", event_id).execute()
    if not event_result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    event = event_result.data[0]
    related_signal_ids = event.get("related_signal_ids", [])
    # Batch fetch all related signals in a single query
    signals = []
    if related_signal_ids:
        s_result = db.table("signals").select("*").in_("id", [str(sid) for sid in related_signal_ids]).execute()
        signals = s_result.data or []
    return {"event": event, "related_signals": signals}

@router.get("/anomalies", response_model=Dict[str, Any])
async def get_anomalies():
    """
    API endpoint for retrieving anomaly reports.
    """
    result = db.table("anomalies").select("*").execute()
    return result.data

@router.post("/intelligence/continuous/start", response_model=Dict[str, Any])
async def start_continuous_loop(interval: int = 300):
    """
    Manually starts the background continuous intelligence loop.
    This loop polls sources and runs the 10-step pipeline at defined intervals.
    """
    # Trigger as background task
    _bg_task = asyncio.create_task(orchestrator.start_continuous_intelligence(interval))
    # Store reference to prevent premature GC
    orchestrator._continuous_task = _bg_task
    return {"status": "Continuous intelligence loop started", "interval": interval}

@router.post("/intelligence/continuous/stop", response_model=Dict[str, Any])
async def stop_continuous_loop():
    """
    Stops the background continuous intelligence loop.
    """
    orchestrator.stop_continuous_intelligence()
    return {"status": "Continuous intelligence loop stopped"}

@router.get("/missions/{mission_id}", response_model=Dict[str, Any])
async def get_mission_state(mission_id: str):
    """
    API endpoint for retrieving the state of a specific mission.
    """
    if mission_id not in orchestrator.missions:
        raise HTTPException(status_code=404, detail="Mission not found")
    return orchestrator.missions[mission_id]

@router.get("/observability/status", response_model=Dict[str, Any])
async def get_observability_status():
    """
    API endpoint for retrieving system health and metrics.
    """
    return orchestrator.observability.get_health_status()

@router.get("/agri/summary", response_model=Dict[str, Any])
async def get_agri_summary():
    """
    API endpoint for retrieving the latest consolidated agricultural intelligence summary.
    """
    try:
        # 1. Get latest metrics (Placeholder: in real system we'd get this from DB/cache)
        agro_inputs = orchestrator._get_latest_agro_metrics()
        
        # 2. Get latest pipeline data from DB to feed BCI
        pipeline_result = db.table("variables").select("*").execute()
        pipeline_data = {v["code"]: v["value"] for v in pipeline_result.data} if pipeline_result.data else {}
        
        # 3. Build BCI inputs from pipeline data
        # Mapping frontend buildBCEWMInputs logic
        bci_inputs = {
            "inflation": pipeline_data.get("economy.inflation", 7.1),
            "food_subsidy_cost": pipeline_data.get("economy.food_subsidies", 2.0),
            "parallel_premium": pipeline_data.get("economy.parallel_market_premium", 18),
            "protest_events_30d": pipeline_data.get("social.protest_events_30d", 23),
            "fx_reserves": pipeline_data.get("economy.fx_reserves", 84),
            "groundwater_stress": pipeline_data.get("environment.groundwater", 0.55),
            "dam_level_pct": pipeline_data.get("environment.dam_levels", 35) * 100,
        }

        # 4. Inject national BCI inputs into each governorate's agro_inputs
        for gov in agro_inputs:
            agro_inputs[gov]["groundwater_stress"] = bci_inputs.get("groundwater_stress", 0.55)
            agro_inputs[gov]["dam_level_pct"] = bci_inputs.get("dam_level_pct", 35)
            agro_inputs[gov]["inflation"] = bci_inputs.get("inflation", 7.1)

        # 5. Generate summary
        summary = orchestrator.agro_engine.process_all_national(agro_inputs, bci_inputs)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/variables", response_model=Dict[str, Any])
async def get_variables():
    """
    API endpoint for retrieving all intelligence variables.
    Tries to get from Supabase first, falls back to JSON file.
    """
    try:
        # Try Supabase variables table
        result = db.table("variables").select("*").execute()
        if result.data:
            return result.data
    except Exception as e:
        logger.warning("Suppressed exception in api/routes.py: %s", e)
    
    # Fallback to local JSON
    import json
    from pathlib import Path
    data_path = Path(__file__).parent.parent / "data" / "rri_variables.json"
    if data_path.exists():
        with open(data_path, "r") as f:
            data = json.load(f)
            return data.get("variables", [])
    
    return []

class PipelineProcessRequest(BaseModel):
    articles: List[Dict[str, Any]] = []

@router.get("/variables/pipeline/status", response_model=Dict[str, Any])
async def get_variable_pipeline_status():
    """Returns stats from the variable pipeline."""
    try:
        stats = variable_pipeline.get_stats()
        return stats
    except Exception as e:
        import traceback, sys
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        raise HTTPException(status_code=500, detail=f"Pipeline status error: {str(e)}")

@router.get("/variables/pipeline/diag", response_model=Dict[str, Any])
async def variable_pipeline_diag():
    """Diagnostic endpoint — no DB calls, verifies router is mounted."""
    import sys
    py_version = sys.version
    module_ok = variable_pipeline is not None
    return {
        "status": "ok",
        "python_version": py_version,
        "module_loaded": module_ok,
        "timestamp": datetime.now().isoformat(),
    }

@router.post("/variables/pipeline/process", response_model=Dict[str, Any])
async def run_variable_pipeline(payload: PipelineProcessRequest):
    """Manually process articles through the variable pipeline."""
    if not payload.articles:
        return {"status": "no_articles", "processed": 0}
    result = variable_pipeline.process_articles_batch(payload.articles)
    return {"status": "ok", **result}

@router.post("/variables/pipeline/reset", response_model=Dict[str, Any])
async def reset_variable_pipeline():
    """Reset pipeline stats."""
    variable_pipeline.reset_stats()
    return {"status": "ok"}

@router.get("/observability/agents", response_model=Dict[str, Any])
async def get_agent_observability():
    """
    API endpoint for retrieving AI agent status and performance.
    """
    # In a real system, we'd track this more dynamically
    # For now, we'll return the defined agents and their general status
    agents = [
        {"id": "extractor", "name": "Data Extractor", "type": "Extraction", "status": "IDLE", "last_task": "None", "latency": "120ms"},
        {"id": "analyst", "name": "Trend Analyst", "type": "Analysis", "status": "IDLE", "last_task": "None", "latency": "450ms"},
        {"id": "predictor", "name": "Risk Predictor", "type": "Prediction", "status": "IDLE", "last_task": "None", "latency": "890ms"},
        {"id": "resource_scout", "name": "Resource Scout", "type": "Scouting", "status": "IDLE", "last_task": "None", "latency": "310ms"},
        {"id": "disinfo_analyst", "name": "Disinformation Analyst", "type": "Cognitive Security", "status": "IDLE", "last_task": "None", "latency": "520ms"},
        {"id": "movement_tracker", "name": "Social Movement Tracker", "type": "Mobilization", "status": "IDLE", "last_task": "None", "latency": "410ms"},
        {"id": "econ_forecaster", "name": "Economic Forecaster", "type": "Forecasting", "status": "IDLE", "last_task": "None", "latency": "680ms"},
        {"id": "security_analyst", "name": "Security Analyst", "type": "Stability", "status": "IDLE", "last_task": "None", "latency": "590ms"},
        {"id": "orchestrator", "name": "Mission Orchestrator", "type": "Orchestration", "status": "ACTIVE", "last_task": "System Monitoring", "latency": "15ms"},
    ]
    
    # Check if any missions are running to update status
    is_running = any(m.status == "RUNNING" for m in orchestrator.missions.values())
    if is_running:
        active_mission = next(m for m in orchestrator.missions.values() if m.status == "RUNNING")
        for agent in agents:
            if agent["id"] in active_mission.current_step.lower():
                agent["status"] = "BUSY"
                agent["last_task"] = active_mission.current_step
    
    return {
        "agents": agents,
        "system_health": orchestrator.observability.get_health_status(),
        "timestamp": datetime.now().isoformat()
    }


# ── State Machine ─────────────────────────────────────────────

from pydantic import BaseModel

class StateInput(BaseModel):
    rri: float = 2.0
    velocity: float = 0.0
    cascade_prob: float = 0.3
    coercion_idx: float = 0.3
    narrative_divergence: float = 0.3
    elite_cohesion: float = 0.6
    sir_infected: float = 0.0
    compound_stress: float = 0.3

@router.post("/state/classify", response_model=Dict[str, Any])
async def classify_state(inputs: StateInput):
    sm = get_state_machine()
    result = sm.classify(**inputs.model_dump())
    return result

@router.get("/state/current", response_model=Dict[str, Any])
async def current_state():
    sm = get_state_machine()
    if not sm.history:
        return {"phase": "unknown", "phase_label": "Unknown"}
    return sm.history[-1]

@router.get("/state/history", response_model=Dict[str, Any])
async def state_history(limit: int = 100):
    sm = get_state_machine()
    return sm.get_history(limit)

@router.get("/state/transitions", response_model=Dict[str, Any])
async def state_transitions(limit: int = 50):
    sm = get_state_machine()
    return sm.get_transition_log(limit)

@router.get("/state/viterbi", response_model=Dict[str, Any])
async def state_viterbi():
    """Run Viterbi decoding on full history for smoothed state path."""
    sm = get_state_machine()
    return sm.decode_history_path()

@router.get("/state/emission-table", response_model=Dict[str, Any])
async def state_emission_table():
    """Return current learned emission parameters (means & stds)."""
    sm = get_state_machine()
    return sm.get_emission_table()


# ── Telegram Collection ─────────────────────────────────────────

@router.post("/telegram/collect", response_model=Dict[str, Any])
async def telegram_collect():
    """Trigger a one-time collection cycle."""
    collector = get_telegram_collector()
    result = await collector.collect()
    return result

@router.post("/telegram/start", response_model=Dict[str, Any])
async def telegram_start():
    """Start background collection loop (5 min interval)."""
    collector = get_telegram_collector()
    if collector.running:
        return {"status": "already_running"}
    asyncio.ensure_future(collector.run_loop(300))
    return {"status": "started"}

@router.post("/telegram/stop", response_model=Dict[str, Any])
async def telegram_stop():
    collector = get_telegram_collector()
    collector.stop()
    return {"status": "stopped"}

@router.get("/telegram/status", response_model=Dict[str, Any])
async def telegram_status():
    collector = get_telegram_collector()
    return collector.get_status()

@router.get("/telegram/messages", response_model=Dict[str, Any])
async def telegram_messages(limit: int = 50, category: Optional[str] = None, alert_only: bool = False):
    query = db.table("telegram_messages").select("*").order("date", desc=True).limit(limit)
    if category:
        query = query.eq("channel_category", category)
    if alert_only:
        query = query.gt("alert_count", 0)
    res = query.execute()
    return res.data or []


# ── Narrative Warfare ──────────────────────────────────────────

class NarrativeAnalyzeRequest(BaseModel):
    hours: int = 720  # 30 days default to capture historical articles

@router.post("/narrative/analyze", response_model=Dict[str, Any])
async def narrative_analyze(req: NarrativeAnalyzeRequest):
    engine = get_narrative_engine()
    result = await engine.get_or_analyze(req.hours)
    return result

@router.get("/narrative/current", response_model=Dict[str, Any])
async def narrative_current():
    engine = get_narrative_engine()
    return engine.get_current_state()

@router.get("/narrative/history", response_model=Dict[str, Any])
async def narrative_history(limit: int = 50):
    engine = get_narrative_engine()
    return engine.get_history(limit)

@router.get("/narrative/frames", response_model=Dict[str, Any])
async def narrative_frames():
    """Return all frame definitions with metadata."""
    return [
        {"id": fid, **fdata}
        for fid, fdata in FRAMES.items()
    ]

@router.get("/narrative/trend/{frame_id}", response_model=Dict[str, Any])
async def narrative_trend(frame_id: str, window: int = 20):
    engine = get_narrative_engine()
    return {"frame_id": frame_id, "trend": engine.get_frame_trend(frame_id, window)}


# ── Signal Credibility Index ──────────────────────────────────

@router.post("/sci/score", response_model=Dict[str, Any])
async def sci_score_text(text: str = "", source_id: str = "unknown", source_category: str = ""):
    engine = get_sci_engine()
    return engine.score_text(text, source_id, source_category)

class SCIBatchRequest(BaseModel):
    hours: int = 24

@router.post("/sci/score-all", response_model=Dict[str, Any])
async def sci_score_all(req: SCIBatchRequest):
    engine = get_sci_engine()
    engine.score_recent_signals(req.hours)
    all_results = engine.get_all_scores()
    return {"total": len(all_results), "results": all_results[:200], "stats": engine.get_stats()}

@router.get("/sci/status", response_model=Dict[str, Any])
async def sci_status():
    engine = get_sci_engine()
    return engine.get_stats()

@router.get("/sci/sources", response_model=Dict[str, Any])
async def sci_sources():
    engine = get_sci_engine()
    return engine.get_source_table()


# ── Emotional Heatmap ─────────────────────────────────────────

class HeatmapRequest(BaseModel):
    hours: int = 720

@router.get("/heatmap/current", response_model=Dict[str, Any])
async def heatmap_current():
    engine = get_heatmap_engine()
    cached = engine.get_cached()
    if cached:
        return cached
    result = await engine.fetch_and_compute(720)
    return result

@router.post("/heatmap/refresh", response_model=Dict[str, Any])
async def heatmap_refresh(req: HeatmapRequest):
    engine = get_heatmap_engine()
    result = await engine.fetch_and_compute(req.hours)
    return result


# ── Calibration Dashboard ────────────────────────────────────

@router.get("/calibration/summary", response_model=Dict[str, Any])
async def calibration_summary():
    engine = get_calibration_engine()
    cached = engine.get_cached()
    if cached:
        return cached
    result = await engine.compute()
    return result

@router.post("/calibration/refresh", response_model=Dict[str, Any])
async def calibration_refresh():
    engine = get_calibration_engine()
    result = await engine.compute()
    return result

import asyncio
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from ..orchestrator import orchestrator, MissionState
from ..core.database import db

from ..services.rss_service import rss_service

router = APIRouter()

@router.post("/rss/sync")
async def sync_rss_feeds(force: bool = False):
    """
    Triggers the parallel RSS fetch and processing loop in the backend.
    """
    try:
        result = await rss_service.fetch_all(force=force)
        return {
            "status": "success",
            "new_articles": result["new_articles"],
            "errors": result["errors"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExtractionRequest(BaseModel):
    content: str
    schema: List[Dict[str, str]]

class DailySyncRequest(BaseModel):
    news_items: List[Dict[str, Any]]

@router.post("/extract")
async def handle_extraction(payload: ExtractionRequest):
    """
    API endpoint for data extraction.
    """
    try:
        # Using the new act() method for extraction
        perception = await orchestrator.extractor.perceive(payload.content, {"schema": payload.schema})
        thought = await orchestrator.extractor.think(perception)
        return await orchestrator.extractor.act(thought, perception)
    except Exception as e:
        if "AI_RATE_LIMIT_EXCEEDED" in str(e):
            raise HTTPException(status_code=429, detail="AI Service is currently rate-limited. Please try again soon.")
        raise HTTPException(status_code=500, detail=str(e))
async def handle_daily_sync(payload: DailySyncRequest):
    """
    API endpoint for the daily synchronization mission.
    """
    try:
        return await orchestrator.run_intelligence_loop(payload.news_items)
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

@router.post("/intelligence")
async def run_intelligence(request: IntelligenceRequest):
    news_dicts = [item.dict() for item in request.news_items]
    state = await orchestrator.run_intelligence_loop(news_dicts)
    return {
        "mission_id": state.mission_id,
        "status": state.status,
        "rri": state.results.get("rri", 0),
        "signals_processed": state.results.get("signals_processed", 0),
        "narrative": state.results.get("narrative", ""),
        "errors": state.errors,
    }

@router.get("/rri")
async def get_current_rri():
    """
    API endpoint for retrieving the current RRI.
    """
    # Return latest RRI from database
    try:
        result = db.table("rri_history") \
            .select("rri_score, timestamp") \
            .order("timestamp", desc=True) \
            .limit(1) \
            .execute()
        if result.data:
            return {"rri": result.data[0]["rri_score"],
                    "timestamp": result.data[0]["timestamp"]}
    except:
        pass
    return {"rri": 0.0, "timestamp": None}

@router.get("/signals/{signal_id}")
async def get_signal(signal_id: str):
    """
    API endpoint for retrieving specific signal details.
    """
    result = db.table("signals").select("*").eq("id", signal_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Signal not found")
    return result.data[0]

@router.get("/correlations/{event_id}")
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
    # Get related signals
    signals = []
    for sid in related_signal_ids:
        s_result = db.table("signals").select("*").eq("id", sid).execute()
        if s_result.data:
            signals.append(s_result.data[0])
    return {"event": event, "related_signals": signals}

@router.get("/anomalies")
async def get_anomalies():
    """
    API endpoint for retrieving anomaly reports.
    """
    result = db.table("anomalies").select("*").execute()
    return result.data

@router.post("/intelligence/continuous/start")
async def start_continuous_loop(interval: int = 300):
    """
    Manually starts the background continuous intelligence loop.
    This loop polls sources and runs the 10-step pipeline at defined intervals.
    """
    # Trigger as background task
    asyncio.create_task(orchestrator.start_continuous_intelligence(interval))
    return {"status": "Continuous intelligence loop started", "interval": interval}

@router.post("/intelligence/continuous/stop")
async def stop_continuous_loop():
    """
    Stops the background continuous intelligence loop.
    """
    orchestrator.stop_continuous_intelligence()
    return {"status": "Continuous intelligence loop stopped"}

@router.get("/missions/{mission_id}")
async def get_mission_state(mission_id: str):
    """
    API endpoint for retrieving the state of a specific mission.
    """
    if mission_id not in orchestrator.missions:
        raise HTTPException(status_code=404, detail="Mission not found")
    return orchestrator.missions[mission_id]

@router.get("/observability/status")
async def get_observability_status():
    """
    API endpoint for retrieving system health and metrics.
    """
    return orchestrator.observability.get_health_status()

@router.get("/agri/summary")
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

        # 4. Generate summary
        summary = orchestrator.agro_engine.process_all_national(agro_inputs, bci_inputs)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/variables")
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
    except Exception:
        pass
    
    # Fallback to local JSON
    import json
    from pathlib import Path
    data_path = Path(__file__).parent.parent / "data" / "rri_variables.json"
    if data_path.exists():
        with open(data_path, "r") as f:
            data = json.load(f)
            return data.get("variables", [])
    
    return []

@router.get("/observability/agents")
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

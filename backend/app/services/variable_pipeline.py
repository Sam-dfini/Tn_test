import json
import math
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..core.database import db

ARTICLES_PROCESSED = 0
VARIABLES_NUDGED = 0
LAST_PIPELINE_RUN = None
VARIABLE_CACHE: List[Dict[str, Any]] = []
VARIABLE_CACHE_TIME = None

def _load_variables_from_db() -> List[Dict[str, Any]]:
    try:
        result = db.table("variables").select("*").execute()
        if result.data:
            return result.data
    except Exception:
        pass
    data_path = Path(__file__).parent.parent / "data" / "rri_variables.json"
    if data_path.exists():
        with open(data_path) as f:
            data = json.load(f)
            return data.get("variables", [])
    return []

def _ensure_variable_cache():
    global VARIABLE_CACHE, VARIABLE_CACHE_TIME
    now = datetime.now()
    if not VARIABLE_CACHE or not VARIABLE_CACHE_TIME or (now - VARIABLE_CACHE_TIME).total_seconds() > 120:
        VARIABLE_CACHE = _load_variables_from_db()
        VARIABLE_CACHE_TIME = now

def _normalize_value(v: Dict[str, Any]) -> float:
    raw = v.get("value_2026", 0)
    min_val = v.get("min_value", 0)
    max_val = v.get("max_value", 100)
    invert = v.get("invert", False)
    if max_val == min_val:
        return 0.5
    norm = (raw - min_val) / (max_val - min_val)
    norm = max(0.0, min(1.0, norm))
    if invert:
        norm = 1.0 - norm
    return norm

def _denormalize_value(norm: float, min_val: float, max_val: float, invert: bool) -> float:
    if invert:
        norm = 1.0 - norm
    return min_val + norm * (max_val - min_val)

def process_article(title: str, content: str, severity: int = 1) -> Dict[str, Any]:
    global ARTICLES_PROCESSED, VARIABLES_NUDGED, LAST_PIPELINE_RUN
    _ensure_variable_cache()
    text = f"{title} {content}".lower()
    nudged = []
    updates = []
    for v in VARIABLE_CACHE:
        keywords = v.get("keywords", v.get("nlp_keywords", [])) or []
        if not keywords:
            continue
        matched = any(kw.lower() in text for kw in keywords if kw)
        if not matched:
            continue
        nlp_nudge = v.get("nlp_nudge", 0.05) or 0.05
        scaled_nudge = nlp_nudge * (severity / 3.0)
        min_val = v.get("min_value", 0)
        max_val = v.get("max_value", 100)
        invert = v.get("invert", False)
        current_norm = _normalize_value(v)
        new_norm = max(0.0, min(1.5, current_norm + scaled_nudge))
        new_raw = _denormalize_value(new_norm, min_val, max_val, invert)
        v_id = v.get("id") or f"{v.get('code', '')}{v.get('number', 0)}"
        old_val = v.get("value_2026", 0)
        nudged.append({
            "variable_id": v_id,
            "name": v.get("name", ""),
            "code": v.get("code", ""),
            "number": v.get("number", 0),
            "old_value": old_val,
            "new_value": round(new_raw, 4),
            "nudge": round(scaled_nudge, 4),
            "keywords_matched": [kw for kw in keywords if kw.lower() in text],
        })
        v["value_2026"] = round(new_raw, 4)
        v["last_updated"] = datetime.now().isoformat()[:10]
        history = v.get("history", [])
        if isinstance(history, list):
            if len(history) > 0:
                history.pop(0)
            history.append(round(new_raw, 4))
            v["history"] = history
        updates.append(v)
    if updates:
        variable_ids = []
        for v in updates:
            v_id = v.get("id") or f"{v.get('code', '')}{v.get('number', 0)}"
            try:
                db.table("variables").upsert({
                    "id": v_id,
                    "code": v.get("code", ""),
                    "number": v.get("number", 0),
                    "value_2026": v.get("value_2026", 0),
                    "last_updated": v.get("last_updated", datetime.now().isoformat()[:10]),
                    "history": v.get("history", []),
                }).execute()
                variable_ids.append(v_id)
            except Exception as e:
                print(f"[VARIABLE PIPELINE] Upsert error for {v_id}: {e}")
        VARIABLES_NUDGED += len(variable_ids)
    ARTICLES_PROCESSED += 1
    LAST_PIPELINE_RUN = datetime.now().isoformat()
    return {
        "article_processed": True,
        "variables_nudged": len(nudged),
        "nudged_variables": nudged,
        "total_articles_processed": ARTICLES_PROCESSED,
        "total_variables_nudged": VARIABLES_NUDGED,
    }

def process_articles_batch(articles: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_nudged = 0
    all_nudged_vars = []
    for article in articles:
        title = article.get("title", "")
        content = article.get("content") or article.get("summary", "")
        severity = article.get("severity", 1)
        result = process_article(title, content, severity)
        total_nudged += result["variables_nudged"]
        all_nudged_vars.extend(result["nudged_variables"])
    return {
        "articles_processed": len(articles),
        "variables_nudged": total_nudged,
        "nudged_variables": all_nudged_vars[:50],
        "total_articles_processed": ARTICLES_PROCESSED,
        "total_variables_nudged": VARIABLES_NUDGED,
    }

def get_pipeline_stats() -> Dict[str, Any]:
    try:
        _ensure_variable_cache()
    except Exception:
        pass
    return {
        "articles_processed": ARTICLES_PROCESSED,
        "variables_nudged": VARIABLES_NUDGED,
        "last_run": LAST_PIPELINE_RUN,
        "total_variables": len(VARIABLE_CACHE),
        "variables_with_keywords": sum(1 for v in VARIABLE_CACHE if v.get("keywords") or v.get("nlp_keywords")),
    }

def get_pipeline_variable(variable_id: str) -> Optional[Dict[str, Any]]:
    _ensure_variable_cache()
    for v in VARIABLE_CACHE:
        v_id = v.get("id") or f"{v.get('code', '')}{v.get('number', 0)}"
        if v_id == variable_id:
            return v
    return None

def reset_stats():
    global ARTICLES_PROCESSED, VARIABLES_NUDGED, LAST_PIPELINE_RUN
    ARTICLES_PROCESSED = 0
    VARIABLES_NUDGED = 0
    LAST_PIPELINE_RUN = None

variable_pipeline = type("VariablePipeline", (), {
    "process_article": process_article,
    "process_articles_batch": process_articles_batch,
    "get_stats": get_pipeline_stats,
    "get_variable": get_pipeline_variable,
    "reset_stats": reset_stats,
})()

def get_variable_pipeline():
    return variable_pipeline

import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from ..agents.base import BaseAgent, AgentResponse
from .models import Signal, Event
from uuid import UUID, uuid4
from datetime import datetime

class EventExtractionEngine(BaseAgent):
    """
    Upgraded ExtractorAgent for structured geopolitical/economic event extraction.
    """
    def __init__(self, model_name: str = "gemini-1.5-flash"):
        system_instruction = """
        You are a Senior Political and Economic Analyst for TunisiaIntel.
        Your goal is to convert raw text into structured geopolitical or economic events.
        
        RULES:
        1. Identify the event type (protest, economic, political, security, etc.).
        2. Extract location (city/region), actors, cause, and severity (LOW, MEDIUM, HIGH, CRITICAL).
        3. Assign a priority (LOW, MEDIUM, HIGH, CRITICAL) based on potential impact.
        4. Assign a confidence score (0 to 1).
        5. Assign an uncertainty score (0 to 1) based on ambiguity or conflicting details in the text.
        6. Return ONLY a valid JSON object.
        7. If multiple events are found, return a JSON array of objects.
        """
        super().__init__(
            role="Event Extractor", 
            system_instruction=system_instruction,
            model_name=model_name
        )

    async def extract_event(self, raw_text: str, timestamp: datetime, source_id: str) -> List[Event]:
        """
        Converts raw text into structured events.
        """
        prompt = f"""
        CONTENT:
        {raw_text}
        
        TIMESTAMP: {timestamp.isoformat()}
        SOURCE: {source_id}
        
        Return the extracted events as a JSON array of objects.
        """
        
        response = await self.run(prompt)
        
        try:
            clean_json = response.content.strip()
            if "```json" in clean_json:
                clean_json = clean_json.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_json:
                clean_json = clean_json.split("```")[1].split("```")[0].strip()
                
            data = json.loads(clean_json)
            if isinstance(data, dict):
                data = [data]
                
            events = []
            for item in data:
                # Map intensity or severity to confidence if not provided
                confidence = item.get("confidence", 0.7)
                
                # XAI Provenance
                provenance = [{
                    "action": "extraction",
                    "timestamp": datetime.now().isoformat(),
                    "agent": self.role,
                    "reasoning": item.get("cause", "Direct extraction from raw telemetry"),
                    "source_id": source_id
                }]
                
                # Create the Event object
                event = Event(
                    event_type=item.get("event_type", "general"),
                    subtype=item.get("subtype"),
                    location=item.get("location", "Tunisia"),
                    timestamp=timestamp,
                    actors=item.get("actors", []),
                    cause=item.get("cause"),
                    severity=item.get("severity", "MEDIUM"),
                    priority=item.get("priority", "MEDIUM"),
                    uncertainty_score=item.get("uncertainty_score", 0.0),
                    description=item.get("description", raw_text[:200]),
                    confidence=confidence,
                    related_signal_ids=[],
                    provenance=provenance
                )
                events.append(event)
            return events
        except Exception as e:
            print(f"Event extraction parsing failed: {e}")
            return []

    async def extract_signal(self, raw_text: str, timestamp: datetime, source_id: str, reliability: float) -> Signal:
        """
        Converts raw text into a structured signal.
        """
        prompt = f"""
        Extract a structured signal from this text:
        {raw_text}
        
        Return a JSON object with:
        - type (protest, economic, political, security, etc.)
        - subtype
        - location (city/region)
        - intensity (0 to 1)
        - priority (LOW, MEDIUM, HIGH, CRITICAL)
        - uncertainty_score (0 to 1)
        - extracted_entities (list of objects with name and type)
        - tags (list of strings)
        - confidence (0 to 1)
        """
        
        response = await self.run(prompt)
        
        try:
            clean_json = response.content.strip()
            if "```json" in clean_json:
                clean_json = clean_json.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_json:
                clean_json = clean_json.split("```")[1].split("```")[0].strip()
                
            data = json.loads(clean_json)
            
            # XAI Provenance
            provenance = [{
                "action": "signal_extraction",
                "timestamp": datetime.now().isoformat(),
                "agent": self.role,
                "reasoning": f"Entity resolution: {len(data.get('extracted_entities', []))} detected",
                "source_id": source_id
            }]
            
            return Signal(
                type=data.get("type", "general"),
                subtype=data.get("subtype"),
                location=data.get("location", "Tunisia"),
                timestamp=timestamp,
                intensity=data.get("intensity", 0.5),
                priority=data.get("priority", "MEDIUM"),
                uncertainty_score=data.get("uncertainty_score", 0.0),
                source_id=source_id,
                source_reliability_score=reliability,
                confidence_score=data.get("confidence", 0.7),
                raw_text=raw_text,
                extracted_entities=data.get("extracted_entities", []),
                tags=data.get("tags", []),
                provenance=provenance
            )
        except Exception as e:
            print(f"Signal extraction parsing failed: {e}")
            # Fallback to a basic signal
            return Signal(
                type="general",
                location="Tunisia",
                timestamp=timestamp,
                intensity=0.5,
                source_id=source_id,
                source_reliability_score=reliability,
                confidence_score=0.5,
                raw_text=raw_text
            )

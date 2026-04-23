import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import google.generativeai as genai
from pydantic import BaseModel
from ..core.database import db

class AgentResponse(BaseModel):
    content: str
    structured_data: Optional[Dict[str, Any]] = None
    confidence: float = 1.0
    tokens_used: int = 0

class BaseAgent:
    """
    Base class for all TunisiaIntel agents.
    Provides a semi-autonomous interface with memory, perception, reasoning, and action.
    """
    def __init__(
        self, 
        role: str, 
        system_instruction: str,
        model_name: str = "gemini-3-flash-preview"
    ):
        self.role = role
        self.system_instruction = system_instruction
        self.model_name = "gemini-1.5-flash"
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
            
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=self.system_instruction
        )
        
        # Agent's unique ID for memory
        self.agent_id = self.role.lower().replace(" ", "_")
        
        # Performance Tracking
        self.performance_metrics = {
            "total_tasks": 0,
            "avg_accuracy": 0.0,
            "current_weight": 1.0,
            "last_recalibrated_at": str(datetime.now())
        }

    async def perceive(self, data: Any, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Processes incoming data and retrieves relevant memory.
        """
        # 1. Retrieve past memory from Supabase
        memory = await self._get_memory(context.get("context_key") if context else "general")
        
        # 2. Combine data and memory
        perception = {
            "input_data": data,
            "past_context": memory,
            "current_context": context or {}
        }
        return perception

    async def think(self, perception: Dict[str, Any]) -> str:
        """
        Analyzes the perceived data and context to generate a reasoning path.
        """
        prompt = f"""
        PERCEPTION:
        {json.dumps(perception, indent=2, default=str)}
        
        TASK:
        Analyze the current input in the context of your past memory. 
        Identify patterns, anomalies, or critical updates.
        """
        
        response = await self._call_llm(prompt)
        return response.content

    async def act(self, thought: str, perception: Dict[str, Any]) -> AgentResponse:
        """
        Produces the final output or performs an action based on the thought.
        """
        prompt = f"""
        THOUGHT PROCESS:
        {thought}
        
        ORIGINAL DATA:
        {json.dumps(perception['input_data'], indent=2, default=str)}
        
        TASK:
        Execute your role-specific action based on the analysis above.
        """
        
        return await self._call_llm(prompt)

    async def learn(self, perception: Dict[str, Any], action_result: AgentResponse):
        """
        Stores the context and outcome in Supabase memory.
        """
        context_key = perception.get("current_context", {}).get("context_key", "general")
        
        memory_data = {
            "agent_id": self.agent_id,
            "context_key": context_key,
            "context_value": {
                "input": perception["input_data"],
                "thought": "...", # Could store full thought if needed
                "output": action_result.content,
                "timestamp": str(os.getenv("CURRENT_TIME", ""))
            }
        }
        
        try:
            db.table("agent_memory").insert(memory_data).execute()
        except Exception as e:
            print(f"Failed to store memory for {self.role}: {e}")

    async def run(self, data: Any, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        High-level orchestration of the agent's task: perceive -> think -> act -> learn.
        """
        perception = await self.perceive(data, context)
        thought = await self.think(perception)
        action_result = await self.act(thought, perception)
        await self.learn(perception, action_result)
        return action_result

    async def _call_llm(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Low-level execution of an AI model call.
        """
        full_prompt = prompt
        if context:
            full_prompt = f"Context: {context}\n\nTask: {prompt}"
            
        try:
            response = await self.model.generate_content_async(full_prompt)
            return AgentResponse(
                content=response.text,
                tokens_used=response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else 0
            )
        except Exception as e:
            error_str = str(e)
            print(f"Agent {self.role} failed: {error_str}")
            if "429" in error_str or "quota" in error_str.lower():
                # Re-raise with specific message so API can catch it
                raise Exception("AI_RATE_LIMIT_EXCEEDED")
            raise e

    async def _get_memory(self, context_key: str) -> List[Dict[str, Any]]:
        """
        Retrieves memory from Supabase.
        """
        try:
            response = db.table("agent_memory") \
                .select("context_value") \
                .eq("agent_id", self.agent_id) \
                .eq("context_key", context_key) \
                .order("created_at", desc=True) \
                .limit(5) \
                .execute()
            return [item["context_value"] for item in response.data]
        except Exception as e:
            print(f"Failed to retrieve memory for {self.role}: {e}")
            return []

import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .base import BaseAgent, AgentResponse

class ExtractedField(BaseModel):
    field: str
    value: Any
    confidence: str
    source_quote: str

class ExtractorAgent(BaseAgent):
    """
    Specialized agent for extracting numerical values from text.
    Replaces the client-side extraction logic in pipelineService.ts.
    """
    def __init__(self, model_name: str = "gemini-3-flash-preview"):
        system_instruction = """
        You are a data extraction specialist for the TunisiaIntel platform.
        Your goal is to extract specific numerical values from provided text.
        
        RULES:
        1. Extract ONLY the fields requested in the schema.
        2. Provide an exact source quote for each value.
        3. Assign a confidence score (HIGH, MEDIUM, LOW).
        4. Return ONLY a valid JSON array of objects.
        5. If a value is not found, do not include it in the response.
        """
        super().__init__(
            role="Data Extractor", 
            system_instruction=system_instruction,
            model_name=model_name
        )

    async def run(self, data: Any, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Specialized run for data extraction.
        """
        # Ensure context key is set for memory
        context = context or {}
        if "context_key" not in context:
            context["context_key"] = "data_extraction"
            
        return await super().run(data, context)

    async def act(self, thought: str, perception: Dict[str, Any]) -> AgentResponse:
        """
        Specialized act for data extraction.
        """
        input_data = perception.get('input_data')
        current_context = perception.get('current_context', {})
        
        # Case 1: content and schema are in a dict input_data
        if isinstance(input_data, dict) and "content" in input_data and "schema" in input_data:
            content = input_data["content"]
            schema = input_data["schema"]
        # Case 2: content is input_data, schema is in current_context
        elif isinstance(input_data, str) and "schema" in current_context:
            content = input_data
            schema = current_context["schema"]
        else:
            # Fallback to base act or return empty
            return AgentResponse(content="[]", structured_data={"extracted_fields": []})

        results = await self.extract(content, schema)
        return AgentResponse(
            content=json.dumps([r.model_dump() for r in results]),
            structured_data={"extracted_fields": [r.model_dump() for r in results]}
        )

    async def extract(self, content: str, schema: List[Dict[str, str]]) -> List[ExtractedField]:
        """
        Extracts fields based on a provided schema.
        """
        prompt = f"""
        SCHEMA TO EXTRACT:
        {json.dumps(schema, indent=2)}
        
        CONTENT:
        {content}
        
        Return the extracted fields as a JSON array.
        """
        
        response = await self._call_llm(prompt, max_tokens=500)
        
        try:
            # Clean and parse the JSON response
            clean_json = response.content.strip()
            if "```json" in clean_json:
                clean_json = clean_json.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_json:
                clean_json = clean_json.split("```")[1].split("```")[0].strip()
                
            data = json.loads(clean_json)
            return [ExtractedField(**item) for item in data]
        except Exception as e:
            print(f"Extraction parsing failed: {e}")
            return []

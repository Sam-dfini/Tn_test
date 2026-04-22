import os
import json
import re
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in environment.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def parse_pipeline_service():
    file_path = "src/services/pipelineService.ts"
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return []

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the FIELD_MAP block
    match = re.search(r"export const FIELD_MAP = (\{.*?\});", content, re.DOTALL)
    if not match:
        print("Error: FIELD_MAP not found in pipelineService.ts")
        return []

    # This is a bit hacky because it's JS but we can try to turn it into JSON-ish
    # Or just extract fields manually with regex if the structure is consistent
    js_content = match.group(1)
    
    # Regex to capture individual entries
    # 'id': { label: '...', ... }
    entries = re.findall(r"'([\w\.]+)':\s*\{(.*?)\}", js_content, re.DOTALL)
    
    records = []
    for entry_id, body in entries:
        record = {"id": entry_id}
        
        # Extract properties
        label_m = re.search(r"label:\s*'(.*?)'", body)
        unit_m = re.search(r"unit:\s*'(.*?)'", body)
        desc_m = re.search(r"description:\s*'(.*?)'", body)
        module_m = re.search(r"module:\s*'(.*?)'", body)
        
        # Arrays
        keywords_m = re.search(r"keywords:\s*\[(.*?)\]", body)
        sources_m = re.search(r"sources:\s*\[(.*?)\]", body)
        
        if label_m: record["label"] = label_m.group(1)
        if unit_m: record["unit"] = unit_m.group(1)
        if desc_m: record["description"] = desc_m.group(1)
        if module_m: record["module"] = module_m.group(1)
        
        if keywords_m:
            record["keywords"] = [k.strip().strip("'").strip('"') for k in keywords_m.group(1).split(",") if k.strip()]
        if sources_m:
            record["sources"] = [s.strip().strip("'").strip('"') for s in sources_m.group(1).split(",") if s.strip()]
            
        records.append(record)
    
    return records

def seed_database(records):
    print(f"Seeding {len(records)} variables to Supabase...")
    
    # Chunking for bulk operations
    chunk_size = 50
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        try:
            response = supabase.table("variables").upsert(chunk).execute()
            print(f"Upserted chunk {i//chunk_size + 1}")
        except Exception as e:
            print(f"Error upserting chunk: {e}")

if __name__ == "__main__":
    variables = parse_pipeline_service()
    if variables:
        seed_database(variables)
    else:
        print("No variables found to seed.")

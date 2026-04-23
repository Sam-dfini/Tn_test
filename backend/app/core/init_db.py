import asyncio
import json
import logging
from pathlib import Path
from app.core.database import supabase_client

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_variables():
    """
    Reads variables from rri_variables.json and upserts them into Supabase.
    """
    data_path = Path(__file__).parent.parent / "data" / "rri_variables.json"
    
    if not data_path.exists():
        logger.error(f"Variables file not found at {data_path}")
        return

    with open(data_path, "r") as f:
        data = json.load(f)
        variables = data.get("variables", [])

    logger.info(f"Loaded {len(variables)} variables from JSON.")

    # Upsert variables in batches
    count = 0
    for var in variables:
        try:
            supabase_client.table("variables").upsert(var).execute()
            count += 1
        except Exception as e:
            logger.error(f"Failed to upsert variable {var['name']}: {e}")

    logger.info(f"Successfully upserted {count} variables into Supabase.")

if __name__ == "__main__":
    asyncio.run(init_variables())

import sys
import os

# Mock the environment so we can import modules
sys.path.append(os.path.join(os.getcwd(), 'backend', 'app'))

import asyncio
from services.rss_service import rss_service

async def run_test():
    print("Starting direct RSS sync test...")
    result = await rss_service.fetch_all()
    print("Sync complete.")
    print(f"New articles: {result.get('new_articles')}")
    if result.get('errors'):
        print(f"Errors: {result['errors']}")

if __name__ == "__main__":
    asyncio.run(run_test())

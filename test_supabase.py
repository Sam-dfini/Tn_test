import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def test_supabase_connection():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    print(f"Testing Supabase connection to: {url}")
    
    try:
        client: Client = create_client(url, key)
        # Test query to check if we can reach it
        # Note: We just check if articles table exists by trying a select
        res = client.table("articles").select("count", count="exact").limit(1).execute()
        print(f"SUCCESS: Successfully connected to Supabase.")
        print(f"Table 'articles' count: {res.count}")
    except Exception as e:
        print(f"FAILURE: Could not connect to Supabase or table missing: {e}")

if __name__ == "__main__":
    test_supabase_connection()

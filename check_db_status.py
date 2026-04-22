import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def check_db():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    client: Client = create_client(url, key)
    
    tables = ["articles", "events", "signals", "rri_history", "agri_readings"]
    
    print("--- Table Counts ---")
    for table in tables:
        try:
            res = client.table(table).select("count", count="exact").limit(1).execute()
            print(f"{table}: {res.count}")
        except Exception as e:
            print(f"{table}: ERROR ({e})")

if __name__ == "__main__":
    check_db()

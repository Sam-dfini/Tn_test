import logging
from supabase import create_client, Client
from .config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Supabase client
# NOTE: This uses the SUPABASE_KEY (service_role key), which bypasses RLS.
# ONLY use this client in the backend to ensure data security.
try:
    supabase_client: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY
    )
    logger.info("Supabase client initialized successfully.")
    db = supabase_client
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    raise e

def get_supabase() -> Client:
    """
    Returns the initialized Supabase client.
    This client uses the service_role key and bypasses RLS.
    """
    return supabase_client

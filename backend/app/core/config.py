# backend/app/core/config.py
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Explicitly load .env file
load_dotenv()

class Settings(BaseSettings):
    """
    Application configuration settings.
    Loads from environment variables or .env file.
    """
    # General App Settings
    APP_NAME: str = "TUNISIAINTEL Backend"
    DEBUG: bool = True
# backend/app/core/config.py
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Explicitly load .env file
load_dotenv()

class Settings(BaseSettings):
    """
    Application configuration settings.
    Loads from environment variables or .env file.
    """
    # General App Settings
    APP_NAME: str = "TUNISIAINTEL Backend"
    DEBUG: bool = True

    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_KEY: str          # service_role key for backend only
    SUPABASE_ANON_KEY: str

    # AI Configuration
    OPENROUTER_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Global settings instance
settings = Settings()

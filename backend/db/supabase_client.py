import os
import warnings
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

supabase = None

if not SUPABASE_URL or not SUPABASE_KEY:
    warnings.warn(
        "SUPABASE_URL or SUPABASE_KEY environment variables are not set. "
        "Supabase client will not be available.",
        UserWarning,
        stacklevel=2,
    )
else:
    try:
        from supabase import create_client, Client

        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as exc:
        warnings.warn(
            f"Failed to initialise Supabase client: {exc}",
            UserWarning,
            stacklevel=2,
        )


def get_client():
    """Return the Supabase client, or None if unavailable."""
    return supabase

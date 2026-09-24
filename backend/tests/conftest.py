import pytest
import os


@pytest.fixture(autouse=True)
def set_test_env_vars():
    """Set required environment variables for testing."""
    os.environ["GOOGLE_CLIENT_ID"] = "test_client_id"
    os.environ["GOOGLE_CLIENT_SECRET"] = "test_client_secret"
    os.environ["GOOGLE_REDIRECT_URI"] = "http://localhost:5173/auth/callback"
    os.environ["ANTHROPIC_API_KEY"] = "test_anthropic_key"
    os.environ["GCP_PROJECT_ID"] = "test_project_id"
    os.environ["PUBSUB_TOPIC"] = "test_topic"
    os.environ["SESSION_SECRET"] = "test_secret"
    
    yield
    
    # Clean up
    for key in os.environ.copy():
        if key in ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", 
                   "ANTHROPIC_API_KEY", "GCP_PROJECT_ID", "PUBSUB_TOPIC", "SESSION_SECRET"]:
            del os.environ[key]

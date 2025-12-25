"""
Session Cache for FreshLogic
Caches analysis results for fast follow-up chat queries
"""
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import threading
import uuid

class SessionCache:
    def __init__(self, ttl_minutes: int = 30):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self.ttl = timedelta(minutes=ttl_minutes)
    
    def create_session(self) -> str:
        """Create a new session and return its ID."""
        session_id = str(uuid.uuid4())
        with self._lock:
            self._cache[session_id] = {
                "data": None,
                "created": datetime.now(),
                "expires": datetime.now() + self.ttl
            }
        return session_id
    
    def set(self, session_id: str, data: dict) -> str:
        """Store data in session. Creates session if doesn't exist."""
        with self._lock:
            if session_id not in self._cache:
                session_id = str(uuid.uuid4())
            self._cache[session_id] = {
                "data": data,
                "created": datetime.now(),
                "expires": datetime.now() + self.ttl
            }
        return session_id
    
    def get(self, session_id: str) -> Optional[dict]:
        """Retrieve cached data if session exists and not expired."""
        with self._lock:
            if session_id in self._cache:
                entry = self._cache[session_id]
                if datetime.now() < entry["expires"]:
                    # Extend TTL on access
                    entry["expires"] = datetime.now() + self.ttl
                    return entry["data"]
                # Expired - clean up
                del self._cache[session_id]
            return None
    
    def cleanup(self):
        """Remove expired sessions."""
        with self._lock:
            now = datetime.now()
            expired = [sid for sid, entry in self._cache.items() 
                      if now >= entry["expires"]]
            for sid in expired:
                del self._cache[sid]

# Singleton instance
session_cache = SessionCache()

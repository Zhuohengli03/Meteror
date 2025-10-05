"""Cache service for API responses."""

import json
import asyncio
from typing import Any, Optional
from datetime import datetime, timedelta
import redis.asyncio as redis
from ..config import settings


class CacheService:
    """Cache service using Redis or in-memory fallback."""
    
    def __init__(self):
        self.redis_client = None
        self.memory_cache = {}
        self.use_redis = bool(settings.redis_url)
    
    async def initialize(self):
        """Initialize cache service."""
        if self.use_redis:
            try:
                self.redis_client = redis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                # Test connection
                await self.redis_client.ping()
                print("Redis cache connected successfully")
            except Exception as e:
                print(f"Failed to connect to Redis: {e}")
                print("Falling back to in-memory cache")
                self.use_redis = False
                self.redis_client = None
        else:
            print("Using in-memory cache")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            if self.use_redis and self.redis_client:
                value = await self.redis_client.get(key)
                if value:
                    return json.loads(value)
            else:
                # In-memory cache
                if key in self.memory_cache:
                    entry = self.memory_cache[key]
                    if entry['expires_at'] > datetime.now():
                        return entry['value']
                    else:
                        del self.memory_cache[key]
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600):
        """Set value in cache with TTL."""
        try:
            if self.use_redis and self.redis_client:
                await self.redis_client.setex(
                    key, 
                    ttl, 
                    json.dumps(value, default=str)
                )
            else:
                # In-memory cache
                expires_at = datetime.now() + timedelta(seconds=ttl)
                self.memory_cache[key] = {
                    'value': value,
                    'expires_at': expires_at
                }
                
                # Clean up expired entries periodically
                if len(self.memory_cache) > settings.cache_max_size:
                    await self._cleanup_memory_cache()
        except Exception as e:
            print(f"Cache set error: {e}")
    
    async def delete(self, key: str):
        """Delete value from cache."""
        try:
            if self.use_redis and self.redis_client:
                await self.redis_client.delete(key)
            else:
                # In-memory cache
                if key in self.memory_cache:
                    del self.memory_cache[key]
        except Exception as e:
            print(f"Cache delete error: {e}")
    
    async def clear(self):
        """Clear all cache entries."""
        try:
            if self.use_redis and self.redis_client:
                await self.redis_client.flushdb()
            else:
                # In-memory cache
                self.memory_cache.clear()
        except Exception as e:
            print(f"Cache clear error: {e}")
    
    async def _cleanup_memory_cache(self):
        """Clean up expired entries from memory cache."""
        now = datetime.now()
        expired_keys = [
            key for key, entry in self.memory_cache.items()
            if entry['expires_at'] <= now
        ]
        for key in expired_keys:
            del self.memory_cache[key]
    
    def is_connected(self) -> bool:
        """Check if cache is connected."""
        if self.use_redis:
            return self.redis_client is not None
        return True  # Memory cache is always available
    
    async def get_stats(self) -> dict:
        """Get cache statistics."""
        try:
            if self.use_redis and self.redis_client:
                info = await self.redis_client.info()
                return {
                    "type": "redis",
                    "connected": True,
                    "memory_used": info.get("used_memory_human", "unknown"),
                    "keys": info.get("db0", {}).get("keys", 0)
                }
            else:
                return {
                    "type": "memory",
                    "connected": True,
                    "keys": len(self.memory_cache),
                    "max_size": settings.cache_max_size
                }
        except Exception as e:
            return {
                "type": "unknown",
                "connected": False,
                "error": str(e)
            }
    
    async def close(self):
        """Close cache connections."""
        if self.redis_client:
            await self.redis_client.close()

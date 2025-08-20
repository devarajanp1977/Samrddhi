"""
Authentication and authorization management for Samrddhi
"""

import os
import jwt
import bcrypt
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import redis.asyncio as redis
from pydantic import BaseModel

from .utils import get_environment_config


class UserModel(BaseModel):
    user_id: str
    username: str
    email: str
    role: str = "user"
    created_at: datetime
    last_login: Optional[datetime] = None


class TokenModel(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthManager:
    """Handles authentication and authorization"""
    
    def __init__(self):
        self.config = get_environment_config()
        self.secret_key = self.config.get('JWT_SECRET_KEY', 'default-secret-key')
        self.algorithm = self.config.get('JWT_ALGORITHM', 'HS256')
        self.access_token_expire_minutes = int(self.config.get('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', 30))
        self.refresh_token_expire_days = int(self.config.get('JWT_REFRESH_TOKEN_EXPIRE_DAYS', 7))
        
        # Redis for token blacklisting and session management
        self.redis_client = None
        try:
            redis_host = self.config.get('REDIS_HOST', 'localhost')
            redis_port = int(self.config.get('REDIS_PORT', 6379))
            redis_db = int(self.config.get('REDIS_DB', 0))
            self.redis_client = redis.from_url(f"redis://{redis_host}:{redis_port}/{redis_db}")
        except Exception as e:
            print(f"Redis connection failed: {e}")
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire, "type": "access"})
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    async def validate_token(self, token: str) -> Dict[str, Any]:
        """Validate JWT token and return payload"""
        try:
            # Check if token is blacklisted
            if self.redis_client:
                is_blacklisted = await self.redis_client.get(f"blacklist:{token}")
                if is_blacklisted:
                    raise jwt.InvalidTokenError("Token has been revoked")
            
            # Decode token
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Validate token type
            if payload.get("type") != "access":
                raise jwt.InvalidTokenError("Invalid token type")
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise jwt.InvalidTokenError("Token has expired")
        except jwt.JWTError:
            raise jwt.InvalidTokenError("Invalid token")
    
    async def refresh_access_token(self, refresh_token: str) -> Optional[TokenModel]:
        """Refresh access token using refresh token"""
        try:
            # Validate refresh token
            payload = jwt.decode(refresh_token, self.secret_key, algorithms=[self.algorithm])
            
            if payload.get("type") != "refresh":
                return None
            
            # Create new access token
            user_data = {
                "user_id": payload.get("user_id"),
                "username": payload.get("username"),
                "role": payload.get("role", "user")
            }
            
            access_token = self.create_access_token(user_data)
            new_refresh_token = self.create_refresh_token(user_data)
            
            return TokenModel(
                access_token=access_token,
                refresh_token=new_refresh_token,
                expires_in=self.access_token_expire_minutes * 60
            )
            
        except jwt.JWTError:
            return None
    
    async def revoke_token(self, token: str) -> bool:
        """Add token to blacklist"""
        if not self.redis_client:
            return False
        
        try:
            # Decode to get expiration
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm], options={"verify_exp": False})
            exp = payload.get("exp", 0)
            
            # Calculate TTL until token expires
            now = datetime.now(timezone.utc).timestamp()
            ttl = max(0, int(exp - now))
            
            if ttl > 0:
                await self.redis_client.setex(f"blacklist:{token}", ttl, "revoked")
            
            return True
            
        except Exception:
            return False
    
    async def create_user_session(self, user_id: str, session_data: Dict[str, Any]) -> str:
        """Create user session"""
        session_id = secrets.token_urlsafe(32)
        
        if self.redis_client:
            session_key = f"session:{user_id}:{session_id}"
            session_data["created_at"] = datetime.now(timezone.utc).isoformat()
            session_data["session_id"] = session_id
            
            # Store session for 24 hours
            await self.redis_client.setex(
                session_key,
                24 * 60 * 60,  # 24 hours
                str(session_data)
            )
        
        return session_id
    
    async def get_user_session(self, user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Get user session data"""
        if not self.redis_client:
            return None
        
        try:
            session_key = f"session:{user_id}:{session_id}"
            session_data = await self.redis_client.get(session_key)
            
            if session_data:
                return eval(session_data.decode())  # In production, use proper JSON parsing
            
        except Exception:
            pass
        
        return None
    
    async def revoke_user_session(self, user_id: str, session_id: str) -> bool:
        """Revoke user session"""
        if not self.redis_client:
            return False
        
        try:
            session_key = f"session:{user_id}:{session_id}"
            await self.redis_client.delete(session_key)
            return True
        except Exception:
            return False
    
    def generate_api_key(self, user_id: str) -> str:
        """Generate API key for programmatic access"""
        timestamp = int(datetime.now(timezone.utc).timestamp())
        api_key_data = {
            "user_id": user_id,
            "timestamp": timestamp,
            "type": "api_key"
        }
        
        return jwt.encode(api_key_data, self.secret_key, algorithm=self.algorithm)
    
    async def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate API key"""
        try:
            payload = jwt.decode(api_key, self.secret_key, algorithms=[self.algorithm])
            
            if payload.get("type") != "api_key":
                return None
            
            return payload
            
        except jwt.JWTError:
            return None
    
    def has_permission(self, user_role: str, required_permission: str) -> bool:
        """Check if user role has required permission"""
        role_permissions = {
            "admin": ["*"],  # Admin has all permissions
            "trader": [
                "trading:read",
                "trading:write",
                "portfolio:read",
                "portfolio:write",
                "orders:read",
                "orders:write",
                "market_data:read",
                "analytics:read"
            ],
            "viewer": [
                "portfolio:read",
                "orders:read",
                "market_data:read",
                "analytics:read"
            ],
            "user": [
                "portfolio:read",
                "market_data:read"
            ]
        }
        
        permissions = role_permissions.get(user_role, [])
        
        # Admin has all permissions
        if "*" in permissions:
            return True
        
        return required_permission in permissions


# Dependency for FastAPI routes
async def get_auth_manager() -> AuthManager:
    """Get AuthManager instance"""
    return AuthManager()

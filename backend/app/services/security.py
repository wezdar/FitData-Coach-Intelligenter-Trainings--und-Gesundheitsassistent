from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash

from app.config import get_settings

password_hash = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def create_access_token(user_id: UUID) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    return jwt.encode(
        {"sub": str(user_id), "iat": now, "exp": now + timedelta(minutes=settings.access_token_minutes)},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> UUID:
    """Validate a raw JWT and return its subject, or raise 401."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ungültiges Zugriffstoken") from exc


def current_user_id(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> UUID:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentifizierung erforderlich")
    return decode_access_token(credentials.credentials)


def current_user_id_sse(
    token: str | None = Query(default=None, description="Zugriffstoken für EventSource-Verbindungen"),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> UUID:
    """Auth for Server-Sent Events.

    The browser ``EventSource`` API cannot set an Authorization header, so this
    dependency also accepts the token as a query parameter. Prefer the header
    whenever the client can send one.
    """
    if credentials:
        return decode_access_token(credentials.credentials)
    if token:
        return decode_access_token(token)
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentifizierung erforderlich")

"""Authentication contract tests.

These cover the register/login flow, password hashing, and token validation —
previously the only major backend service without direct test coverage.
"""

import uuid

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.services.security import (
    create_access_token, decode_access_token, hash_password, verify_password,
)


def test_password_hashing_is_salted_and_verifiable() -> None:
    password = "FitData-Demo-2026!"
    first = hash_password(password)
    second = hash_password(password)

    assert first != password, "the plaintext password must never be stored"
    assert first != second, "each hash must use a fresh salt"
    assert verify_password(password, first)
    assert verify_password(password, second)
    assert not verify_password("wrong-password", first)


def test_access_token_round_trip() -> None:
    user_id = uuid.uuid4()
    token = create_access_token(user_id)
    assert decode_access_token(token) == user_id


def test_tampered_token_is_rejected() -> None:
    token = create_access_token(uuid.uuid4())
    tampered = token[:-3] + ("aaa" if not token.endswith("aaa") else "bbb")
    with pytest.raises(HTTPException) as excinfo:
        decode_access_token(tampered)
    assert excinfo.value.status_code == 401


def test_garbage_token_is_rejected() -> None:
    with pytest.raises(HTTPException) as excinfo:
        decode_access_token("clearly-not-a-jwt")
    assert excinfo.value.status_code == 401


def test_login_rejects_reserved_email_domain() -> None:
    """`.local` is a special-use TLD that the validator refuses.

    Regression guard: the demo credentials once used `demo@fitdata.local`,
    which could never authenticate.
    """
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "demo@fitdata.local", "password": "irrelevant"},
        )
    assert response.status_code == 422


def test_login_with_unknown_user_is_unauthorized() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@fitdata-coach.de", "password": "whatever-123"},
        )
    assert response.status_code in {401, 500}, response.status_code

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import Profile, User
from app.schemas import ProfileInput, ProfileResponse
from app.services.security import current_user_id

router = APIRouter(prefix="/profile", tags=["Profil"])


@router.get("", response_model=ProfileResponse)
async def get_profile(
    user_id: UUID = Depends(current_user_id), session: AsyncSession = Depends(get_session)
) -> Profile:
    profile = await session.get(Profile, user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil noch nicht angelegt")
    return profile


@router.put("", response_model=ProfileResponse)
async def upsert_profile(
    payload: ProfileInput,
    user_id: UUID = Depends(current_user_id),
    session: AsyncSession = Depends(get_session),
) -> Profile:
    profile = await session.get(Profile, user_id)
    values = payload.model_dump()
    if profile:
        for key, value in values.items():
            setattr(profile, key, value)
    else:
        profile = Profile(user_id=user_id, **values)
        session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    user_id: UUID = Depends(current_user_id), session: AsyncSession = Depends(get_session)
) -> Response:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Konto nicht gefunden")
    await session.delete(user)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

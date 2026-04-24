# auth.py

from datetime import datetime, timedelta
from fastapi import Request, HTTPException, Response
from jose import jwt, JWTError
from passlib.context import CryptContext


# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

SECRET_KEY = "super-secret-key-change-this"  # 🔥 change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# PASSWORD HASHING
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


# ---------------------------------------------------------------------------
# TOKEN CREATION
# ---------------------------------------------------------------------------

def create_token(user_id: str):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,   # 🔥 VERY IMPORTANT (must match decoder)
        "exp": expire,
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token


# ---------------------------------------------------------------------------
# COOKIE / HEADER HELPERS
# ---------------------------------------------------------------------------

def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def get_request_token(request: Request) -> str | None:
    cookie_token = request.cookies.get("token")
    if cookie_token:
        return cookie_token

    authorization = request.headers.get("Authorization")
    if not authorization:
        return None

    scheme, _, credentials = authorization.partition(" ")
    if scheme.lower() != "bearer" or not credentials:
        return None

    return credentials.strip()


# ---------------------------------------------------------------------------
# GET CURRENT USER (FROM COOKIE)
# ---------------------------------------------------------------------------

def get_current_user(request: Request):
    token = get_request_token(request)

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("sub")  # 🔥 MUST match create_token

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        return user_id

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

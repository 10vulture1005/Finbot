from app.core.security import hash_password
from app.models.user import User
from app.core.security import verify_password, create_access_token




def signin(db, email: str, password: str) -> str:
  
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise ValueError("Invalid email or password")

    # if not user.is_active:
    #     raise ValueError("User account is not active")

    if not verify_password(password, user.hashed_password):

        raise ValueError("Invalid email or password")

    # Create JWT token
    token = create_access_token(
        {"sub": str(user.id)}
    )

    return token

def signup(db,name, email, password, is_active=False):
    if db.query(User).filter(User.email == email).first():
        raise ValueError("User already exists")

    user = User(
        email=email,
        name=name,
        hashed_password=hash_password(password),
        is_active=is_active,
    )
    print(user)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def activate_user(db, user_id: int):
    user = db.query(User).get(user_id)
    if not user:
        raise ValueError("User not found")

    user.is_active = True
    db.commit()
    db.refresh(user)
    return user

from app.core.security import hash_password
from app.models.user import User
from app.core.security import verify_password, create_access_token

def get_user_by_email(db, email: str):
    return db.query(User).filter(User.email == email).first()

def signin(db, email: str, password: str):
  
    user = get_user_by_email(db, email)
    
    if not user:
        raise ValueError("Invalid email or password")

    # if not user.is_active:
    #     raise ValueError("User account is not active")

    if not verify_password(password, user.hashed_password):

        raise ValueError("Invalid email or password")

    return user

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

import getpass

from app.core.security import hash_password
from app.db.core import Base, SessionLocal, engine
from app.db.models import User, UserRole
from app.services.users import unique_login_id


def main() -> None:
    Base.metadata.create_all(bind=engine)
    first = input("First name: ").strip()
    last = input("Last name: ").strip()
    email = input("Email: ").strip()
    password = getpass.getpass("Password (min 8 chars): ")
    assert len(password) >= 8, "Password too short"

    with SessionLocal() as db:
        admin = User(
            login_id=unique_login_id(db, UserRole.ADMIN),
            first_name=first,
            last_name=last,
            email=email,
            role=UserRole.ADMIN,
            password_hash=hash_password(password),
            must_change_password=False,
        )
        db.add(admin)
        db.commit()
        print(f"Admin created. Login ID: {admin.login_id}")


if __name__ == "__main__":
    main()
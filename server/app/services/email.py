import logging
import smtplib
from urllib.parse import urlsplit, urlunsplit

from email.message import EmailMessage

from app.core.config import settings
from app.db.models import UserRole

logger = logging.Logger(__name__)


def _portal_login_url(role: UserRole) -> str:
    portal = {
        UserRole.ADMIN: "admin",
        UserRole.TEACHER: "teachers",
        UserRole.STUDENT: "students",
    }[role]
    parts = urlsplit(settings.app_login_url)
    hostname = parts.hostname
    if not hostname:
        raise ValueError("APP_LOGIN_URL must include a hostname")

    for existing_portal in ("admin", "teachers", "students"):
        prefix = f"{existing_portal}."
        if hostname.startswith(prefix):
            hostname = hostname[len(prefix):]
            break
    netloc = f"{portal}.{hostname}"
    if parts.port:
        netloc = f"{netloc}:{parts.port}"
    path = parts.path if parts.path and parts.path != "/" else "/login"
    return urlunsplit((parts.scheme, netloc, path, parts.query, parts.fragment))


# function to send login emails
def send_email(
        to: str,
        subject: str,
        body: str
) -> None:
    msg = EmailMessage()
    msg["From"] = settings.mail_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(msg)
    except Exception:
        # this runs in a backgroung task: log, never raise into the request cycle
        logger.exception(f"Failed to send email to {to}")


# function to send credentials email
def send_credentials_email(
        to: str,
        recipient_name: str,
        account_holder: str,
        login_id: str,
        temp_password: str,
        role: UserRole,
) -> None:
    body = (
        f"Hello {recipient_name}, \n\n"
        f"An account has been created for, {account_holder}\n\n"
        f"The login ID is: {login_id}\n\n"
        f"Temporary password: {temp_password}\n\n"
        f"Sign in at {_portal_login_url(role)}, you will be asked to choose a "
        f"new password the first time you log in.\n\n"
        f"If you weren't expecting this email, please ignore it."
    )

    send_email(to, "Your lesson planner account", body)
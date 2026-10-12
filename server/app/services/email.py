import logging
import smtplib

from email.message import EmailMessage

from app.core.config import settings

logger = logging.Logger(__name__)

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
        temp_password: str
) -> None:
    body = (
        f"Hello {recipient_name}, \n\n"
        f"An account has been created for, {account_holder}\n\n"
        f"The login ID is: {login_id}\n\n"
        f"Temporary password: {temp_password}\n\n"
        f"Sign in at {settings.app_login_url}, you will be asked to choose a "
        f"new password the first time you log in.\n\n"
        f"If you weren't expecting this email, please ignore it."
    )

    send_email(to, "Your Lesson Planner Account", body)
# core/services/email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
from models.users import User

load_dotenv()

# Get Config from .env (with defaults just in case)
SMTP_SERVER = os.getenv("MAIL_SERVER", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("MAIL_PORT", 587))
SMTP_USERNAME = os.getenv("MAIL_USERNAME")
SMTP_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM", "no-reply@bukcare.com")

def send_email(to: str, subject: str, body: str):
    """Generic email sender using SMTP (Brevo)."""
    msg = MIMEMultipart()
    msg["From"] = f"BukCare System <{MAIL_FROM}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain")) 

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            print(f"Email sent successfully to {to}")
            return True
    except Exception as e:
        print(f"Failed to send email to {to}: {e}")
        return False

def send_doctor_approval_email(user: User):
    """Sends approval email to a doctor."""
    subject = "Your Doctor Account Has Been Approved"
    body = f"""
Hi {user.fname},

Congratulations! Your doctor account has been approved.
You can now log in and start using your account.

Regards,
BukCare Team
"""
    send_email(to=user.email, subject=subject, body=body)

def send_doctor_rejection_email(user: User, reason: str = None):
    """Sends rejection email to a doctor."""
    subject = "Your Doctor Account Has Been Rejected"
    body = f"""
Hi {user.fname},

We're sorry to inform you that your doctor account has been rejected.
{f'Reason: {reason}' if reason else ''}

Regards,
BukCare Team
"""
    send_email(to=user.email, subject=subject, body=body)
# core/email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings  # EMAIL_HOST_USER & EMAIL_HOST_PASSWORD
from models.users import User

def send_email(to: str, subject: str, body: str):
    """Generic email sender using SMTP."""
    msg = MIMEMultipart()
    msg["From"] = settings.EMAIL_HOST_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            server.send_message(msg)
            print(f"✅ Email sent to {to}")
    except Exception as e:
        print(f"❌ Failed to send email to {to}: {e}")

def send_doctor_approval_email(user: User):
    """Sends approval email to a doctor."""
    subject = "Your Doctor Account Has Been Approved ✅"
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
    subject = "Your Doctor Account Has Been Rejected ❌"
    body = f"""
Hi {user.fname},

We're sorry to inform you that your doctor account has been rejected.
{f'Reason: {reason}' if reason else ''}

Regards,
BukCare Team
"""
    send_email(to=user.email, subject=subject, body=body)

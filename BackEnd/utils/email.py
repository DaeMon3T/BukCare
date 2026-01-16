from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr, BaseModel
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
# Note: Pydantic v2 requires this structure for ConnectionConfig
class EmailConfig(BaseModel):
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD")
    MAIL_FROM: str = os.getenv("MAIL_FROM")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp-relay.brevo.com")
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True

# Initialize Config
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM", "no-reply@bukcare.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp-relay.brevo.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

class EmailService:
    @staticmethod
    async def send_email(recipients: List[EmailStr], subject: str, body: str):
        """
        Sends an email in the background using FastAPI-Mail.
        """
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=body,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        return True

    @staticmethod
    def get_appointment_template(action: str, user_name: str, doctor_name: str, date: str, time: str, reason: str = ""):
        """
        Generates Premium HTML templates.
        """
        dashboard_link = "www.bukcare.com"
        
        icons = {
            "request": "https://img.icons8.com/fluency/96/calendar-plus.png",
            "approved": "https://img.icons8.com/fluency/96/verified-account.png",
            "cancelled": "https://img.icons8.com/fluency/96/cancel.png",
            "rescheduled": "https://img.icons8.com/fluency/96/overtime.png",
            "completed": "https://img.icons8.com/fluency/96/guarantee.png",
            "default": "https://img.icons8.com/fluency/96/info.png" 
        }

        colors = {
            "primary": "#2563EB",
            "success": "#059669",
            "danger": "#DC2626",
            "warning": "#D97706",
            "bg_gray": "#F3F4F6"
        }

        title = ""
        headline_color = colors["primary"]
        main_icon = icons["default"]
        message_body = ""
        button_text = "View Dashboard"
        button_color = colors["primary"]

        if action == "request":
            title = "New Appointment Request"
            headline_color = "#1E293B"
            main_icon = icons["request"]
            message_body = f"""
                <p><strong>Dr. {doctor_name}</strong>,</p>
                <p>You have received a new booking request from <strong>{user_name}</strong>.</p>
                <p>Please review the details below and approve or decline.</p>
            """
            button_text = "Review Request"

        elif action == "approved":
            title = "Appointment Confirmed"
            headline_color = colors["success"]
            main_icon = icons["approved"]
            message_body = f"""
                <p>Hi <strong>{user_name}</strong>,</p>
                <p>Great news! Your appointment with <strong>Dr. {doctor_name}</strong> has been officially confirmed.</p>
                <p>Please arrive 10 minutes early for check-in.</p>
            """
            button_color = colors["success"]

        elif action == "cancelled":
            title = "Appointment Cancelled"
            headline_color = colors["danger"]
            main_icon = icons["cancelled"]
            message_body = f"""
                <p>Hi <strong>{user_name}</strong>,</p>
                <p>We regret to inform you that the appointment with <strong>Dr. {doctor_name}</strong> has been cancelled.</p>
                <p style="color: #DC2626; font-weight: bold;">Reason: {reason}</p>
            """
            button_text = "Reschedule Now"
            button_color = "#64748B"

        elif action == "rescheduled":
            title = "Schedule Updated"
            headline_color = colors["warning"]
            main_icon = icons["rescheduled"]
            message_body = f"""
                <p>Hi <strong>{user_name}</strong>,</p>
                <p>Your appointment with <strong>Dr. {doctor_name}</strong> has been moved to a new time slot.</p>
                <p>Please check the new details below.</p>
            """
            button_color = colors["warning"]

        elif action == "completed":
            title = "Visit Completed"
            headline_color = colors["primary"]
            main_icon = icons["completed"]
            message_body = f"""
                <p>Hi <strong>{user_name}</strong>,</p>
                <p>Your visit with <strong>Dr. {doctor_name}</strong> has been marked as completed.</p>
                <p>Thank you for trusting BukCare with your health journey.</p>
            """
            button_text = "Leave a Review"

        # HTML STRUCTURE
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: {colors['bg_gray']}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                            
                            <tr>
                                <td style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); padding: 35px 30px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; font-weight: 700;">BukCare</h1>
                                    <p style="color: #BFDBFE; margin: 8px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Medical Appointment System</p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 40px 30px;">
                                    
                                    <div style="text-align: center; margin-bottom: 25px;">
                                        <img src="{main_icon}" width="80" alt="Status Icon" style="display: block; margin: 0 auto;" />
                                    </div>

                                    <div style="text-align: center; margin-bottom: 25px;">
                                        <h2 style="color: {headline_color}; margin: 0; font-size: 22px; font-weight: 700;">{title}</h2>
                                    </div>

                                    <div style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                                        {message_body}
                                    </div>

                                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 30px;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td width="40" valign="top"><img src="https://img.icons8.com/ios-filled/50/64748b/calendar--v1.png" width="20" style="margin-top: 2px;"></td>
                                                        <td style="padding-bottom: 15px;">
                                                            <p style="margin: 0; font-size: 12px; color: #94A3B8; text-transform: uppercase; font-weight: bold;">Date</p>
                                                            <p style="margin: 5px 0 0; font-size: 16px; color: #1E293B; font-weight: 600;">{date}</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td width="40" valign="top"><img src="https://img.icons8.com/ios-filled/50/64748b/clock--v1.png" width="20" style="margin-top: 2px;"></td>
                                                        <td style="padding-bottom: 15px;">
                                                            <p style="margin: 0; font-size: 12px; color: #94A3B8; text-transform: uppercase; font-weight: bold;">Time</p>
                                                            <p style="margin: 5px 0 0; font-size: 16px; color: #1E293B; font-weight: 600;">{time}</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td width="40" valign="top"><img src="https://img.icons8.com/ios-filled/50/64748b/activity-feed-2.png" width="20" style="margin-top: 2px;"></td>
                                                        <td>
                                                            <p style="margin: 0; font-size: 12px; color: #94A3B8; text-transform: uppercase; font-weight: bold;">Reason / Notes</p>
                                                            <p style="margin: 5px 0 0; font-size: 16px; color: #1E293B;">{reason if reason else "General Consultation"}</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <div style="text-align: center;">
                                        <a href="{dashboard_link}" style="background-color: {button_color}; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                            {button_text}
                                        </a>
                                    </div>

                                </td>
                            </tr>

                            <tr>
                                <td style="background-color: #F1F5F9; padding: 25px; text-align: center; border-top: 1px solid #E2E8F0;">
                                    <p style="color: #64748B; font-size: 13px; margin: 0;">&copy; 2026 BukCare System. All rights reserved.</p>
                                    <p style="color: #94A3B8; font-size: 12px; margin: 5px 0 0;">Malaybalay City, Bukidnon, Philippines</p>
                                </td>
                            </tr>

                        </table>
                        
                        <div style="height: 40px;"></div>

                    </td>
                </tr>
            </table>

        </body>
        </html>
        """
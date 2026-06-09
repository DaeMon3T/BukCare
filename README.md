# Capstone Project – BukCare

BukCare is an **online hospital appointment system** with multiple user interfaces:
- **Patient** – Book and manage appointments online
- **Doctor** – View and manage appointments, check schedules
- **Admin** – Manage users, Invite doctor and overall system settings

The system is built with:
- **Frontend:** React + Tailwind CSS
- **Backend:** FastApi
- **Database:** PostgreSQL
- **Reverse Proxy & Load Balancer:** Nginx
- **Containerization:** Docker & Docker Compose

---

## Features

### Authentication & Authorization
- User registration and login (email/password)
- Google OAuth login
- OTP verification for email or phone (optional)
- Role-based access control (Patient, Doctor, Staff, Admin)
- Password reset via email

### Patient
- Book, view, and cancel appointments
- View appointment history
- Update personal profile and profile picture
- Receive notifications for upcoming appointments

### Doctor
- View scheduled appointments
- Manage appointment status (pending, confirmed, completed)
- Update profile information
- Receive appointment notifications

### Staff
Staff members act as clinic assistants or front-desk personnel, helping doctors manage daily operations. Their purpose includes:
- **Clinic Operation Support:** Assisting doctors with administrative tasks through a delegated access system.
- **Walk-in Management:** Registering new patients on-site and managing the daily walk-in queue.
- **Delegated Scheduling:** Booking and managing appointments for doctors who have granted them permission.
- **Patient Onboarding:** Creating accounts for patients who visit the clinic in person.
- **Front-Desk Coordination:** Overseeing the daily flow of patients and assisting with record updates.

---

### Admin
- **System Oversight:** Manage all users (Patients, Doctors, Staff) and system-wide settings.
- **Verification:** Approve or reject doctor and staff license/proof submissions.
- **Analytics:** Access reports and system analytics to monitor platform usage.
- **Security:** Assign roles, manage permissions, and ensure system integrity.

---

## Project Structure


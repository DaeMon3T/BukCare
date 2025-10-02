# Capstone Project – BukCare

BukCare is an **online hospital appointment system** with multiple user interfaces:
- **Patient** – Book and manage appointments online
- **Doctor** – View and manage appointments, check schedules
- **Staff** – Handle walk-in appointments and assist patients
- **Admin** – Manage users, Invite doctor and overall system settings

The system is built with:
- **Frontend:** React + Tailwind CSS
- **Backend:** FastApi
- **Database:** PostgreSQL
- **Reverse Proxy & Load Balancer:** Nginx
- **Containerization:** Docker & Docker Compose

---

## 🚀 Features

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
- Handle walk-in patients
- Assist patients in booking appointments
- Update patient records

### Admin
- Manage users (Patients, Doctors, Staff)
- Assign roles and permissions
- Oversee appointments across all users
- Access reports and system analytics

---

## 🏗 Project Structure


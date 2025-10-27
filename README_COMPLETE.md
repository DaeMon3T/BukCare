# 🏥 BukCare - Complete Healthcare Management System

## 📋 **Overview**

BukCare is a comprehensive healthcare management system that connects patients with doctors for online appointments. The system features role-based access control, real-time notifications, appointment scheduling, and a complete admin panel.

## 🏗️ **Architecture**

### **Backend (FastAPI + Python)**
- **Framework**: FastAPI with async support
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT with refresh tokens
- **Security**: Rate limiting, CORS, input validation
- **Documentation**: Auto-generated OpenAPI/Swagger docs

### **Frontend (React + TypeScript)**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Routing**: React Router v6

## 🚀 **Quick Start**

### **Option 1: Complete Startup (Recommended)**
```bash
# Start everything with one command
./start_complete.sh

# Stop everything
./stop_complete.sh
```

### **Option 2: Manual Startup**
```bash
# Terminal 1 - Backend
./start_backend.sh

# Terminal 2 - Frontend  
./start_frontend.sh

# Terminal 3 - Test connection
python3 test_connection.py
```

## 📁 **Project Structure**

```
BukCare/
├── BackEnd/                    # FastAPI Backend
│   ├── core/                   # Core configuration
│   │   ├── config.py          # Settings and environment
│   │   ├── database.py        # Database connection
│   │   ├── security.py        # JWT and password handling
│   │   └── logging_config.py  # Structured logging
│   ├── models/                 # SQLAlchemy models
│   │   ├── users.py           # User and role models
│   │   ├── doctor.py          # Doctor and availability models
│   │   ├── appointment.py     # Appointment model
│   │   ├── notification.py    # Notification model
│   │   └── location.py        # Location models
│   ├── routers/v1/            # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── doctors.py         # Doctor management
│   │   ├── appointments.py    # Appointment management
│   │   ├── notifications.py   # Notification system
│   │   ├── schedules.py       # Schedule management
│   │   ├── patient/           # Patient endpoints
│   │   └── admin/             # Admin endpoints
│   ├── schemas/               # Pydantic schemas
│   ├── middleware/            # Custom middleware
│   │   ├── rate_limiting.py   # Rate limiting
│   │   ├── security.py        # Security middleware
│   │   └── request_logging.py # Request logging
│   └── utils/                 # Utility functions
├── FrontEnd/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React context
│   │   ├── services/          # API services
│   │   ├── routes/            # Route protection
│   │   └── utils/             # Utility functions
│   └── public/                # Static assets
├── Database/                   # Database setup
├── Postgres/                   # PostgreSQL configuration
└── docs/                       # Documentation
```

## 🔐 **User Roles & Permissions**

### **👑 Admin**
- Manage all users
- Approve/reject doctor applications
- View system statistics
- Manage appointments
- Access admin dashboard

### **👨‍⚕️ Doctor**
- Manage profile and availability
- View and manage appointments
- Update appointment status
- Manage schedule
- View patient information

### **👤 Patient**
- Search and book doctors
- Manage appointments
- View appointment history
- Update profile
- Receive notifications

## 📊 **API Endpoints**

### **Authentication**
```
POST /api/v1/auth/signin          # User login
POST /api/v1/auth/signup          # User registration
POST /api/v1/auth/refresh         # Refresh token
POST /api/v1/auth/logout          # User logout
POST /api/v1/auth/complete-profile # Complete profile
```

### **Doctors**
```
GET  /api/v1/doctors              # List doctors (with filtering)
GET  /api/v1/doctors/{id}         # Get doctor details
POST /api/v1/doctors              # Create doctor profile
PUT  /api/v1/doctors/{id}         # Update doctor profile
GET  /api/v1/doctors/search       # Search doctors
```

### **Appointments**
```
GET  /api/v1/appointments         # List appointments
POST /api/v1/appointments         # Create appointment
PUT  /api/v1/appointments/{id}    # Update appointment
DELETE /api/v1/appointments/{id}  # Cancel appointment
GET  /api/v1/appointments/upcoming # Upcoming appointments
GET  /api/v1/appointments/history # Appointment history
```

### **Notifications**
```
GET  /api/v1/notifications        # Get notifications
PATCH /api/v1/notifications/{id}/read # Mark as read
DELETE /api/v1/notifications/{id} # Delete notification
PATCH /api/v1/notifications/mark-all-read # Mark all read
GET  /api/v1/notifications/unread-count # Unread count
```

### **Schedules**
```
GET  /api/v1/schedules            # Get schedules
POST /api/v1/schedules            # Create schedule
PUT  /api/v1/schedules/{id}       # Update schedule
DELETE /api/v1/schedules/{id}     # Delete schedule
GET  /api/v1/schedules/doctor/{id}/available-slots # Available slots
```

### **Admin**
```
GET  /api/v1/admin/users          # List all users
GET  /api/v1/admin/doctors/pending # Pending doctors
PUT  /api/v1/admin/doctors/{id}/approve # Approve doctor
PUT  /api/v1/admin/doctors/{id}/reject # Reject doctor
GET  /api/v1/admin/stats          # Dashboard statistics
PUT  /api/v1/admin/users/{id}/status # Update user status
```

## 🛡️ **Security Features**

### **Authentication & Authorization**
- JWT-based authentication
- Automatic token refresh
- Role-based access control
- Password hashing with bcrypt
- Google OAuth integration

### **Rate Limiting**
- Global: 100 requests/hour
- Auth endpoints: 5 requests/5 minutes
- Signup: 3 requests/5 minutes
- Password reset: 3 requests/5 minutes

### **Security Middleware**
- XSS protection
- SQL injection prevention
- CSRF protection
- Input sanitization
- Security headers

### **Input Validation**
- Comprehensive Pydantic schemas
- File upload validation
- Date/time validation
- Phone number validation
- Email validation

## 📊 **Monitoring & Logging**

### **Structured Logging**
- JSON-formatted logs
- Request/response tracking
- Security event logging
- Performance monitoring
- Error tracking

### **Health Monitoring**
- Health check endpoint (`/health`)
- Database connectivity
- Service status
- Performance metrics

## 🔧 **Configuration**

### **Backend Environment Variables**
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/bukcare

# JWT
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### **Frontend Environment Variables**
```env
# Backend API URL
VITE_API_URL=http://localhost:8000

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# App Configuration
VITE_APP_NAME=BukCare
VITE_APP_VERSION=1.0.0
VITE_DEBUG=true
```

## 🚀 **Deployment**

### **Docker Deployment**
```bash
# Backend
cd BackEnd
docker build -t bukcare-backend .
docker run -p 8000:8000 bukcare-backend

# Database
cd Database
docker-compose up -d
```

### **Production Considerations**
- Use environment-specific configurations
- Set up proper database backups
- Configure reverse proxy (nginx)
- Enable HTTPS
- Set up monitoring and alerting
- Configure log rotation

## 🧪 **Testing**

### **Connection Test**
```bash
python3 test_connection.py
```

### **Manual Testing**
1. **Backend Health**: `curl http://localhost:8000/health`
2. **API Documentation**: Visit `http://localhost:8000/docs`
3. **Frontend**: Visit `http://localhost:5173`

## 📚 **Documentation**

- **API Documentation**: `http://localhost:8000/docs` (Swagger UI)
- **Setup Guide**: `COMPLETE_SETUP_GUIDE.md`
- **Improvements Summary**: `IMPROVEMENTS_SUMMARY.md`

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Backend won't start**
   - Check port 8000 availability
   - Verify environment variables
   - Check database connection

2. **Frontend won't connect**
   - Verify `VITE_API_URL` in `.env.local`
   - Check CORS configuration
   - Ensure backend is running

3. **Database issues**
   - Verify PostgreSQL is running
   - Check database credentials
   - Run migrations: `alembic upgrade head`

4. **Import errors**
   - Activate virtual environment
   - Reinstall dependencies
   - Check Python path

### **Debug Commands**
```bash
# Check logs
tail -f BackEnd/logs/bukcare.log

# Check processes
ps aux | grep uvicorn
ps aux | grep node

# Check ports
netstat -tulpn | grep :8000
netstat -tulpn | grep :5173
```

## 🎯 **Features**

### **✅ Completed Features**
- ✅ User authentication and authorization
- ✅ Role-based access control (Admin, Doctor, Patient)
- ✅ Doctor profile management
- ✅ Appointment scheduling system
- ✅ Real-time notifications
- ✅ Schedule management
- ✅ Admin dashboard
- ✅ Patient management
- ✅ Security middleware
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling
- ✅ Logging and monitoring
- ✅ API documentation
- ✅ Frontend-backend integration

### **🔮 Future Enhancements**
- Video consultation integration
- Payment processing
- Prescription management
- Medical records
- Analytics dashboard
- Mobile app
- Multi-language support

## 📞 **Support**

For issues and questions:
1. Check the troubleshooting section
2. Review the logs
3. Check the API documentation
4. Run the connection test

## 📄 **License**

This project is licensed under the MIT License.

---

**BukCare** - Connecting Healthcare, One Appointment at a Time 🏥✨




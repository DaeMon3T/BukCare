# 🚀 BukCare Complete Setup Guide

## 📋 **Prerequisites**

- Python 3.8+ installed
- Node.js 16+ installed
- PostgreSQL database
- Git installed

## 🔧 **Backend Setup**

### 1. Navigate to Backend Directory
```bash
cd BackEnd
```

### 2. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your actual values
nano .env
```

**Required Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/bukcare

# JWT
SECRET_KEY=your-super-secret-key-here
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

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 5. Database Setup
```bash
# Initialize database
python Postgres/init_db.py

# Run migrations
alembic upgrade head
```

### 6. Start Backend Server
```bash
# Option 1: Using the startup script
../start_backend.sh

# Option 2: Manual start
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:**
- API: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## 🎨 **Frontend Setup**

### 1. Navigate to Frontend Directory
```bash
cd FrontEnd
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy the example environment file
cp env.example .env.local

# Edit .env.local with your actual values
nano .env.local
```

**Required Environment Variables:**
```env
# Backend API URL
VITE_API_URL=http://localhost:8000

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Application Configuration
VITE_APP_NAME=BukCare
VITE_APP_VERSION=1.0.0

# Development Configuration
VITE_DEBUG=true
```

### 4. Start Frontend Server
```bash
# Option 1: Using the startup script
../start_frontend.sh

# Option 2: Manual start
npm run dev
```

**Frontend will be available at:**
- Application: http://localhost:5173

## 🧪 **Testing Connection**

### 1. Run Connection Test
```bash
# From the root directory
python test_connection.py
```

### 2. Manual Testing
1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Frontend Accessibility:**
   Open http://localhost:5173 in your browser

3. **API Documentation:**
   Open http://localhost:8000/docs in your browser

## 🐳 **Docker Setup (Alternative)**

### 1. Backend with Docker
```bash
cd BackEnd
docker build -t bukcare-backend .
docker run -p 8000:8000 bukcare-backend
```

### 2. Database with Docker
```bash
cd Database
docker-compose up -d
```

## 🔍 **Troubleshooting**

### Common Issues:

#### 1. **Backend Won't Start**
- Check if port 8000 is available
- Verify all dependencies are installed
- Check environment variables in `.env`

#### 2. **Frontend Won't Connect to Backend**
- Verify `VITE_API_URL` in `.env.local`
- Check CORS configuration in backend
- Ensure backend is running on correct port

#### 3. **Database Connection Issues**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

#### 4. **Import Errors**
- Activate virtual environment
- Reinstall dependencies: `pip install -r requirements.txt`
- Check Python path

#### 5. **CORS Errors**
- Verify `CORS_ALLOWED_ORIGINS` includes frontend URL
- Check frontend `VITE_API_URL` matches backend URL

### Debug Commands:

```bash
# Check backend logs
tail -f BackEnd/logs/bukcare.log

# Check database connection
psql -h localhost -U username -d bukcare

# Check port usage
netstat -tulpn | grep :8000
netstat -tulpn | grep :5173

# Test API endpoints
curl -X GET http://localhost:8000/api/v1/doctors
```

## 📊 **API Endpoints**

### Authentication
- `POST /api/v1/auth/signin` - User sign in
- `POST /api/v1/auth/signup` - User sign up
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - User logout

### Doctors
- `GET /api/v1/doctors` - Get all doctors
- `GET /api/v1/doctors/{id}` - Get doctor by ID
- `POST /api/v1/doctors` - Create doctor profile

### Appointments
- `GET /api/v1/appointments` - Get appointments
- `POST /api/v1/appointments` - Create appointment
- `PUT /api/v1/appointments/{id}` - Update appointment
- `DELETE /api/v1/appointments/{id}` - Cancel appointment

### Notifications
- `GET /api/v1/notifications` - Get notifications
- `PATCH /api/v1/notifications/{id}/read` - Mark as read
- `DELETE /api/v1/notifications/{id}` - Delete notification

### Admin
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/doctors/pending` - Get pending doctors
- `PUT /api/v1/admin/doctors/{id}/approve` - Approve doctor

## 🎯 **Quick Start Commands**

```bash
# Start everything
./start_backend.sh & ./start_frontend.sh

# Test connection
python test_connection.py

# View logs
tail -f BackEnd/logs/bukcare.log
```

## ✅ **Verification Checklist**

- [ ] Backend starts without errors
- [ ] Frontend loads in browser
- [ ] API documentation accessible
- [ ] Database connection working
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] All dependencies installed
- [ ] Connection test passes

## 🆘 **Getting Help**

1. Check the logs in `BackEnd/logs/`
2. Run the connection test script
3. Verify all environment variables
4. Check the API documentation at `/docs`
5. Review the troubleshooting section above

Your BukCare application should now be running successfully! 🎉

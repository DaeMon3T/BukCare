# BukCare Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 13+
- Docker (optional)

### Backend Setup

1. **Navigate to Backend Directory**
   ```bash
   cd BackEnd
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

5. **Database Setup**
   ```bash
   # Start PostgreSQL service
   # Create database
   createdb bukcare
   
   # Run migrations
   alembic upgrade head
   ```

6. **Start Backend Server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to Frontend Directory**
   ```bash
   cd FrontEnd
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env.local` file:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```

4. **Start Frontend Server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Required Environment Variables

#### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET_KEY`: Secret key for JWT tokens
- `JWT_REFRESH_SECRET_KEY`: Secret key for refresh tokens
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

#### Frontend (.env.local)
- `VITE_API_URL`: Backend API URL
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env
   - Verify database exists

2. **Import Errors**
   - Check Python path
   - Ensure all dependencies are installed
   - Verify virtual environment is activated

3. **CORS Errors**
   - Check CORS_ALLOWED_ORIGINS in backend .env
   - Ensure frontend URL is included

4. **JWT Token Errors**
   - Verify JWT_SECRET_KEY is set
   - Check token expiration settings

5. **Google OAuth Issues**
   - Verify GOOGLE_CLIENT_ID matches in both frontend and backend
   - Check OAuth redirect URI configuration

### Error Logs

- Backend logs: `BackEnd/logs/bukcare.log`
- Check browser console for frontend errors
- Use `--reload` flag for development auto-restart

## 🚀 Production Deployment

### Docker Deployment

1. **Build and Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Environment Variables**
   - Set production environment variables
   - Use secure JWT secrets
   - Configure production database

### Security Checklist

- [ ] Change default JWT secrets
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Monitor application logs

## 📝 Development Notes

### Code Structure
- Backend: FastAPI with SQLAlchemy
- Frontend: React with TypeScript
- Database: PostgreSQL with Alembic migrations
- Authentication: JWT with refresh tokens

### Key Features
- ✅ User authentication (email/password + Google OAuth)
- ✅ Role-based access control
- ✅ Appointment management
- ✅ Doctor profiles and specializations
- ✅ File uploads with Cloudinary
- ✅ Email notifications
- ✅ Real-time updates

### API Endpoints
- Health check: `GET /health`
- Authentication: `/api/v1/auth/*`
- Doctors: `/api/v1/doctors/*`
- Appointments: `/api/v1/appointments/*`

## 🆘 Support

If you encounter issues:
1. Check the error logs
2. Verify environment configuration
3. Ensure all services are running
4. Check network connectivity
5. Review the troubleshooting section above

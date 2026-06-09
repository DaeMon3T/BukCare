# BukCare Backend

This is the FastAPI-based backend for the BukCare Appointment System.

## Prerequisites

- **Python 3.10+**
- **PostgreSQL**
- **Virtual Environment** (recommended)

## Local Setup

1. **Navigate to the Backend directory:**
   ```bash
   cd BackEnd
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment:**
   - **Windows:** `.venv\Scripts\activate`
   - **Linux/macOS:** `source .venv/bin/activate`

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure Environment Variables:**
   - Create a `.env` file in the `BackEnd` directory.
   - You can use the `.env.example` (if available) as a template.
   - Required variables usually include:
     - `DATABASE_URL` (PostgreSQL connection string)
     - `SECRET_KEY` (For JWT)
     - `ALGORITHM` (e.g., HS256)
     - `CLOUDINARY_*` (For image uploads)
     - `MAIL_*` (For email services)

6. **Database Migrations:**
   The project uses Alembic for migrations.
   ```bash
   alembic upgrade head
   ```

7. **Run the Application:**
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

## Key Technologies

- **FastAPI:** High-performance web framework.
- **SQLAlchemy:** SQL Toolkit and ORM.
- **Alembic:** Database migrations.
- **Pydantic:** Data validation using Python type hints.
- **WebSockets:** Real-time communication for chat and notifications.
- **Cloudinary:** Cloud-based image management.

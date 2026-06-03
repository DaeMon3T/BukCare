# Use a lightweight Python image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies (IMPORTANT for psycopg2)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# --- PRODUCTION SECURITY AND PERFORMANCE ADDITIONS ---

# 1. Create the 'bukcare' non-root user for security
RUN useradd -m bukcare && chown -R bukcare:bukcare /app
USER bukcare

# Expose FastAPI port
EXPOSE 8000

# 2. Run Uvicorn with multiple workers for production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

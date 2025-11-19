# Use AWS Lambda base image for Python
FROM public.ecr.aws/lambda/python:3.13

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy application code
COPY . ${LAMBDA_TASK_ROOT}



# Command for Lambda
CMD ["main.handler"]

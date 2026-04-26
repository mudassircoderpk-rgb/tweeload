FROM python:3.11-slim

# =========================
# ENV SETTINGS
# =========================
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# =========================
# WORKDIR
# =========================
WORKDIR /app

# =========================
# SYSTEM DEPENDENCIES
# =========================
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# =========================
# INSTALL PYTHON DEPENDENCIES
# =========================
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# =========================
# COPY PROJECT FILES
# =========================
COPY . .

# =========================
# EXPOSE PORT (optional for Railway)
# =========================
EXPOSE 8000

# =========================
# START COMMAND
# =========================
CMD ["sh", "-c", "gunicorn main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"]
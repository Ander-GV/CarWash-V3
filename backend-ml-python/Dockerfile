# ==========================================
# DOCKERFILE - PYTHON ML MICROSERVICE (FASTAPI)
# ==========================================
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements y preinstalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del modelo predictivo y API
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python:3.13-slim

WORKDIR /app

# Copier les dépendances
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code du backend
COPY . .

# Port de FastAPI
EXPOSE 8000

# Lancer FastAPI
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "src"]
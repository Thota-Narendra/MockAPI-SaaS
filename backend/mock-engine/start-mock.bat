@echo off
ECHO Starting Mock Engine (Port 8001)...
CD /D "%~dp0"
SET DATABASE_URL=mysql+pymysql://user:password@localhost:3306/mockapi_db
SET REDIS_URL=redis://localhost:6379
venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
PAUSE
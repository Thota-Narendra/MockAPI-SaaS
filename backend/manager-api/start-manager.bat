@echo off
ECHO Starting Manager API (Port 8000)...
CD /D "%~dp0"
SET DATABASE_URL=mysql+pymysql://user:password@localhost:3306/mockapi_db
venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
PAUSE
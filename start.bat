@echo off
ECHO Starting MockAPI Enterprise Platform...
ECHO (Ensure MySQL and Redis services are running externally)
ECHO.
REM --- Start Manager API in a new window ---
START "Manager API - Port 8000" CMD /K "backend\manager-api\start-manager.bat"

REM --- Start Mock Engine in a new window ---
START "Mock Engine - Port 8001" CMD /K "backend\mock-engine\start-mock.bat"

REM --- Start Frontend in a new window (CORRECTED LINE) ---
START "React Frontend - Port 3000" CMD /K "frontend\start-frontend.bat"
ECHO.
ECHO All services launched in separate, persistent windows.
ECHO Manager Docs: http://localhost:8000/docs
ECHO Frontend UI: http://localhost:3000/
PAUSE
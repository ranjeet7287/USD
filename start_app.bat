@echo off
echo Starting AI Book Agent...

cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing backend dependencies...
pip install -r requirements.txt

start "AI Book Agent Backend" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"

cd ..\frontend
echo Installing frontend dependencies...
call npm install
echo Starting Frontend...
start "AI Book Agent Frontend" cmd /k "npm run dev"

echo.
echo Application started!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8000
echo.
pause

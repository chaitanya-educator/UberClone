@echo off
REM ============================================
REM UBER CLONE - DOCKER STARTUP SCRIPT (Windows)
REM ============================================

echo.
echo ================================================================
echo          UBER CLONE - DOCKER CONTAINERIZED SETUP
echo ================================================================
echo.

REM Check if Docker is running
echo Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Stop any existing containers
echo Stopping existing containers...
docker-compose down
echo.

REM Build and start containers
echo Building and starting containers...
echo This may take a few minutes on first run...
echo.
docker-compose up --build -d

REM Wait for services
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ================================================================
echo                  ALL SERVICES RUNNING
echo ================================================================
echo.
echo [OK] MongoDB:     http://localhost:27017
echo [OK] Kafka:       http://localhost:9092
echo [OK] Kafka UI:    http://localhost:8080
echo [OK] Backend API: http://localhost:8000
echo [OK] API Docs:    http://localhost:8000/api-docs
echo.
echo ================================================================
echo KAFKA TOPICS AVAILABLE:
echo ================================================================
echo   - journey-requested
echo   - journey-accepted
echo   - journey-started
echo   - journey-completed
echo   - journey-cancelled
echo   - driver-location
echo   - driver-status
echo   - rider-notification
echo   - driver-notification
echo.
echo ================================================================
echo USEFUL COMMANDS:
echo ================================================================
echo   View logs:        docker-compose logs -f backend
echo   View Kafka logs:  docker-compose logs -f kafka
echo   Stop all:         docker-compose down
echo   Restart:          docker-compose restart backend
echo.
echo Press Ctrl+C to stop watching logs...
echo.

REM Follow backend logs
docker-compose logs -f backend

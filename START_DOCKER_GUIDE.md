# 🚀 Complete Docker Setup Guide

## Current Status

✅ **All Docker files created successfully!**
❌ **Docker Desktop is not running**

## What Was Created

### Docker Configuration Files
- ✅ `backend/Dockerfile` - Backend container configuration
- ✅ `backend/docker-compose.yml` - Multi-container orchestration
- ✅ `backend/.dockerignore` - Files to exclude from Docker
- ✅ `backend/.env.docker` - Docker environment variables
- ✅ `backend/docker-start.bat` - Windows startup script
- ✅ `backend/docker-start.sh` - Linux/Mac startup script
- ✅ `backend/test-docker-kafka.sh` - Kafka testing script
- ✅ `backend/DOCKER_README.md` - Complete documentation

### Docker Services Configured
1. **MongoDB** - Database (Port 27017)
2. **Zookeeper** - Kafka coordinator (Port 2181)
3. **Kafka** - Message broker (Port 9092)
4. **Kafka UI** - Web dashboard (Port 8080)
5. **Backend** - Your API (Port 8000)

## 📋 Step-by-Step Instructions

### Step 1: Start Docker Desktop

1. **Open Docker Desktop**
   - Find Docker Desktop in your Start Menu
   - Or search for "Docker Desktop" in Windows search
   - Click to open it

2. **Wait for Docker to Start**
   - You'll see a whale icon in your system tray
   - Wait until it says "Docker Desktop is running"
   - This may take 1-2 minutes

3. **Verify Docker is Running**
   ```powershell
   docker --version
   docker info
   ```

### Step 2: Start All Containers

#### Option A: Using the Batch Script (Recommended)

```powershell
cd backend
.\docker-start.bat
```

#### Option B: Manual Commands

```powershell
cd backend

# Stop any existing containers
docker-compose down

# Build and start all services
docker-compose up --build -d

# Wait for services to start (about 2-3 minutes)
timeout /t 60

# Check status
docker-compose ps
```

### Step 3: Verify Services are Running

```powershell
# Check all containers
docker-compose ps

# You should see 5 containers running:
# - uber-mongodb
# - uber-zookeeper
# - uber-kafka
# - uber-kafka-ui
# - uber-backend
```

### Step 4: Test the Setup

#### Test 1: Check Backend Health

```powershell
curl http://localhost:8000/health
```

Expected response:
```json
{"status":"ok"}
```

#### Test 2: View API Documentation

Open in browser:
```
http://localhost:8000/api-docs
```

#### Test 3: View Kafka UI

Open in browser:
```
http://localhost:8080
```

#### Test 4: Create a Journey (Triggers Kafka Messages)

```powershell
# First, login to get a token
$login = Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"rider@test.com","password":"Test@123"}' `
  -UseBasicParsing

$token = ($login.Content | ConvertFrom-Json).data.token

# Create a journey
Invoke-WebRequest -Uri "http://localhost:8000/api/journey/create" `
  -Method POST `
  -Headers @{
    "Authorization"="Bearer $token"
    "Content-Type"="application/json"
  } `
  -Body '{
    "pickupAddress":"Mumbai Central",
    "pickupCoordinates":[72.8777,19.0760],
    "dropoffAddress":"Bandra West",
    "dropoffCoordinates":[72.8258,19.0596],
    "vehicleType":"CAR",
    "paymentMethod":"CASH"
  }' `
  -UseBasicParsing
```

### Step 5: View Kafka Messages

#### Option A: Using Kafka UI (Easiest)

1. Open http://localhost:8080
2. Click on "Topics" in the left menu
3. Click on "journey-requested"
4. Click on "Messages" tab
5. You'll see the journey message!

#### Option B: Using Command Line

```powershell
# View journey-requested messages
docker-compose exec kafka kafka-console-consumer `
  --bootstrap-server localhost:9092 `
  --topic journey-requested `
  --from-beginning

# Press Ctrl+C to stop
```

### Step 6: View Logs

```powershell
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View Kafka logs only
docker-compose logs -f kafka

# Search for Kafka events
docker-compose logs backend | Select-String "Kafka|Published"
```

## 🎯 What Happens When You Create a Journey

```
1. Rider creates journey via API
   ↓
2. Backend saves to MongoDB
   ↓
3. Backend publishes to Kafka:
   - Topic: journey-requested
   - Message: Journey details
   ↓
4. Backend publishes notification:
   - Topic: driver-notification
   - Message: "New ride available"
   ↓
5. Kafka stores messages
   ↓
6. Consumers receive messages
   ↓
7. You can see messages in:
   - Kafka UI (http://localhost:8080)
   - Backend logs
   - Kafka console consumer
```

## 📊 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:8000 | REST API |
| API Docs | http://localhost:8000/api-docs | Swagger UI |
| Health Check | http://localhost:8000/health | Health endpoint |
| Kafka UI | http://localhost:8080 | Kafka dashboard |
| MongoDB | mongodb://localhost:27017 | Database |

## 🔍 Useful Commands

### Container Management

```powershell
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Restart a service
docker-compose restart backend

# View status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### Kafka Commands

```powershell
# List topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# View messages
docker-compose exec kafka kafka-console-consumer `
  --bootstrap-server localhost:9092 `
  --topic journey-requested `
  --from-beginning

# Describe topic
docker-compose exec kafka kafka-topics `
  --describe `
  --topic journey-requested `
  --bootstrap-server localhost:9092
```

### Database Commands

```powershell
# Access MongoDB shell
docker-compose exec mongodb mongosh uber-clone

# View collections
docker-compose exec mongodb mongosh uber-clone --eval "db.getCollectionNames()"

# Count journeys
docker-compose exec mongodb mongosh uber-clone --eval "db.journeys.countDocuments()"
```

## 🐛 Troubleshooting

### Issue: Docker Desktop won't start

**Solution:**
1. Restart your computer
2. Run Docker Desktop as Administrator
3. Check Windows features: Hyper-V and WSL 2 should be enabled

### Issue: Containers won't start

**Solution:**
```powershell
# Remove everything and start fresh
docker-compose down -v
docker-compose up --build -d
```

### Issue: Port already in use

**Solution:**
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
```

### Issue: Kafka not working

**Solution:**
```powershell
# Check Kafka logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka zookeeper

# Wait 30 seconds for Kafka to be ready
timeout /t 30
```

## 📚 Documentation

- **Docker Setup**: `backend/DOCKER_README.md`
- **Kafka Setup**: `backend/docs/KAFKA_SETUP.md`
- **Kafka Implementation**: `backend/docs/KAFKA_IMPLEMENTATION.md`
- **API Documentation**: http://localhost:8000/api-docs (when running)

## ✅ Verification Checklist

After starting Docker, verify:

- [ ] Docker Desktop is running
- [ ] All 5 containers are running (`docker-compose ps`)
- [ ] Backend health check works (`curl http://localhost:8000/health`)
- [ ] API docs accessible (http://localhost:8000/api-docs)
- [ ] Kafka UI accessible (http://localhost:8080)
- [ ] Can create journey via API
- [ ] Kafka messages visible in Kafka UI
- [ ] Backend logs show "Kafka integration enabled"

## 🎉 Success Indicators

You'll know everything is working when:

1. **All containers show "Up"**:
   ```
   docker-compose ps
   ```

2. **Backend logs show**:
   ```
   ✓ Kafka client initialized
   ✓ Kafka producer connected
   ✓ Kafka consumer connected
   ✓ Kafka integration enabled
   Server is running on port 8000
   ```

3. **Kafka UI shows topics**:
   - journey-requested
   - journey-accepted
   - driver-notification
   - rider-notification

4. **Creating a journey shows in logs**:
   ```
   ✓ Published to journey-requested
   ✓ Published to driver-notification
   ```

## 🚀 Next Steps

Once everything is running:

1. **Test the API** using Postman or curl
2. **Monitor Kafka** in Kafka UI
3. **View real-time logs** with `docker-compose logs -f`
4. **Create journeys** and watch Kafka messages flow
5. **Experiment** with different API endpoints

## 💡 Tips

- Keep Docker Desktop running while developing
- Use Kafka UI to visualize message flow
- Check logs frequently: `docker-compose logs -f backend`
- Restart services if needed: `docker-compose restart backend`
- Clean up when done: `docker-compose down`

---

**Need Help?**
1. Check logs: `docker-compose logs`
2. Verify Docker is running: `docker info`
3. Review `backend/DOCKER_README.md`
4. Ensure all ports are free (8000, 8080, 9092, 27017)

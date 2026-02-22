#!/bin/bash

# ============================================
# UBER CLONE - DOCKER STARTUP SCRIPT
# ============================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         UBER CLONE - DOCKER CONTAINERIZED SETUP           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${YELLOW}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if docker-compose is available
echo -e "${YELLOW}Checking Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ docker-compose not found. Please install Docker Compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is available${NC}"
echo ""

# Stop any existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose down
echo ""

# Build and start containers
echo -e "${YELLOW}Building and starting containers...${NC}"
echo "This may take a few minutes on first run..."
echo ""
docker-compose up --build -d

# Wait for services to be healthy
echo ""
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
echo ""

# Wait for MongoDB
echo -n "MongoDB: "
for i in {1..30}; do
    if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for Zookeeper
echo -n "Zookeeper: "
for i in {1..30}; do
    if docker-compose exec -T zookeeper nc -z localhost 2181 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for Kafka
echo -n "Kafka: "
for i in {1..60}; do
    if docker-compose exec -T kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for Backend
echo -n "Backend: "
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ALL SERVICES RUNNING                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ MongoDB:${NC}     http://localhost:27017"
echo -e "${GREEN}✓ Kafka:${NC}       http://localhost:9092"
echo -e "${GREEN}✓ Kafka UI:${NC}    http://localhost:8080"
echo -e "${GREEN}✓ Backend API:${NC} http://localhost:8000"
echo -e "${GREEN}✓ API Docs:${NC}    http://localhost:8000/api-docs"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "KAFKA TOPICS AVAILABLE:"
echo "═══════════════════════════════════════════════════════════"
echo "  • journey-requested"
echo "  • journey-accepted"
echo "  • journey-started"
echo "  • journey-completed"
echo "  • journey-cancelled"
echo "  • driver-location"
echo "  • driver-status"
echo "  • rider-notification"
echo "  • driver-notification"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "USEFUL COMMANDS:"
echo "═══════════════════════════════════════════════════════════"
echo "  View logs:        docker-compose logs -f backend"
echo "  View Kafka logs:  docker-compose logs -f kafka"
echo "  Stop all:         docker-compose down"
echo "  Restart:          docker-compose restart backend"
echo "  Shell access:     docker-compose exec backend sh"
echo ""
echo "Press Ctrl+C to stop watching logs..."
echo ""

# Follow backend logs
docker-compose logs -f backend

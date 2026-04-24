#!/bin/bash

# ============================================
# AI Hospital Bed & Resource Optimizer
# Start Script
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   🏥 AI Hospital Bed & Resource Optimizer 🏥     ║"
echo "║   Starting Application...                        ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Creating default...${NC}"
  cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_optimizer
DB_USER=postgres
DB_PASSWORD=postgres
BACKEND_PORT=3001
FRONTEND_PORT=3000
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5
JWT_SECRET=hospital-optimizer-secret-key-2024
ENVEOF
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Default .env created${NC}"
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Function to kill process on a port
kill_port() {
  local port=$1
  local pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo -e "${YELLOW}⚡ Killing process on port $port (PID: $pid)${NC}"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
}

# Function to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}🛑 Shutting down...${NC}"
  kill_port $BACKEND_PORT
  kill_port $FRONTEND_PORT
  # Kill any background processes
  jobs -p | xargs -r kill 2>/dev/null || true
  echo -e "${GREEN}✓ All processes stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ============================================
# 1. Clean used ports
# ============================================
echo -e "\n${BLUE}[1/6] Cleaning ports...${NC}"
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
echo -e "${GREEN}✓ Ports $BACKEND_PORT and $FRONTEND_PORT are free${NC}"

# ============================================
# 2. Check PostgreSQL
# ============================================
echo -e "\n${BLUE}[2/6] Checking PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
  if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "${YELLOW}⚠ PostgreSQL is not running. Attempting to start...${NC}"
    if command -v brew &> /dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
      sleep 2
    fi
    if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
      echo -e "${RED}✗ Could not start PostgreSQL. Please start it manually.${NC}"
      exit 1
    fi
    echo -e "${GREEN}✓ PostgreSQL started${NC}"
  fi
else
  echo -e "${YELLOW}⚠ pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ============================================
# 3. Create Database
# ============================================
echo -e "\n${BLUE}[3/6] Setting up database...${NC}"
DB_EXISTS=$(psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME:-hospital_optimizer}'" 2>/dev/null || echo "0")
if [ "$DB_EXISTS" != "1" ]; then
  createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} ${DB_NAME:-hospital_optimizer} 2>/dev/null || true
  echo -e "${GREEN}✓ Database '${DB_NAME:-hospital_optimizer}' created${NC}"
else
  echo -e "${GREEN}✓ Database '${DB_NAME:-hospital_optimizer}' already exists${NC}"
fi

# ============================================
# 4. Install Dependencies
# ============================================
echo -e "\n${BLUE}[4/6] Installing dependencies...${NC}"

cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
  echo -e "${CYAN}  Installing backend dependencies...${NC}"
  npm install --silent 2>&1 | tail -1
else
  echo -e "${GREEN}  ✓ Backend dependencies already installed${NC}"
fi

cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  echo -e "${CYAN}  Installing frontend dependencies...${NC}"
  npm install --silent 2>&1 | tail -1
else
  echo -e "${GREEN}  ✓ Frontend dependencies already installed${NC}"
fi

cd "$SCRIPT_DIR"

# ============================================
# 5. Seed Database
# ============================================
echo -e "\n${BLUE}[5/6] Seeding database...${NC}"
cd "$SCRIPT_DIR/backend"
node seed.js
echo -e "${GREEN}✓ Database seeded with sample data${NC}"
cd "$SCRIPT_DIR"

# ============================================
# 6. Start Application
# ============================================
echo -e "\n${BLUE}[6/6] Starting application with hot reload...${NC}"

# Start backend with nodemon for hot reload
cd "$SCRIPT_DIR/backend"
npx nodemon --watch . --ext js,json server.js &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend starting on port $BACKEND_PORT (PID: $BACKEND_PID) with hot reload${NC}"

# Start frontend with React dev server (has hot reload built in)
cd "$SCRIPT_DIR/frontend"
BROWSER=none PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend starting on port $FRONTEND_PORT (PID: $FRONTEND_PID) with hot reload${NC}"

cd "$SCRIPT_DIR"

echo -e "\n${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   🏥 Application Started Successfully! 🏥        ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                  ║"
echo "║   Frontend:  http://localhost:$FRONTEND_PORT              ║"
echo "║   Backend:   http://localhost:$BACKEND_PORT              ║"
echo "║                                                  ║"
echo "║   Login Credentials:                             ║"
echo "║   Email:    admin@hospital.com                   ║"
echo "║   Password: admin123                             ║"
echo "║                                                  ║"
echo "║   Hot reload is enabled for both servers.        ║"
echo "║   Press Ctrl+C to stop all services.             ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Wait for both processes
wait

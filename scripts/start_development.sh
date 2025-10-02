#!/bin/bash

# ==============================================================================
# Development Startup Script for Quant Navigator
# ==============================================================================
# This script starts both the web server and background worker processes
# in development mode with auto-reload enabled.
# ==============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WEB_HOST=${WEB_HOST:-"127.0.0.1"}
WEB_PORT=${WEB_PORT:-8000}
WORKER_CONCURRENCY=${WORKER_CONCURRENCY:-2}
REDIS_HOST=${REDIS_HOST:-"localhost"}
REDIS_PORT=${REDIS_PORT:-6379}

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PATH="$PROJECT_ROOT/packages/backend-python"
LOG_DIR="$PROJECT_ROOT/logs"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo -e "${BLUE}🚀 Starting Quant Navigator Development Environment${NC}"
echo -e "${BLUE}===================================================${NC}"

# Check if Redis is running
echo -e "${YELLOW}📡 Checking Redis connection...${NC}"
if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
    echo -e "${RED}❌ Redis is not running on $REDIS_HOST:$REDIS_PORT${NC}"
    echo -e "${YELLOW}💡 Please start Redis first:${NC}"
    echo -e "   brew services start redis  # macOS"
    echo -e "   sudo systemctl start redis  # Linux"
    echo -e "   docker run -d -p 6379:6379 redis:alpine  # Docker"
    exit 1
fi
echo -e "${GREEN}✅ Redis is running${NC}"

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo -e "${YELLOW}⚠️  Virtual environment not detected${NC}"
    echo -e "${YELLOW}💡 Activating virtual environment...${NC}"
    if [[ -f "$PROJECT_ROOT/venv/bin/activate" ]]; then
        source "$PROJECT_ROOT/venv/bin/activate"
        echo -e "${GREEN}✅ Virtual environment activated${NC}"
    else
        echo -e "${RED}❌ Virtual environment not found at $PROJECT_ROOT/venv${NC}"
        echo -e "${YELLOW}💡 Please create and activate a virtual environment first:${NC}"
        echo -e "   python -m venv venv"
        echo -e "   source venv/bin/activate"
        echo -e "   pip install -r requirements.txt"
        exit 1
    fi
fi

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down development services...${NC}"
    
    # Kill web server
    if [[ -n "$WEB_PID" ]]; then
        echo -e "${YELLOW}   Stopping web server (PID: $WEB_PID)${NC}"
        kill "$WEB_PID" 2>/dev/null || true
    fi
    
    # Kill worker processes
    if [[ -n "$WORKER_PID" ]]; then
        echo -e "${YELLOW}   Stopping worker (PID: $WORKER_PID)${NC}"
        kill "$WORKER_PID" 2>/dev/null || true
    fi
    
    # Kill any remaining arq processes
    pkill -f "arq.*worker" 2>/dev/null || true
    
    echo -e "${GREEN}✅ All development services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start background worker in development mode
echo -e "${YELLOW}🔄 Starting background worker (development mode)...${NC}"
cd "$BACKEND_PATH"
arq packages.backend-python.worker.WorkerSettings \
    --worker-class arq.worker.Worker \
    --max-jobs "$WORKER_CONCURRENCY" \
    --job-timeout 300 \
    --keep-result 3600 \
    --max-tries 3 \
    --watch packages.backend-python/src \
    > "$LOG_DIR/worker-dev.log" 2>&1 &
WORKER_PID=$!

# Wait a moment for worker to start
sleep 2

# Check if worker started successfully
if ! kill -0 "$WORKER_PID" 2>/dev/null; then
    echo -e "${RED}❌ Failed to start background worker${NC}"
    echo -e "${YELLOW}💡 Check worker logs:${NC}"
    echo -e "   tail -f $LOG_DIR/worker-dev.log"
    exit 1
fi

echo -e "${GREEN}✅ Background worker started (PID: $WORKER_PID)${NC}"

# Start web server in development mode with auto-reload
echo -e "${YELLOW}🌐 Starting web server (development mode with auto-reload)...${NC}"
cd "$BACKEND_PATH"
granian \
    --interface asgi \
    --host "$WEB_HOST" \
    --port "$WEB_PORT" \
    --workers 1 \
    --backlog 1000 \
    --keep-alive 2 \
    --timeout-keep-alive 5 \
    --timeout-graceful-shutdown 30 \
    --reload \
    packages.backend-python.src.main:app \
    > "$LOG_DIR/web-dev.log" 2>&1 &
WEB_PID=$!

# Wait a moment for web server to start
sleep 3

# Check if web server started successfully
if ! kill -0 "$WEB_PID" 2>/dev/null; then
    echo -e "${RED}❌ Failed to start web server${NC}"
    echo -e "${YELLOW}💡 Check web server logs:${NC}"
    echo -e "   tail -f $LOG_DIR/web-dev.log"
    cleanup
    exit 1
fi

echo -e "${GREEN}✅ Web server started (PID: $WEB_PID)${NC}"
echo -e "${GREEN}✅ All development services are running!${NC}"
echo -e ""
echo -e "${BLUE}📊 Development Service Status:${NC}"
echo -e "   Web Server:  http://$WEB_HOST:$WEB_PORT (with auto-reload)"
echo -e "   Worker:      Background processing (PID: $WORKER_PID, with file watching)"
echo -e "   Redis:       $REDIS_HOST:$REDIS_PORT"
echo -e ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   Web Server:  tail -f $LOG_DIR/web-dev.log"
echo -e "   Worker:      tail -f $LOG_DIR/worker-dev.log"
echo -e ""
echo -e "${BLUE}🔧 Development Features:${NC}"
echo -e "   ✅ Auto-reload on code changes"
echo -e "   ✅ File watching for worker"
echo -e "   ✅ Detailed error messages"
echo -e "   ✅ Hot reloading for both services"
echo -e ""
echo -e "${YELLOW}💡 Press Ctrl+C to stop all services${NC}"

# Wait for processes
wait

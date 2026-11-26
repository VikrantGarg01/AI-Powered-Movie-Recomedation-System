#!/bin/bash

# ==============================================================================
# CinePulse — All-in-One Launch Script (Linux / macOS)
# Starts MongoDB, Backend Express API (Port 5001), and Frontend UI (Port 5173)
# Cleanly terminates all child processes on Ctrl+C
# ==============================================================================

# Text Color Codes
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Determine Project Root Directory
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$PROJECT_ROOT"

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "          🎬 CINEPULSE — FULL-STACK MOVIE RECOMMENDER SYSTEM         "
echo "        High-Accuracy Content-Based Filtering & Express REST API      "
echo "======================================================================"
echo -e "${NC}"

# 1. Check & Start MongoDB Service if needed
echo -e "${CYAN}[1/4] Checking MongoDB Database...${NC}"
if lsof -i :27017 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB is running on port 27017.${NC}"
else
    echo -e "${YELLOW}! MongoDB is not detected on port 27017. Attempting to start...${NC}"
    if command -v brew >/dev/null 2>&1; then
        brew services start mongodb-community >/dev/null 2>&1 || brew services start mongodb/brew/mongodb-community >/dev/null 2>&1
        sleep 2
    elif command -v systemctl >/dev/null 2>&1; then
        sudo systemctl start mongod >/dev/null 2>&1
        sleep 2
    fi

    if lsof -i :27017 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ MongoDB started successfully.${NC}"
    else
        echo -e "${YELLOW}Notice: MongoDB daemon not active. Server will operate with in-memory JSON fallback.${NC}"
    fi
fi

# 2. Check and Install Dependencies if missing
echo -e "\n${CYAN}[2/4] Checking Dependencies...${NC}"
if [ ! -d "$PROJECT_ROOT/server/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    (cd "$PROJECT_ROOT/server" && npm install)
fi

if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi
echo -e "${GREEN}✓ All dependencies verified.${NC}"

# Clean up any stale processes on ports 5001 or 5173
lsof -ti :5001 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null

# 3. Start Backend REST API (Port 5001)
echo -e "\n${CYAN}[3/4] Starting Node.js Express REST Backend on Port 5001...${NC}"
cd "$PROJECT_ROOT/server"
node server.js &
BACKEND_PID=$!

# Wait for backend health check
MAX_RETRIES=15
COUNT=0
BACKEND_UP=false

while [ $COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:5001/api/health >/dev/null 2>&1; then
        BACKEND_UP=true
        break
    fi
    sleep 0.8
    COUNT=$((COUNT + 1))
done

if [ "$BACKEND_UP" = true ]; then
    echo -e "${GREEN}✓ Backend REST API is live at http://localhost:5001${NC}"
    echo -e "${GREEN}✓ High-Accuracy KNN Engine initialized (TF-IDF + Cosine Distance)${NC}"
else
    echo -e "${YELLOW}Backend started (PID: $BACKEND_PID). Continuing to frontend...${NC}"
fi

# 4. Start Frontend Vite Server (Port 5173)
echo -e "\n${CYAN}[4/4] Starting React / Vite Frontend on Port 5173...${NC}"
cd "$PROJECT_ROOT"
npm run dev -- --host &
FRONTEND_PID=$!

sleep 2

# Cleanup function on script exit / Ctrl+C
cleanup() {
    echo -e "\n\n${YELLOW}${BOLD}Shutting down CinePulse services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    # Ensure ports are cleared
    lsof -ti :5001 | xargs kill -9 2>/dev/null
    lsof -ti :5173 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓ All services stopped cleanly. Goodbye!${NC}\n"
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGINT SIGTERM EXIT

echo -e "\n${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD} 🎉 CinePulse Full-Stack System is LIVE!${NC}"
echo -e "${BOLD} • Frontend URL:${NC}       http://localhost:5173"
echo -e "${BOLD} • Backend REST API:${NC}   http://localhost:5001"
echo -e "${BOLD} • API Health Check:${NC}   http://localhost:5001/api/health"
echo -e "${BOLD} • Demo Evaluator:${NC}     alex.vance@cinema.edu  (Password: demo1234)"
echo -e "${BOLD} • Documentation:${NC}      techstack.txt | question.txt | README.txt"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${CYAN}Press ${BOLD}[Ctrl + C]${NC}${CYAN} at any time to cleanly stop all servers.${NC}\n"

# Automatically open browser if possible
if command -v open >/dev/null 2>&1; then
    open http://localhost:5173 >/dev/null 2>&1 &
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:5173 >/dev/null 2>&1 &
fi

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

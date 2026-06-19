#!/bin/bash

echo "======================================"
echo "  Commandix POC - Starting..."
echo "======================================"

# Bring down any existing containers
docker compose down

# Build and start all services
docker compose up -d --build

echo ""
echo "======================================"
echo "  Services starting up!"
echo "  Backend:  http://localhost:3000"
echo "  Frontend: http://localhost:5173"
echo "======================================"
echo ""
echo "  Check logs with:"
echo "  docker compose logs -f backend"
echo "======================================"

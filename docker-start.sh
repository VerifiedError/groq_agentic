#!/bin/bash
# Quick Start Script for Docker Deployment (Linux/Mac)

set -e

echo "========================================"
echo "Groq Agentic - Docker Quick Start"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed"
    echo ""
    echo "Please install Docker from:"
    echo "https://docs.docker.com/get-docker/"
    echo ""
    exit 1
fi

echo "[OK] Docker is installed"
echo ""

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "[ERROR] docker-compose is not installed"
    echo ""
    echo "Please install docker-compose from:"
    echo "https://docs.docker.com/compose/install/"
    echo ""
    exit 1
fi

echo "[OK] docker-compose is installed"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "[WARNING] .env.local file not found"
    echo ""

    if [ -f .env.local.template ]; then
        echo "Creating .env.local from template..."
        cp .env.local.template .env.local
        echo "[OK] .env.local created from template"
        echo ""
        echo "IMPORTANT: Please edit .env.local and add your credentials"
        echo "1. Open .env.local in your text editor"
        echo "2. Replace 'gsk_your_api_key_here' with your actual API key"
        echo "3. Generate NEXTAUTH_SECRET with: openssl rand -base64 32"
        echo ""
        echo "Opening .env.local in default editor..."
        ${EDITOR:-nano} .env.local
    else
        echo "[ERROR] .env.local.template not found"
        echo "Please create .env.local manually"
        exit 1
    fi
fi

echo "[OK] .env.local exists"
echo ""

# Menu
echo "Choose an option:"
echo "1. Build and start (first time or after code changes)"
echo "2. Just start (if already built)"
echo "3. Stop containers"
echo "4. View logs"
echo "5. Clean rebuild (if having issues)"
echo "6. Open in browser"
echo ""
read -p "Enter choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "========================================"
        echo "Building Docker image..."
        echo "This may take 5-10 minutes first time"
        echo "========================================"
        docker-compose build
        echo "[OK] Build successful"

        echo ""
        echo "========================================"
        echo "Starting containers..."
        echo "========================================"
        docker-compose up -d
        echo ""
        echo "[SUCCESS] Application is running!"
        echo ""
        echo "Access your application at:"
        echo "http://localhost:13380"
        echo ""
        echo "Useful commands:"
        echo "- View logs: docker-compose logs -f"
        echo "- Stop app: docker-compose down"
        echo "- Restart: docker-compose restart"
        echo ""

        # Try to open browser (Linux)
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:13380
        # Try to open browser (Mac)
        elif command -v open &> /dev/null; then
            open http://localhost:13380
        fi
        ;;

    2)
        echo ""
        echo "========================================"
        echo "Starting containers..."
        echo "========================================"
        docker-compose up -d
        echo ""
        echo "[SUCCESS] Application is running!"
        echo "Access at: http://localhost:13380"
        ;;

    3)
        echo ""
        echo "========================================"
        echo "Stopping containers..."
        echo "========================================"
        docker-compose down
        echo "[OK] Containers stopped"
        ;;

    4)
        echo ""
        echo "========================================"
        echo "Viewing logs (Press Ctrl+C to exit)"
        echo "========================================"
        docker-compose logs -f
        ;;

    5)
        echo ""
        echo "========================================"
        echo "Cleaning and rebuilding..."
        echo "========================================"
        echo "Stopping containers..."
        docker-compose down
        echo "Building with no cache..."
        docker-compose build --no-cache
        echo "Starting containers..."
        docker-compose up -d
        echo "[OK] Clean rebuild complete"
        ;;

    6)
        # Open browser
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:13380
        elif command -v open &> /dev/null; then
            open http://localhost:13380
        else
            echo "Please open http://localhost:13380 in your browser"
        fi
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""

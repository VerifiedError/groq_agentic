# Docker Deployment Guide - Beginner Friendly

This guide will walk you through deploying the Groq Agentic application using Docker. **No prior Docker experience required!**

## Table of Contents
- [What is Docker?](#what-is-docker)
- [Prerequisites](#prerequisites)
- [Quick Start (5 minutes)](#quick-start-5-minutes)
- [Understanding the Setup](#understanding-the-setup)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## What is Docker?

Docker is a tool that packages your application and all its dependencies into a **container** - think of it like a lightweight virtual machine that runs the same way on any computer.

**Benefits:**
- ✅ No need to install Node.js, Python, or other dependencies manually
- ✅ Same environment on Windows, Mac, and Linux
- ✅ Easy to deploy and scale
- ✅ Isolated from your main system

---

## Prerequisites

### 1. Install Docker Desktop

**Windows:**
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Run the installer
3. Restart your computer when prompted
4. Open Docker Desktop (it should start automatically)

**Mac:**
1. Download Docker Desktop for Mac from the same link
2. Drag Docker.app to Applications folder
3. Open Docker Desktop from Applications

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Verify Docker Installation

Open your terminal/command prompt and run:
```bash
docker --version
docker-compose --version
```

You should see version numbers like:
```
Docker version 24.0.0
Docker Compose version v2.20.0
```

---

## Quick Start (5 minutes)

### Step 1: Create Environment File

Create a file named `.env.local` in the project root with your credentials:

```bash
# Required: Your Groq API key
GROQ_API_KEY=gsk_your_api_key_here

# Required: Secret for authentication (any random string)
NEXTAUTH_SECRET=your_random_secret_here_at_least_32_characters

# Required: Application URL
NEXTAUTH_URL=http://localhost:13380

# Database (already configured for Docker)
DATABASE_URL=file:/app/data/prod.db
```

**Getting your GROQ_API_KEY:**
1. Go to https://console.groq.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into `.env.local`

**Generating NEXTAUTH_SECRET:**
```bash
# On Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# On Mac/Linux
openssl rand -base64 32
```

### Step 2: Build and Run with Docker Compose

```bash
# Build the Docker image (first time only, takes 5-10 minutes)
docker-compose build

# Start the application
docker-compose up -d
```

The `-d` flag runs it in the background (detached mode).

### Step 3: Access the Application

Open your browser and go to:
```
http://localhost:13380
```

You should see the Groq Agentic application!

### Step 4: View Logs (Optional)

```bash
# View real-time logs
docker-compose logs -f

# Press Ctrl+C to stop viewing logs
```

### Step 5: Stop the Application

```bash
# Stop the containers
docker-compose down
```

---

## Understanding the Setup

### Files Explained

**Dockerfile** - Instructions for building the Docker image
- Stage 1: Installs Node.js dependencies
- Stage 2: Builds the Next.js application
- Stage 3: Creates production-ready container with Python MCP support

**docker-compose.yml** - Orchestrates the container
- Maps port 13380 to your localhost
- Mounts a volume for persistent database storage
- Passes environment variables from `.env.local`
- Sets up health checks

**.dockerignore** - Files excluded from Docker build
- Similar to .gitignore but for Docker
- Keeps image size small

### Docker Commands Cheat Sheet

```bash
# Build the image
docker-compose build

# Start containers in background
docker-compose up -d

# Start containers in foreground (see logs live)
docker-compose up

# Stop containers
docker-compose down

# View logs
docker-compose logs -f app

# Restart containers
docker-compose restart

# Remove everything (including database!)
docker-compose down -v

# Execute commands inside container
docker-compose exec app sh

# Check container status
docker-compose ps

# View resource usage
docker stats
```

---

## Configuration

### Port Configuration

By default, the app runs on port **13380**. To change it:

1. Edit `docker-compose.yml`:
```yaml
ports:
  - "3000:13380"  # Change left number (host port)
```

2. Update `.env.local`:
```bash
NEXTAUTH_URL=http://localhost:3000
```

### Environment Variables

All environment variables are set in `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Your Groq API key |
| `NEXTAUTH_SECRET` | ✅ Yes | Random secret for JWT signing |
| `NEXTAUTH_URL` | ✅ Yes | Application URL |
| `DATABASE_URL` | ✅ Yes | SQLite database path (pre-configured) |
| `NODE_ENV` | ❌ No | Set to `production` in Docker |
| `PORT` | ❌ No | Set to `13380` in Docker |

### Database Persistence

The database is stored in a Docker volume named `db-data`. This means:
- ✅ Data persists even when you stop/restart containers
- ✅ You can backup the volume
- ⚠️ Data is **lost** if you run `docker-compose down -v`

**To backup database:**
```bash
# Create backup
docker run --rm -v agentic_db-data:/data -v ${PWD}:/backup alpine tar czf /backup/db-backup.tar.gz /data

# Restore backup
docker run --rm -v agentic_db-data:/data -v ${PWD}:/backup alpine tar xzf /backup/db-backup.tar.gz -C /
```

---

## Troubleshooting

### Problem: "Cannot connect" or "Connection refused"

**Solution:**
1. Check if Docker Desktop is running
2. Verify container is running: `docker-compose ps`
3. Check logs: `docker-compose logs -f app`
4. Ensure port 13380 is not used by another application

### Problem: "Error: GROQ_API_KEY is not set"

**Solution:**
1. Ensure `.env.local` exists in project root
2. Check variable name is exactly `GROQ_API_KEY`
3. Restart containers: `docker-compose restart`

### Problem: "Build failed" or "Cannot find module"

**Solution:**
```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Problem: "Permission denied" (Linux)

**Solution:**
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then test
docker run hello-world
```

### Problem: "Port already in use"

**Solution:**
```bash
# Windows - Find process using port 13380
netstat -ano | findstr :13380

# Kill process (replace PID)
taskkill /PID <PID> /F

# Mac/Linux - Find and kill process
lsof -ti:13380 | xargs kill -9
```

### Problem: Application is slow or crashes

**Solution:**
1. Increase Docker Desktop memory:
   - Open Docker Desktop settings
   - Resources → Advanced
   - Increase memory to 4GB+

2. Check resource usage:
```bash
docker stats
```

---

## Advanced Usage

### Custom Build Arguments

```bash
# Build with specific Node version
docker build --build-arg NODE_VERSION=20 -t agentic .

# Build without cache
docker-compose build --no-cache
```

### Running Migrations Manually

```bash
# Access container shell
docker-compose exec app sh

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Exit shell
exit
```

### Multi-Container Setup (Future)

To add Redis, PostgreSQL, or other services:

```yaml
# docker-compose.yml
services:
  app:
    # ... existing config
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
```

### Docker Hub Deployment

To push your image to Docker Hub:

```bash
# Login to Docker Hub
docker login

# Tag image
docker tag agentic:latest yourusername/agentic:latest

# Push to Docker Hub
docker push yourusername/agentic:latest
```

Then others can run:
```bash
docker pull yourusername/agentic:latest
docker run -p 13380:13380 --env-file .env.local yourusername/agentic:latest
```

### Health Checks

The container includes automatic health checks:
- Runs every 30 seconds
- Times out after 3 seconds
- Retries 3 times before marking unhealthy
- Starts checking after 40 seconds (startup period)

View health status:
```bash
docker-compose ps
```

---

## Production Deployment

For production environments (AWS, DigitalOcean, etc.):

### 1. Use Production Environment Variables

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db  # Use PostgreSQL
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<strong-secret-here>
GROQ_API_KEY=<your-key>
```

### 2. Enable SSL/HTTPS

Use a reverse proxy like Nginx or Traefik:

```yaml
# docker-compose.prod.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
```

### 3. Use Orchestration

For scaling and high availability:
- **Docker Swarm**: Built into Docker
- **Kubernetes**: Industry standard for large deployments
- **AWS ECS/Fargate**: Managed container service

### 4. Monitor and Log

```bash
# Send logs to external service
docker-compose logs -f | tee app.log

# Or use logging drivers
docker run --log-driver=syslog ...
```

---

## Next Steps

1. ✅ Set up your `.env.local` file
2. ✅ Run `docker-compose up -d`
3. ✅ Access http://localhost:13380
4. ✅ Create your first chat session
5. ✅ Test artifact creation with MCP tools

**Need help?**
- Check the troubleshooting section above
- Review logs: `docker-compose logs -f`
- Open an issue on GitHub

---

## Summary of Key Commands

```bash
# First time setup
1. Create .env.local with your credentials
2. docker-compose build
3. docker-compose up -d
4. Open http://localhost:13380

# Daily usage
docker-compose up -d      # Start
docker-compose down       # Stop
docker-compose logs -f    # View logs

# Maintenance
docker-compose restart    # Restart
docker-compose build      # Rebuild after code changes
docker system prune -a    # Clean up unused images (frees space)
```

**Happy Dockering! 🐳**

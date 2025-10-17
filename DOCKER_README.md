# Groq Agentic - Docker Deployment Package

This package contains everything you need to deploy Groq Agentic using Docker.

## 📦 Package Contents

- `Dockerfile` - Multi-stage Docker build configuration
- `docker-compose.yml` - Container orchestration configuration
- `.dockerignore` - Files excluded from Docker build
- `.env.local.template` - Environment variables template
- `DOCKER_GUIDE.md` - Complete beginner-friendly guide (40+ pages)
- `docker-start.bat` - Quick start script for Windows
- `docker-start.sh` - Quick start script for Linux/Mac

## 🚀 Quick Start (30 seconds)

### For First-Time Docker Users

**1. Install Docker Desktop**
- Windows/Mac: https://www.docker.com/products/docker-desktop
- Linux: `sudo apt-get install docker.io docker-compose`

**2. Set Up Environment**
```bash
# Copy template to create your .env.local
copy .env.local.template .env.local   # Windows
cp .env.local.template .env.local     # Linux/Mac

# Edit .env.local and add your GROQ_API_KEY
# Get it from: https://console.groq.com/
```

**3. Run the Application**

**Windows:**
```bash
# Double-click docker-start.bat
# OR run in command prompt:
docker-start.bat
```

**Linux/Mac:**
```bash
# Make executable (first time only)
chmod +x docker-start.sh

# Run
./docker-start.sh
```

**4. Open Browser**
```
http://localhost:13380
```

## 📖 Full Documentation

See `DOCKER_GUIDE.md` for comprehensive documentation including:
- What is Docker? (beginner explanation)
- Prerequisites and installation
- Step-by-step deployment guide
- Configuration options
- Troubleshooting
- Advanced usage
- Production deployment

## 🔧 Manual Deployment (Advanced)

If you prefer manual control:

```bash
# 1. Create environment file
cp .env.local.template .env.local
# Edit .env.local with your values

# 2. Build Docker image
docker-compose build

# 3. Start containers
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Stop containers
docker-compose down
```

## 📋 Requirements

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** v2.0+
- **4GB RAM** minimum (8GB recommended)
- **10GB disk space** for images and data
- **Groq API Key** (get from https://console.groq.com/)

## 🆘 Need Help?

1. **Read the guide**: Open `DOCKER_GUIDE.md`
2. **Check troubleshooting**: Search the guide for your error
3. **View logs**: `docker-compose logs -f app`
4. **Clean rebuild**: Choose option 5 in quick-start script

## 🌟 Features

This Docker setup includes:
- ✅ Multi-stage build for small image size (~500MB)
- ✅ Node.js 20 + Next.js 15 with Turbopack
- ✅ Python 3 + FastMCP for artifact file operations
- ✅ SQLite database with persistent volume
- ✅ Automatic health checks
- ✅ Artifact workspace isolation
- ✅ Production-ready optimizations
- ✅ Non-root user for security

## 📊 Application Architecture

```
┌─────────────────────────────────────┐
│   Browser (localhost:13380)         │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Docker Container (groq-agentic)    │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Next.js App (Port 13380)     │ │
│  │  - React UI                   │ │
│  │  - API Routes                 │ │
│  │  - Groq SDK Integration       │ │
│  └──────────┬────────────────────┘ │
│             │                       │
│  ┌──────────▼────────────────────┐ │
│  │  Python MCP Server            │ │
│  │  - FastMCP                    │ │
│  │  - Filesystem tools           │ │
│  │  - Artifact workspaces        │ │
│  └──────────┬────────────────────┘ │
│             │                       │
│  ┌──────────▼────────────────────┐ │
│  │  SQLite Database              │ │
│  │  - Users                      │ │
│  │  - Sessions                   │ │
│  │  - Messages                   │ │
│  │  - Models                     │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Docker Volume (db-data)            │
│  - Persistent database storage      │
│  - Survives container restarts      │
└─────────────────────────────────────┘
```

## 🔐 Security Notes

- Database stored in isolated Docker volume
- Application runs as non-root user (`nextjs`)
- Secrets managed via `.env.local` (not in image)
- Network isolated from host by default
- Health checks for automatic recovery

## 🚢 Deployment Options

### Local Development
- Use Docker Compose (this package)
- Access at `localhost:13380`

### Cloud Deployment
- **AWS ECS/Fargate**: Upload to ECR, deploy to ECS
- **Google Cloud Run**: Build and deploy with one command
- **DigitalOcean App Platform**: Connect GitHub and auto-deploy
- **Heroku**: Use container registry
- **Railway**: Connect repo and deploy

See `DOCKER_GUIDE.md` "Production Deployment" section for details.

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | Your Groq API key from console.groq.com |
| `NEXTAUTH_SECRET` | ✅ | Random secret for JWT (32+ chars) |
| `NEXTAUTH_URL` | ✅ | Application URL (http://localhost:13380) |
| `DATABASE_URL` | ✅ | Database path (pre-configured) |

## 🎯 Next Steps

1. ✅ Read `DOCKER_GUIDE.md` (comprehensive documentation)
2. ✅ Run `docker-start.bat` or `docker-start.sh`
3. ✅ Access http://localhost:13380
4. ✅ Create your first chat session
5. ✅ Test artifact creation with MCP tools

## 📞 Support

- **Documentation**: `DOCKER_GUIDE.md`
- **GitHub Issues**: https://github.com/VerifiedError/groq_agentic/issues
- **Groq Documentation**: https://console.groq.com/docs

---

**Made with Claude Code** • https://claude.com/claude-code

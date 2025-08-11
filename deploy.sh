#!/bin/bash

# Production deployment script for MERN Stack
set -e

echo "🚀 Starting MERN Stack production deployment..."

# Configuration
ENVIRONMENT=${1:-production}
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD)
VERSION=$(node -p "require('./client/package.json').version")

echo "📋 Deployment Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Version: $VERSION"
echo "  Git Commit: $GIT_COMMIT"
echo "  Build Time: $BUILD_TIME"

# Check dependencies
echo "🔍 Checking system dependencies..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

# Verify Node.js version
NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

if ! node -e "process.exit(process.version.match(/v(\d+)/)[1] >= 22 ? 0 : 1)"; then
    echo "❌ Node.js 22+ is required. Current version: $NODE_VERSION"
    exit 1
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm ci --only=production
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm ci
cd ..

# Run tests
echo "🧪 Running tests..."
cd server
npm run test || { echo "❌ Server tests failed. Aborting deployment."; exit 1; }
cd ../client
npm run test:run || { echo "❌ Client tests failed. Aborting deployment."; exit 1; }
cd ..

# Security audit
echo "🔒 Running security audit..."
cd server
npm audit --audit-level=moderate || { echo "⚠️ Security vulnerabilities found in server dependencies."; }
cd ../client
npm audit --audit-level=moderate || { echo "⚠️ Security vulnerabilities found in client dependencies."; }
cd ..

# Build client for production
echo "🏗️ Building client for production..."
cd client
VITE_APP_VERSION=$VERSION \
VITE_BUILD_TIME=$BUILD_TIME \
VITE_GIT_COMMIT=$GIT_COMMIT \
npm run build:production

# Verify build output
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "❌ Client build failed - dist directory not found or incomplete"
    exit 1
fi

echo "✅ Client build completed successfully"
cd ..

# Prepare server for production
echo "🔧 Preparing server for production..."
cd server

# Create production directories
mkdir -p logs
mkdir -p temp

# Set proper permissions
chmod 755 logs
chmod 755 temp

echo "✅ Server preparation completed"
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
DEPLOY_DIR="deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p $DEPLOY_DIR

# Copy server files
cp -r server $DEPLOY_DIR/
cp -r client/dist $DEPLOY_DIR/client

# Copy configuration files
cp ecosystem.config.js $DEPLOY_DIR/ 2>/dev/null || echo "⚠️ PM2 config not found"
cp Dockerfile $DEPLOY_DIR/ 2>/dev/null || echo "⚠️ Dockerfile not found"
cp .dockerignore $DEPLOY_DIR/ 2>/dev/null || echo "⚠️ .dockerignore not found"

# Create deployment info
cat > $DEPLOY_DIR/DEPLOYMENT_INFO.txt << EOF
MERN Stack Deployment Package
============================
Environment: $ENVIRONMENT
Version: $VERSION
Git Commit: $GIT_COMMIT
Build Time: $BUILD_TIME
Deployed By: $(whoami)
Deployment Time: $(date)

Files Included:
- server/ (Node.js backend)
- client/ (React frontend build)
- ecosystem.config.js (PM2 configuration)
- Dockerfile (Container configuration)

Installation Instructions:
1. Copy this package to your production server
2. Install dependencies: cd server && npm ci --only=production
3. Set environment variables (copy from .env.example)
4. Start with PM2: pm2 start ecosystem.config.js --env production
   Or with Docker: docker build -t mern-app . && docker run -p 5000:5000 mern-app
   Or directly: NODE_ENV=production node server/src/index.js

Health Check:
curl http://localhost:5000/api/health
EOF

echo "✅ Deployment package created: $DEPLOY_DIR"

# Create tarball
tar -czf "${DEPLOY_DIR}.tar.gz" $DEPLOY_DIR
echo "✅ Deployment tarball created: ${DEPLOY_DIR}.tar.gz"

# Cleanup
rm -rf $DEPLOY_DIR

echo ""
echo "🎉 Deployment preparation completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Transfer ${DEPLOY_DIR}.tar.gz to your production server"
echo "2. Extract: tar -xzf ${DEPLOY_DIR}.tar.gz"
echo "3. Follow instructions in DEPLOYMENT_INFO.txt"
echo ""
echo "🔗 Useful commands for production:"
echo "  Health check: curl http://your-server:5000/api/health"
echo "  PM2 status: pm2 status"
echo "  View logs: pm2 logs mern-server"
echo "  Restart: pm2 restart mern-server"
echo ""
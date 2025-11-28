# GitHub Actions Workflows

## CI Workflow (`ci.yml`)

Runs automatically on:
- Push to `main` branch
- Pull requests to `main` branch

**What it does:**
- Builds and lints frontend
- Tests backend syntax
- Uploads build artifacts

## Deploy Workflow (`deploy.yml`)

**Manual trigger only** - Run from GitHub Actions tab

**What it does:**
- Builds frontend with production config
- Installs backend dependencies
- Deploys to server via SSH/SCP
- Restarts PM2 services

## Setup

### Required GitHub Secrets

Go to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add these secrets:

**For Deployment:**
- `SSH_HOST` - Your server IP or domain
- `SSH_USER` - SSH username (e.g., `root`, `ubuntu`)
- `SSH_PRIVATE_KEY` - Your SSH private key
- `SSH_PORT` - SSH port (default: 22)
- `DEPLOY_PATH` - Deploy directory on server (e.g., `/var/www/monazoyt`)
- `VITE_API_URL` - API URL for frontend (e.g., `https://api.yoursite.com`)

### Optional: Setup Environments

For production/staging separation:

1. Go to `Settings` → `Environments`
2. Create `production` and `staging` environments
3. Add environment-specific secrets

## Usage

### Trigger Deployment

1. Go to `Actions` tab in GitHub
2. Click `Deploy` workflow
3. Click `Run workflow`
4. Select environment (production/staging)
5. Click `Run workflow`

## Server Requirements

- Node.js (any recent version)
- PM2 installed globally: `npm install -g pm2`
- yt-dlp installed system-wide
- SSH access configured

## Post-Deploy Steps

1. SSH into your server
2. Create `backend/.env` file with PORT
3. Create/copy `backend/keys.json` with valid auth keys
4. Ensure `backend/downloads/` directory exists

# CI/CD Setup Instructions

## GitHub Secrets Configuration

To enable the deployment workflow, configure the following secrets in your GitHub repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

### Required Secrets:
- `SSH_PRIVATE_KEY` - Your SSH private key for server access
- `REMOTE_HOST` - Your server hostname or IP address
- `REMOTE_USER` - SSH username for server access
- `TARGET_PATH` - Deployment path on the server (e.g., `/var/www/epicstudiaapi`)

### Optional Environment Variables:
Create a `.env` file on your server with:
```
PORT=5000
NODE_ENV=production
# Add your database credentials and other environment variables here
```

## PM2 Setup on Server

On your production server, install PM2 globally:
```bash
npm install -g pm2
```

Update the ecosystem.config.js with your actual deployment details.

## Workflow Overview

### CI Pipeline (node.js.yml)
- Triggers on push/PR to main/master branches
- Tests on Node.js versions 18.x, 20.x, 22.x
- Runs npm install and npm test

### CD Pipeline (deploy.yml)
- Triggers on push to main/master branches
- Deploys to production server via SSH
- Restarts the application using PM2

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test
```

## Repository Structure
```
├── .github/workflows/
│   ├── node.js.yml      # CI pipeline
│   └── deploy.yml       # CD pipeline
├── bin/
│   ├── www              # Entry point
│   └── db.js            # Database configuration
├── routes/              # API routes
├── app.js               # Express app setup
├── package.json         # Dependencies and scripts
└── ecosystem.config.js  # PM2 configuration
```

# ☁️ CloudDeck — Complete GCP Deployment Guide

## Architecture Overview

```
Internet
    │
    ▼
[Cloud Load Balancer] ──── HTTPS (443)
    │
    ▼
[Nginx VM]  ──────────────── Reverse Proxy
    │
    ├──► [Backend VM]        Express API + MongoDB + Redis
    │         │
    │         └──► [Job Queue] BullMQ + Redis
    │                   │
    ├──► [Worker VM 1]   │◄── Polls jobs
    ├──► [Worker VM 2]   │◄── Polls jobs
    └──► [Worker VM N]   │◄── Polls jobs
              │
              └──► Docker containers (ports 4000-5000)
```

---

## Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed → https://cloud.google.com/sdk/docs/install
- `docker` installed locally
- `git` installed
- Your repo: `https://github.com/kranthikiran885366/msd-project`

---

# PHASE 1 — GCP PROJECT SETUP

## Step 1 — Authenticate & Create Project

```bash
# Login
gcloud auth login

# Create project
gcloud projects create clouddeck-prod --name="CloudDeck Production"
gcloud config set project clouddeck-prod

# Link billing (replace BILLING_ACCOUNT_ID)
gcloud billing projects link clouddeck-prod \
  --billing-account=YOUR_BILLING_ACCOUNT_ID

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable iam.googleapis.com
```

## Step 2 — Create VPC Network

```bash
# Create private VPC
gcloud compute networks create clouddeck-vpc \
  --subnet-mode=custom \
  --bgp-routing-mode=regional

# Create subnet
gcloud compute networks subnets create clouddeck-subnet \
  --network=clouddeck-vpc \
  --range=10.0.1.0/24 \
  --region=us-central1

# Firewall: allow SSH
gcloud compute firewall-rules create allow-ssh \
  --network=clouddeck-vpc \
  --allow=tcp:22 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=ssh-allowed

# Firewall: allow HTTP/HTTPS from internet
gcloud compute firewall-rules create allow-http-https \
  --network=clouddeck-vpc \
  --allow=tcp:80,tcp:443 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=http-server

# Firewall: allow internal traffic between VMs
gcloud compute firewall-rules create allow-internal \
  --network=clouddeck-vpc \
  --allow=tcp:3001,tcp:6379,tcp:27017,tcp:4000-5000 \
  --source-ranges=10.0.1.0/24

# Firewall: allow health checks from GCP LB
gcloud compute firewall-rules create allow-health-checks \
  --network=clouddeck-vpc \
  --allow=tcp:3001 \
  --source-ranges=130.211.0.0/22,35.191.0.0/16 \
  --target-tags=backend
```

---

# PHASE 2 — DATABASE SETUP

## Step 3 — Create Backend VM (MongoDB + Redis + API)

```bash
# Create persistent disk for MongoDB
gcloud compute disks create clouddeck-mongodb-disk \
  --size=100GB \
  --type=pd-ssd \
  --zone=us-central1-a

# Create backend VM
gcloud compute instances create clouddeck-backend \
  --zone=us-central1-a \
  --machine-type=e2-standard-2 \
  --network=clouddeck-vpc \
  --subnet=clouddeck-subnet \
  --boot-disk-size=50GB \
  --boot-disk-type=pd-ssd \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --disk=name=clouddeck-mongodb-disk,auto-delete=no \
  --tags=backend,ssh-allowed,http-server \
  --scopes=https://www.googleapis.com/auth/cloud-platform
```

## Step 4 — Install Dependencies on Backend VM

```bash
# SSH into backend
gcloud compute ssh clouddeck-backend --zone=us-central1-a

# ── Inside the VM ──────────────────────────────────────

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git curl

# Install PM2
sudo npm install -g pm2

# Install Docker
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER
newgrp docker

# Install MongoDB 6
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] \
  https://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Redis
sudo apt-get install -y redis-server

# Install Nginx
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Mount MongoDB data disk
sudo mkfs.ext4 /dev/sdb
sudo mkdir -p /mnt/mongodb
sudo mount /dev/sdb /mnt/mongodb
sudo chown -R mongodb:mongodb /mnt/mongodb

# Persist mount on reboot
echo '/dev/sdb /mnt/mongodb ext4 defaults 0 2' | sudo tee -a /etc/fstab
```

## Step 5 — Configure MongoDB

```bash
# Configure MongoDB to use persistent disk
sudo tee /etc/mongod.conf << 'EOF'
storage:
  dbPath: /mnt/mongodb
  journal:
    enabled: true
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
net:
  port: 27017
  bindIp: 127.0.0.1,10.0.1.0/24
security:
  authorization: enabled
EOF

sudo systemctl start mongod
sudo systemctl enable mongod

# Create admin user
mongosh << 'EOF'
use admin
db.createUser({
  user: "clouddeck_admin",
  pwd: "CHANGE_THIS_STRONG_PASSWORD",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase"]
})
EOF
```

## Step 6 — Configure Redis

```bash
# Secure Redis
sudo tee -a /etc/redis/redis.conf << 'EOF'
bind 127.0.0.1 10.0.1.0/24
requirepass CHANGE_THIS_REDIS_PASSWORD
maxmemory 512mb
maxmemory-policy allkeys-lru
EOF

sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

---

# PHASE 3 — DEPLOY BACKEND API

## Step 7 — Clone & Configure Backend

```bash
# Clone repo
git clone https://github.com/kranthikiran885366/msd-project.git
cd msd-project/server

# Install dependencies
npm install

# Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Get this VM's internal IP
BACKEND_INTERNAL_IP=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip" -H "Metadata-Flavor: Google")

# Get external IP
BACKEND_EXTERNAL_IP=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip" -H "Metadata-Flavor: Google")

echo "Internal IP: $BACKEND_INTERNAL_IP"
echo "External IP: $BACKEND_EXTERNAL_IP"

# Create production .env
cat > .env << EOF
NODE_ENV=production
PORT=3001
BACKEND_PORT=3001

API_URL=http://${BACKEND_EXTERNAL_IP}:3001
CLIENT_URL=http://${BACKEND_EXTERNAL_IP}

MONGODB_URI=mongodb://clouddeck_admin:CHANGE_THIS_STRONG_PASSWORD@127.0.0.1:27017/clouddeck?authSource=admin

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD
REDIS_URL=redis://:CHANGE_THIS_REDIS_PASSWORD@127.0.0.1:6379

JWT_SECRET=${JWT_SECRET}

GITHUB_CLIENT_ID=Ov23likurvcQURsPd8YX
GITHUB_CLIENT_SECRET=820f78a1957b558383d18315c18525ab003ea167

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

DOCKER_ENABLED=true
DEPLOYMENT_STRATEGY=internal

NODE_ID=backend-1
REGION=us-central1
NODE_IP=${BACKEND_INTERNAL_IP}
BACKEND_URL=http://${BACKEND_INTERNAL_IP}:3001
MAX_CONCURRENT_JOBS=2
PORT_RANGE_START=4000
PORT_RANGE_END=5000

METRICS_USERNAME=admin
METRICS_PASSWORD=CHANGE_THIS_METRICS_PASSWORD

LOG_LEVEL=info
CLEANUP_INTERVAL_HOURS=24
EOF
```

## Step 8 — Start Backend with PM2

```bash
cd ~/msd-project/server

# Start backend
pm2 start index.js --name "clouddeck-backend" \
  --max-memory-restart 512M \
  --log /var/log/clouddeck/backend.log

# Save PM2 config and enable on boot
pm2 save
pm2 startup systemd -u $USER --hp $HOME
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Verify it's running
pm2 status
curl http://localhost:3001/health
```

## Step 9 — Configure Nginx on Backend VM

```bash
sudo tee /etc/nginx/sites-available/clouddeck << 'EOF'
server {
    listen 80;
    server_name _;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # Auth routes
    location /auth/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket for real-time logs
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/clouddeck /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

# PHASE 4 — WORKER NODES

## Step 10 — Create Worker VMs

```bash
# Run this on your LOCAL machine (not the backend VM)

# Create 2 worker VMs
for i in 1 2; do
  gcloud compute instances create clouddeck-worker-${i} \
    --zone=us-central1-a \
    --machine-type=e2-standard-2 \
    --network=clouddeck-vpc \
    --subnet=clouddeck-subnet \
    --boot-disk-size=100GB \
    --boot-disk-type=pd-ssd \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --tags=worker,ssh-allowed \
    --scopes=https://www.googleapis.com/auth/cloud-platform
  echo "Created worker ${i}"
done
```

## Step 11 — Setup Each Worker VM

```bash
# SSH into worker 1
gcloud compute ssh clouddeck-worker-1 --zone=us-central1-a

# ── Inside worker VM ───────────────────────────────────

# Update & install dependencies
sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git curl

# Install Docker
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER
newgrp docker

# Install Nginx
sudo apt-get install -y nginx

# Install PM2
sudo npm install -g pm2

# Clone repo
git clone https://github.com/kranthikiran885366/msd-project.git
cd msd-project/runner-agent
npm install

# Get worker's own IP
WORKER_IP=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip" -H "Metadata-Flavor: Google")
WORKER_ID=$(hostname)

# Create runner-agent .env
# REPLACE 10.0.1.X with your backend VM's internal IP
cat > .env << EOF
BACKEND_URL=http://BACKEND_INTERNAL_IP:3001
NODE_ID=${WORKER_ID}
REGION=us-central1
MAX_CONCURRENT_JOBS=2
NODE_IP=${WORKER_IP}
PORT_RANGE_START=4000
PORT_RANGE_END=5000
EOF

# Create nginx container routing directory
sudo mkdir -p /etc/nginx/container-routes

# Configure Nginx for container routing
sudo tee /etc/nginx/nginx.conf << 'NGINXEOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/container-routes/*.conf;

    server {
        listen 80 default_server;
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
NGINXEOF

sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Start runner agent
pm2 start index.js --name "clouddeck-runner" \
  --max-memory-restart 256M \
  --log /var/log/clouddeck-runner.log

pm2 save
pm2 startup systemd -u $USER --hp $HOME
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Verify agent started
pm2 status
```

Repeat Step 11 for `clouddeck-worker-2`.

---

# PHASE 5 — FRONTEND DEPLOYMENT

## Step 12 — Deploy Frontend (Next.js)

```bash
# SSH into backend VM
gcloud compute ssh clouddeck-backend --zone=us-central1-a

cd ~/msd-project

# Create frontend .env
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=http://BACKEND_EXTERNAL_IP:3001
NODE_ENV=production
EOF

# Install frontend deps and build
npm install
npm run build

# Start frontend with PM2
pm2 start npm --name "clouddeck-frontend" -- start -- -p 3000
pm2 save

# Update Nginx to also serve frontend
sudo tee /etc/nginx/sites-available/clouddeck << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }

    # Auth
    location /auth/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Health
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
EOF

sudo nginx -t && sudo systemctl reload nginx
```

---

# PHASE 6 — SSL / HTTPS

## Step 13 — Set Up SSL with Let's Encrypt

> You need a domain name pointing to your backend VM's external IP first.
> Update your domain's A record: `yourdomain.com → BACKEND_EXTERNAL_IP`

```bash
# SSH into backend VM
gcloud compute ssh clouddeck-backend --zone=us-central1-a

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --non-interactive --agree-tos -m your@email.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Update GitHub OAuth callback URL in GitHub settings:
# https://github.com/settings/developers
# Callback URL: https://yourdomain.com/auth/github/callback

# Update .env with HTTPS URLs
cd ~/msd-project/server
sed -i "s|API_URL=.*|API_URL=https://yourdomain.com|" .env
sed -i "s|CLIENT_URL=.*|CLIENT_URL=https://yourdomain.com|" .env
pm2 restart clouddeck-backend
```

---

# PHASE 7 — VERIFY FULL SYSTEM

## Step 14 — Health Checks

```bash
# From your local machine — replace with your actual IPs/domain

BACKEND_IP="YOUR_BACKEND_EXTERNAL_IP"

# 1. Backend health
curl http://$BACKEND_IP/health
# Expected: {"status":"ok","timestamp":"..."}

# 2. API version
curl http://$BACKEND_IP/version

# 3. Config check (no secrets exposed)
curl http://$BACKEND_IP/config/check

# 4. Node status (should show workers registered)
curl http://$BACKEND_IP/api/nodes

# 5. Queue stats
curl http://$BACKEND_IP/api/jobs/stats/queue
```

## Step 15 — Register Worker Nodes Manually (if not auto-registered)

```bash
BACKEND_IP="YOUR_BACKEND_EXTERNAL_IP"
WORKER1_IP="YOUR_WORKER1_INTERNAL_IP"
WORKER2_IP="YOUR_WORKER2_INTERNAL_IP"

# Register worker 1
curl -X POST http://$BACKEND_IP/api/nodes/register \
  -H "Content-Type: application/json" \
  -d "{
    \"nodeId\": \"clouddeck-worker-1\",
    \"hostname\": \"${WORKER1_IP}\",
    \"region\": \"us-central1\",
    \"totalCapacity\": {
      \"cpu\": 2,
      \"memory\": 7680,
      \"storage\": 102400
    }
  }"

# Register worker 2
curl -X POST http://$BACKEND_IP/api/nodes/register \
  -H "Content-Type: application/json" \
  -d "{
    \"nodeId\": \"clouddeck-worker-2\",
    \"hostname\": \"${WORKER2_IP}\",
    \"region\": \"us-central1\",
    \"totalCapacity\": {
      \"cpu\": 2,
      \"memory\": 7680,
      \"storage\": 102400
    }
  }"
```

## Step 16 — Test Full Deployment Flow

```bash
# 1. Create a project via API
curl -X POST http://$BACKEND_IP/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "test-app",
    "framework": "Next.js",
    "repository": {
      "provider": "github",
      "name": "your-repo",
      "owner": "your-username",
      "branch": "main"
    }
  }'

# 2. Trigger a deployment
curl -X POST http://$BACKEND_IP/api/deployments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectId": "PROJECT_ID_FROM_ABOVE",
    "gitBranch": "main",
    "gitCommit": "HEAD"
  }'

# 3. Watch deployment status
curl http://$BACKEND_IP/api/deployments/DEPLOYMENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

# PHASE 8 — MONITORING

## Step 17 — View Logs

```bash
# Backend logs
gcloud compute ssh clouddeck-backend --zone=us-central1-a -- pm2 logs clouddeck-backend

# Frontend logs
gcloud compute ssh clouddeck-backend --zone=us-central1-a -- pm2 logs clouddeck-frontend

# Worker 1 logs
gcloud compute ssh clouddeck-worker-1 --zone=us-central1-a -- pm2 logs clouddeck-runner

# Nginx logs
gcloud compute ssh clouddeck-backend --zone=us-central1-a -- sudo tail -f /var/log/nginx/error.log

# MongoDB logs
gcloud compute ssh clouddeck-backend --zone=us-central1-a -- sudo tail -f /var/log/mongodb/mongod.log
```

## Step 18 — PM2 Monitoring Dashboard

```bash
# SSH into any VM
gcloud compute ssh clouddeck-backend --zone=us-central1-a

# Live dashboard
pm2 monit

# Status overview
pm2 status

# Restart all
pm2 restart all
```

---

# PHASE 9 — BACKUP & MAINTENANCE

## Step 19 — Automated MongoDB Backups

```bash
# SSH into backend VM
gcloud compute ssh clouddeck-backend --zone=us-central1-a

# Create backup script
sudo tee /usr/local/bin/backup-mongodb.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/mongodb-backup-${DATE}"
mongodump --uri="mongodb://clouddeck_admin:CHANGE_THIS_STRONG_PASSWORD@127.0.0.1:27017/clouddeck?authSource=admin" \
  --out="${BACKUP_DIR}"
tar -czf "/tmp/clouddeck-backup-${DATE}.tar.gz" "${BACKUP_DIR}"
rm -rf "${BACKUP_DIR}"
echo "Backup created: /tmp/clouddeck-backup-${DATE}.tar.gz"
EOF

sudo chmod +x /usr/local/bin/backup-mongodb.sh

# Schedule daily backup at 2am
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-mongodb.sh") | crontab -
```

## Step 20 — GCP Disk Snapshots

```bash
# Run from local machine
# Create snapshot of MongoDB disk
gcloud compute disks snapshot clouddeck-mongodb-disk \
  --zone=us-central1-a \
  --snapshot-names=clouddeck-mongodb-$(date +%Y%m%d)

# List snapshots
gcloud compute snapshots list
```

---

# PHASE 10 — SCALING

## Step 21 — Add More Workers

```bash
# Create additional worker
gcloud compute instances create clouddeck-worker-3 \
  --zone=us-central1-b \
  --machine-type=e2-standard-2 \
  --network=clouddeck-vpc \
  --subnet=clouddeck-subnet \
  --boot-disk-size=100GB \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --tags=worker,ssh-allowed

# Then repeat Step 11 for this new worker
```

## Step 22 — Scale Backend VM

```bash
# Stop → resize → start
gcloud compute instances stop clouddeck-backend --zone=us-central1-a

gcloud compute instances set-machine-type clouddeck-backend \
  --machine-type=e2-standard-4 \
  --zone=us-central1-a

gcloud compute instances start clouddeck-backend --zone=us-central1-a
```

---

# QUICK REFERENCE

## All VM IPs

```bash
# Get all instance IPs at once
gcloud compute instances list --filter="name~clouddeck" \
  --format="table(name,zone,networkInterfaces[0].networkIP,networkInterfaces[0].accessConfigs[0].natIP)"
```

## Service Status Checklist

```bash
# On backend VM — run all checks
gcloud compute ssh clouddeck-backend --zone=us-central1-a -- bash << 'EOF'
echo "=== PM2 Processes ==="
pm2 status

echo "=== MongoDB ==="
sudo systemctl status mongod --no-pager

echo "=== Redis ==="
redis-cli -a CHANGE_THIS_REDIS_PASSWORD ping

echo "=== Nginx ==="
sudo systemctl status nginx --no-pager

echo "=== Backend Health ==="
curl -s http://localhost:3001/health

echo "=== Disk Usage ==="
df -h /mnt/mongodb
EOF
```

## Cost Estimate (us-central1)

| Resource | Type | Monthly Cost |
|---|---|---|
| Backend VM | e2-standard-2 | ~$50 |
| Worker VM x2 | e2-standard-2 | ~$100 |
| MongoDB Disk | 100GB SSD | ~$17 |
| Boot Disks x3 | 50-100GB SSD | ~$25 |
| Network egress | ~10GB | ~$1 |
| **Total** | | **~$193/month** |

---

# TROUBLESHOOTING

## Backend won't start
```bash
pm2 logs clouddeck-backend --lines 50
# Check: MongoDB connected? Redis connected? Port 3001 free?
```

## Workers not picking up jobs
```bash
# Check runner agent logs
pm2 logs clouddeck-runner --lines 50
# Check: BACKEND_URL correct? Backend reachable from worker?
ping BACKEND_INTERNAL_IP
curl http://BACKEND_INTERNAL_IP:3001/health
```

## MongoDB connection refused
```bash
sudo systemctl status mongod
sudo journalctl -u mongod -n 50
# Check: /mnt/mongodb mounted? Correct credentials in .env?
```

## Redis connection refused
```bash
redis-cli -a YOUR_REDIS_PASSWORD ping
sudo systemctl status redis-server
```

## Nginx 502 Bad Gateway
```bash
sudo nginx -t
pm2 status  # Is backend/frontend running?
sudo tail -20 /var/log/nginx/error.log
```

## GitHub OAuth not working
```bash
# Verify callback URL in GitHub settings matches exactly:
# http://YOUR_IP/auth/github/callback  (or https if SSL)
# Settings → Developer settings → OAuth Apps → your app
```

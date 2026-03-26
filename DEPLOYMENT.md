# Deployment Guide - Badminton Scoring Application

## Overview

This guide covers deploying the badminton scoring application to a self-hosted Linux server (Ubuntu/Debian). The application can be deployed to any VPS or dedicated server.

## Server Requirements

### Minimum Specifications
- **OS**: Ubuntu 20.04+ or Debian 11+
- **CPU**: 2 cores
- **RAM**: 2GB (4GB recommended)
- **Storage**: 10GB (20GB recommended)
- **Network**: Public IP with ports 80, 443, 5432 accessible

### Software Requirements
- Node.js 20+
- PostgreSQL 14+
- Nginx or Caddy (reverse proxy)
- PM2 (process manager)
- Git

## Deployment Options

### Option 1: Traditional Deployment (Recommended)
- Application: Node.js with PM2
- Database: PostgreSQL (separate or same server)
- Reverse Proxy: Nginx with SSL

### Option 2: Docker Deployment
- Application + Database in containers
- Docker Compose orchestration
- Nginx on host or in container

This guide covers **Option 1** (traditional deployment).

---

## Step-by-Step Deployment

### 1. Prepare Server

#### Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

#### Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x
```

#### Install pnpm
```bash
sudo npm install -g pnpm
pnpm --version
```

#### Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Install PM2
```bash
sudo npm install -g pm2
pm2 --version
```

#### Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Configure Database

#### Create Database and User
```bash
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE badminton_scoring;

-- Create user with password
CREATE USER badminton_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE badminton_scoring TO badminton_user;

-- Exit
\q
```

#### Configure PostgreSQL for Remote Connections (if needed)
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Find and update:
```conf
listen_addresses = 'localhost'  # or '*' for all interfaces
```

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Add:
```conf
host    badminton_scoring    badminton_user    127.0.0.1/32    md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 3. Create Application User

```bash
sudo useradd -m -s /bin/bash badminton
sudo su - badminton
```

### 4. Deploy Application

#### Clone Repository
```bash
cd /home/badminton
git clone https://github.com/yourusername/badminton-scoring-app.git app
cd app
```

Or upload your code:
```bash
# From your local machine:
rsync -avz --exclude node_modules --exclude .git \
  /path/to/badmintion/ badminton@your-server:/home/badminton/app/
```

#### Install Dependencies
```bash
cd /home/badminton/app
pnpm install --prod
```

#### Configure Environment
```bash
cp .env.example .env.production
nano .env.production
```

Update with production values:
```env
# Database
DATABASE_URL="postgresql://badminton_user:your_secure_password_here@localhost:5432/badminton_scoring?schema=public"

# NextAuth
NEXTAUTH_SECRET="generate_with_openssl_rand_base64_32"
NEXTAUTH_URL="https://yourdomain.com"

# Node Environment
NODE_ENV="production"
```

Generate secure secret:
```bash
openssl rand -base64 32
```

#### Run Database Migrations
```bash
export DATABASE_URL="postgresql://badminton_user:your_password@localhost:5432/badminton_scoring?schema=public"
npx prisma migrate deploy
npx prisma generate
```

#### Build Application
```bash
pnpm build
```

Verify build:
```bash
ls -la .next
# Should see built files
```

### 5. Configure PM2

Create PM2 ecosystem file:
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'badminton-app',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/home/badminton/app',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env_file: '.env.production',
    error_file: '/home/badminton/logs/error.log',
    out_file: '/home/badminton/logs/output.log',
    log_file: '/home/badminton/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
  }]
}
```

Create logs directory:
```bash
mkdir -p /home/badminton/logs
```

#### Start Application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

#### Verify Application is Running
```bash
pm2 status
pm2 logs badminton-app
curl http://localhost:3000
```

### 6. Configure Nginx Reverse Proxy

Exit from badminton user:
```bash
exit  # Return to your sudo user
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/badminton-app
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/badminton-app-access.log;
    error_log /var/log/nginx/badminton-app-error.log;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }

    # Static files (Next.js handles this, but good to have)
    location /_next/static {
        proxy_pass http://localhost:3000/_next/static;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/badminton-app /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### 7. Set Up SSL with Let's Encrypt

#### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts to:
- Enter email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

#### Verify Auto-Renewal
```bash
sudo certbot renew --dry-run
```

Certbot will automatically renew certificates before expiry.

### 8. Configure Firewall

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

### 9. Set Up Database Backups

Create backup script:
```bash
sudo nano /usr/local/bin/backup-badminton-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/badminton/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="badminton_scoring"
DB_USER="badminton_user"
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD='your_password' pg_dump -U $DB_USER -h localhost $DB_NAME | \
  gzip > $BACKUP_DIR/badminton_db_$DATE.sql.gz

# Remove old backups
find $BACKUP_DIR -name "badminton_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: badminton_db_$DATE.sql.gz"
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-badminton-db.sh
```

Add to crontab (daily at 2 AM):
```bash
sudo crontab -e
```

Add line:
```
0 2 * * * /usr/local/bin/backup-badminton-db.sh >> /var/log/badminton-backup.log 2>&1
```

### 10. Monitoring Setup

#### PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### System Monitoring Script
```bash
sudo nano /usr/local/bin/check-badminton-app.sh
```

```bash
#!/bin/bash
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "Application unhealthy, restarting..."
    pm2 restart badminton-app
    echo "Application restarted at $(date)" >> /var/log/badminton-restart.log
fi
```

```bash
sudo chmod +x /usr/local/bin/check-badminton-app.sh
```

Add to crontab (every 5 minutes):
```bash
sudo crontab -e
```

```
*/5 * * * * /usr/local/bin/check-badminton-app.sh
```

---

## Post-Deployment

### 1. Create Initial User

Access your application at `https://yourdomain.com` and register the first user via the registration page.

### 2. Verify Functionality

- ✅ Can register new user
- ✅ Can login
- ✅ Can create match
- ✅ Can score match
- ✅ Can undo points
- ✅ Can view match history

### 3. Performance Testing

```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Test homepage
ab -n 1000 -c 10 https://yourdomain.com/

# Test API
ab -n 100 -c 5 https://yourdomain.com/api/health
```

### 4. Security Hardening

#### Disable Root Login
```bash
sudo nano /etc/ssh/sshd_config
```

Set:
```
PermitRootLogin no
PasswordAuthentication no  # Use SSH keys only
```

```bash
sudo systemctl restart sshd
```

#### Enable Fail2Ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### Keep System Updated
```bash
# Enable automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Maintenance

### Update Application

```bash
sudo su - badminton
cd /home/badminton/app

# Pull latest code
git pull origin main

# Install dependencies
pnpm install --prod

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Build
pnpm build

# Restart
pm2 restart badminton-app

# Monitor
pm2 logs badminton-app
```

### View Logs

```bash
# PM2 logs
pm2 logs badminton-app

# Nginx access logs
sudo tail -f /var/log/nginx/badminton-app-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/badminton-app-error.log

# System logs
journalctl -u nginx -f
```

### Restart Services

```bash
# Application
pm2 restart badminton-app

# Nginx
sudo systemctl restart nginx

# PostgreSQL
sudo systemctl restart postgresql
```

### Restore from Backup

```bash
# Stop application
pm2 stop badminton-app

# Restore database
gunzip < /home/badminton/backups/badminton_db_YYYYMMDD_HHMMSS.sql.gz | \
  PGPASSWORD='your_password' psql -U badminton_user -h localhost badminton_scoring

# Restart application
pm2 restart badminton-app
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs badminton-app --lines 100

# Check if port is in use
sudo lsof -i :3000

# Check environment variables
pm2 show badminton-app
```

### Database Connection Issues

```bash
# Test database connection
PGPASSWORD='your_password' psql -U badminton_user -h localhost badminton_scoring -c "SELECT 1"

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Reload configuration
sudo systemctl reload nginx
```

### SSL Certificate Issues

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

### High Memory Usage

```bash
# Check memory
free -h

# Check application memory
pm2 show badminton-app

# Restart if needed
pm2 restart badminton-app
```

---

## Performance Optimization

### 1. Enable Nginx Caching

Add to Nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=badminton_cache:10m max_size=1g inactive=60m;

location / {
    proxy_cache badminton_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_bypass $http_cache_control;
    # ... rest of proxy config
}
```

### 2. Enable Gzip Compression

Add to Nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 3. Database Connection Pooling

Already configured in Prisma (`src/lib/db/client.ts`).

### 4. PM2 Cluster Mode

Already using 2 instances in `ecosystem.config.js`.

---

## Monitoring & Alerts

### PM2 Plus (Optional)

```bash
pm2 plus
# Follow instructions to link to PM2 dashboard
```

### Custom Health Monitoring

Use the `/api/health` endpoint with monitoring services:
- UptimeRobot
- Pingdom
- StatusCake
- Custom scripts

Example monitoring script:
```bash
#!/bin/bash
HEALTH_URL="https://yourdomain.com/api/health"
SLACK_WEBHOOK="your_slack_webhook_url"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -ne 200 ]; then
    curl -X POST $SLACK_WEBHOOK \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"Badminton App is DOWN! Status: $RESPONSE\"}"
fi
```

---

## Security Checklist

- ✅ SSL/TLS enabled
- ✅ Firewall configured
- ✅ SSH key-only authentication
- ✅ Database password is strong
- ✅ NEXTAUTH_SECRET is random and secure
- ✅ Automatic security updates enabled
- ✅ Fail2Ban installed
- ✅ Regular backups configured
- ✅ Non-root user for application
- ✅ Security headers in Nginx

---

## Cost Estimation

### Hosting Options

**VPS Providers:**
- **DigitalOcean**: $12/month (2GB RAM, 1 CPU)
- **Linode**: $12/month (2GB RAM, 1 CPU)
- **Vultr**: $12/month (2GB RAM, 1 CPU)
- **Hetzner**: €4.51/month (~$5/month, 2GB RAM, 1 CPU)

**Recommended**: Hetzner CX11 (€4.51/month) for small deployments

### Additional Costs
- Domain name: $10-15/year
- SSL: Free (Let's Encrypt)
- Backups: Included in VPS pricing

**Total Monthly Cost**: ~$5-15/month

---

## Support & Resources

- Application health: `https://yourdomain.com/api/health`
- PM2 documentation: https://pm2.keymetrics.io/
- Nginx documentation: https://nginx.org/en/docs/
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Let's Encrypt: https://letsencrypt.org/

---

## Quick Commands Reference

```bash
# Start application
pm2 start badminton-app

# Restart application
pm2 restart badminton-app

# Stop application
pm2 stop badminton-app

# View logs
pm2 logs badminton-app

# Check status
pm2 status

# Reload Nginx
sudo systemctl reload nginx

# Restart PostgreSQL
sudo systemctl restart postgresql

# Run database backup
/usr/local/bin/backup-badminton-db.sh

# Update application
cd /home/badminton/app && git pull && pnpm install && pnpm build && pm2 restart badminton-app
```

---

**Deployment Complete!** Your badminton scoring application is now live and production-ready. 🏸

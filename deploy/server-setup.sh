#!/usr/bin/env bash
# One-time setup of an Ubuntu 24.04 server (e.g. Oracle Cloud Always Free) for the shop:
# Node 22 + pnpm, PostgreSQL 16, nginx reverse proxy, systemd service, daily backups.
# Safe to run again: existing users, databases and the .env file are kept.
#
# Usage (on the server): sudo bash server-setup.sh alchimiaradacinilor.ro
set -euo pipefail

DOMAIN="${1:?usage: sudo bash server-setup.sh <domain>}"
APP_USER=alchimia
APP_DIR=/srv/alchimia
DB_NAME=alchimia
DB_USER=alchimia
PORT=3000

export DEBIAN_FRONTEND=noninteractive

# ── Swap (small VMs run out of memory during `next build`) ───────────────────
mem_kb=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
if [ "$mem_kb" -lt 4000000 ] && [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── Packages ─────────────────────────────────────────────────────────────────
apt-get update
apt-get -y upgrade
apt-get install -y ca-certificates curl openssl nginx postgresql certbot python3-certbot-nginx \
  unattended-upgrades fail2ban

# ── Automatic security updates ───────────────────────────────────────────────
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

# ── SSH: keys only, no root login; fail2ban bans brute-force sources ─────────
# 01- sorts before cloud-init's drop-in, and sshd keeps the first value it reads.
cat > /etc/ssh/sshd_config.d/01-alchimia-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF
if sshd -t; then
  systemctl reload ssh 2>/dev/null || true
else
  rm -f /etc/ssh/sshd_config.d/01-alchimia-hardening.conf
fi
systemctl enable --now fail2ban

if ! node --version 2>/dev/null | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
npm install -g pnpm@10.33.0

# ── Firewall: Oracle's Ubuntu images reject everything but SSH in iptables ───
reject_line=$(iptables -L INPUT --line-numbers -n | awk '$2 == "REJECT" { print $1; exit }')
if [ -n "$reject_line" ]; then
  for p in 443 80; do
    if ! iptables -C INPUT -p tcp --dport "$p" -m state --state NEW -j ACCEPT 2>/dev/null; then
      iptables -I INPUT "$reject_line" -p tcp --dport "$p" -m state --state NEW -j ACCEPT
    fi
  done
  if command -v netfilter-persistent >/dev/null; then netfilter-persistent save; fi
fi

# ── App user and directories ─────────────────────────────────────────────────
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "$APP_DIR" --shell /bin/bash "$APP_USER"
fi
mkdir -p "$APP_DIR"/releases "$APP_DIR"/shared/storage/uploads "$APP_DIR"/backups
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod 750 "$APP_DIR"

# ── Database and .env (written once; edit it afterwards, then redeploy) ──────
ENV_FILE="$APP_DIR/shared/.env"
if [ ! -f "$ENV_FILE" ]; then
  db_pass=$(openssl rand -hex 24)
  if runuser -u postgres -- psql -tAc "select 1 from pg_roles where rolname = '$DB_USER'" | grep -q 1; then
    runuser -u postgres -- psql -c "alter role $DB_USER login password '$db_pass'"
  else
    runuser -u postgres -- psql -c "create role $DB_USER login password '$db_pass'"
  fi
  if ! runuser -u postgres -- psql -tAc "select 1 from pg_database where datname = '$DB_NAME'" | grep -q 1; then
    runuser -u postgres -- createdb -O "$DB_USER" "$DB_NAME"
  fi
  cat > "$ENV_FILE" <<EOF
# Production environment — see .env.example in the repository for every variable.
DATABASE_URL="postgresql://$DB_USER:$db_pass@localhost:5432/$DB_NAME?schema=public"
APP_URL="https://$DOMAIN"
AUTH_SECRET="$(openssl rand -base64 32)"
EMAIL_PROVIDER="console"
EMAIL_FROM=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
STORAGE_DRIVER="local"
SEED_DEMO="false"
EOF
  chown "$APP_USER:$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

# ── systemd service ──────────────────────────────────────────────────────────
cat > /etc/systemd/system/alchimia.service <<EOF
[Unit]
Description=Alchimia Radacinilor (Next.js)
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/current
Environment=NODE_ENV=production
ExecStart=$APP_DIR/current/node_modules/.bin/next start -H 127.0.0.1 -p $PORT
Restart=always
RestartSec=5
UMask=0027

# Sandbox: the app can only write under $APP_DIR (build cache, uploads).
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=$APP_DIR
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectKernelLogs=true
ProtectControlGroups=true
ProtectClock=true
ProtectHostname=true
RestrictSUIDSGID=true
RestrictNamespaces=true
RestrictRealtime=true
LockPersonality=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
CapabilityBoundingSet=

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable alchimia.service

# ── nginx ────────────────────────────────────────────────────────────────────
# The app takes the client IP from the first X-Forwarded-For hop (src/lib/request.ts),
# so nginx overwrites the header instead of appending a client-supplied one.
# Certbot adds the HTTPS server block to this file (deploy.sh https).
if [ ! -f /etc/nginx/sites-available/alchimia ]; then
  cat > /etc/nginx/sites-available/alchimia <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    server_tokens off;

    # Server Actions accept up to 6 MB (review photos).
    client_max_body_size 8m;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
    }
}
EOF
fi
ln -sf /etc/nginx/sites-available/alchimia /etc/nginx/sites-enabled/alchimia
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ── Daily backups (database + uploads), kept 14 days ─────────────────────────
# Also purges expired sessions and one-time links (they hold IPs and user agents).
cat > /etc/cron.daily/alchimia-backup <<EOF
#!/bin/sh
set -e
umask 077
runuser -u postgres -- psql -q -d $DB_NAME \
  -c 'DELETE FROM sessions WHERE "expiresAt" < now(); DELETE FROM verifications WHERE "expiresAt" < now();'
d=$APP_DIR/backups
day=\$(date +%F)
runuser -u postgres -- pg_dump -Fc $DB_NAME > "\$d/db-\$day.dump"
tar -czf "\$d/uploads-\$day.tar.gz" -C $APP_DIR/shared storage
find "\$d" -type f -mtime +14 -delete
EOF
chmod 755 /etc/cron.daily/alchimia-backup

echo
echo "Server ready. Next: deploy the app (deploy/deploy.sh --seed), then point DNS"
echo "and run deploy/deploy.sh https once the domain resolves to this server."

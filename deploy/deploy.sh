#!/usr/bin/env bash
# Deploys the shop to a server prepared by server-setup.sh. Run from Git Bash (Windows)
# or any POSIX shell, from anywhere in the repository.
#
#   deploy/deploy.sh setup     one-time server setup (runs server-setup.sh over SSH)
#   deploy/deploy.sh --seed    first release: build, migrate, seed structural data
#   deploy/deploy.sh           every later release: build, migrate, restart
#   deploy/deploy.sh https     Let's Encrypt certificate, once the domain points to the server
#                              (set CERTBOT_EMAIL for expiry warnings)
#   deploy/deploy.sh admin     create/promote the admin (reads ADMIN_EMAIL, ADMIN_PASSWORD)
#   deploy/deploy.sh logs      last 100 lines of the app log
#
# The SSH target comes from $DEPLOY_HOST or deploy/.target (e.g. ubuntu@203.0.113.10),
# the key from $DEPLOY_SSH_KEY (default ~/.ssh/alchimia_oracle).
# Releases contain the tracked files of the working tree (uncommitted edits included).
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN=alchimiaradacinilor.ro
APP_DIR=/srv/alchimia
TARGET="${DEPLOY_HOST:-$(tr -d '\r\n' < deploy/.target 2>/dev/null || true)}"
if [ -z "$TARGET" ]; then
  echo "Set DEPLOY_HOST=ubuntu@<ip> or write it to deploy/.target" >&2
  exit 1
fi
KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/alchimia_oracle}"

ssh_() { ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "$TARGET" "$@"; }

case "${1:-}" in
  setup)
    tr -d '\r' < deploy/server-setup.sh | ssh_ "sudo bash -s -- $DOMAIN"
    exit
    ;;
  https)
    # CERTBOT_EMAIL gets Let's Encrypt's warnings if automatic renewal ever fails.
    account="--register-unsafely-without-email"
    if [ -n "${CERTBOT_EMAIL:-}" ]; then account="-m $CERTBOT_EMAIL"; fi
    ssh_ "sudo certbot --nginx --non-interactive --agree-tos $account \
      --redirect -d $DOMAIN -d www.$DOMAIN"
    exit
    ;;
  admin)
    : "${ADMIN_EMAIL:?set ADMIN_EMAIL}" "${ADMIN_PASSWORD:?set ADMIN_PASSWORD}"
    # Credentials go over stdin, not the remote command line.
    printf '%s\n%s\n' "$ADMIN_EMAIL" "$ADMIN_PASSWORD" | ssh_ "sudo -u alchimia -H bash -c \
      'read -r e; read -r p; cd $APP_DIR/current && ADMIN_EMAIL=\"\$e\" ADMIN_PASSWORD=\"\$p\" pnpm admin:create'"
    exit
    ;;
  logs)
    ssh_ "sudo journalctl -u alchimia -n 100 --no-pager"
    exit
    ;;
  "" | --seed) ;;
  *)
    echo "Unknown command: $1" >&2
    exit 1
    ;;
esac
seed=$([ "${1:-}" = --seed ] && echo 1 || echo 0)
release=$(date +%Y%m%d%H%M%S)

echo "→ Uploading release $release"
git ls-files -z | tar --null --ignore-failed-read -T - -czf - | ssh_ "cat > /tmp/alchimia-$release.tgz"

echo "→ Installing, migrating and building on the server"
# Wrapped in braces so bash reads the whole script before any command can consume stdin.
ssh_ "sudo -u alchimia -H bash -s -- $release $seed" <<'REMOTE'
{
  set -euo pipefail
  release=$1
  seed=$2
  app=/srv/alchimia
  r=$app/releases/$release

  mkdir -p "$r"
  tar -xzf "/tmp/alchimia-$release.tgz" -C "$r"
  ln -s "$app/shared/.env" "$r/.env"
  ln -s "$app/shared/storage" "$r/storage"
  cd "$r"

  pnpm install --frozen-lockfile
  pnpm db:deploy
  if [ "$seed" = 1 ]; then pnpm db:seed; fi
  pnpm build

  ln -sfn "$r" "$app/current"
  # Keep the three newest releases (rollback: point `current` at an older one, restart).
  ls -1dt "$app"/releases/* | tail -n +4 | xargs -r rm -rf
  exit
}
REMOTE

echo "→ Restarting"
ssh_ "rm -f /tmp/alchimia-$release.tgz; sudo systemctl restart alchimia \
  && for i in \$(seq 30); do curl -fsS -o /dev/null http://127.0.0.1:3000/ && exit 0; sleep 2; done; \
  sudo journalctl -u alchimia -n 50 --no-pager; exit 1"
echo "✓ Release $release is live"

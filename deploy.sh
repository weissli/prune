#!/bin/bash

# Configuration
# Read from .env file if it exists
if [ -f .env.deploy ]; then
    source .env.deploy
fi

FTP_HOST=${FTP_HOST:-""}
FTP_USER=${FTP_USER:-""}
FTP_PASS=${FTP_PASS:-""}
REMOTE_DIR=${REMOTE_DIR:-"/public_html"}

if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ]; then
    echo "Missing configuration!"
    echo "Please set FTP_HOST and FTP_USER variables in a .env.deploy file"
    echo "Example .env.deploy content:"
    echo "  FTP_HOST=\"your-ftp-host.com\""
    echo "  FTP_USER=\"your-username\""
    echo "  FTP_PASS=\"your-password\""
    echo "  REMOTE_DIR=\"/public_html\""
    exit 1
fi

if [ -z "$FTP_PASS" ]; then
    read -sp "Enter FTP password for $FTP_USER: " FTP_PASS
    echo ""
fi

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo "Error: 'lftp' is not installed. Please install it first."
    echo "On Ubuntu/Debian: sudo apt install lftp"
    exit 1
fi

echo "Building application..."
npm run build

echo "Setting permissions for static files..."
chmod -R 755 dist
find dist -type f -exec chmod 644 {} \;

echo "Syncing static files to $FTP_HOST..."
lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" <<EOF
set ssl:verify-certificate no
mirror -R -p dist/ "$REMOTE_DIR"
bye
EOF

echo "Deployment finished!"

#!/bin/bash

# release.sh - Full Backup + Deploy Workflow

UPDATE_NAME=$1

if [ -z "$UPDATE_NAME" ]; then
    echo "Usage: ./release.sh <feature_update_name>"
    echo "Example: ./release.sh grouped_tasks_fix"
    exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/src_${TIMESTAMP}_${UPDATE_NAME}"

echo "1. Creating backup of src/ to $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r src/* "$BACKUP_DIR/"

echo "2. Triggering build and deploy..."
if [ -f ./deploy.sh ]; then
    ./deploy.sh
else
    echo "Error: ./deploy.sh not found!"
    exit 1
fi

echo "Release complete!"

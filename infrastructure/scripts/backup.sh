#!/bin/bash

# Trading Bot Backup Script
# This script creates backups of the trading bot data and configuration

set -e

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +'%Y%m%d-%H%M%S')
BACKUP_NAME="trading-bot-backup-$TIMESTAMP"
DOCKER_COMPOSE_FILE="infrastructure/docker/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup database
backup_database() {
    log "Backing up database..."
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps postgres | grep -q "Up"; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U postgres trading_bot > "$BACKUP_DIR/$BACKUP_NAME-database.sql"
        log "Database backup completed: $BACKUP_DIR/$BACKUP_NAME-database.sql"
    else
        warning "PostgreSQL container is not running, skipping database backup"
    fi
}

# Backup configuration files
backup_config() {
    log "Backing up configuration files..."
    
    CONFIG_DIR="$BACKUP_DIR/$BACKUP_NAME-config"
    mkdir -p "$CONFIG_DIR"
    
    # Copy configuration files
    if [ -d "config" ]; then
        cp -r config/* "$CONFIG_DIR/"
        log "Configuration files backed up to: $CONFIG_DIR"
    fi
    
    # Copy Docker Compose file
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        cp "$DOCKER_COMPOSE_FILE" "$CONFIG_DIR/"
        log "Docker Compose file backed up"
    fi
    
    # Copy environment files
    if [ -f ".env" ]; then
        cp .env "$CONFIG_DIR/"
        log "Environment file backed up"
    fi
}

# Backup application data
backup_data() {
    log "Backing up application data..."
    
    DATA_DIR="$BACKUP_DIR/$BACKUP_NAME-data"
    mkdir -p "$DATA_DIR"
    
    # Backup logs
    if [ -d "data/logs" ]; then
        cp -r data/logs/* "$DATA_DIR/" 2>/dev/null || true
        log "Log files backed up"
    fi
    
    # Backup backtest results
    if [ -d "data/backtest_results" ]; then
        cp -r data/backtest_results/* "$DATA_DIR/" 2>/dev/null || true
        log "Backtest results backed up"
    fi
    
    # Backup historical data
    if [ -d "data/historical" ]; then
        cp -r data/historical/* "$DATA_DIR/" 2>/dev/null || true
        log "Historical data backed up"
    fi
}

# Backup Docker volumes
backup_volumes() {
    log "Backing up Docker volumes..."
    
    VOLUMES_DIR="$BACKUP_DIR/$BACKUP_NAME-volumes"
    mkdir -p "$VOLUMES_DIR"
    
    # List of volumes to backup
    VOLUMES=("postgres_data" "redis_data" "prometheus_data" "grafana_data")
    
    for volume in "${VOLUMES[@]}"; do
        if docker volume ls | grep -q "$volume"; then
            log "Backing up volume: $volume"
            docker run --rm -v "$volume":/data -v "$(pwd)/$VOLUMES_DIR":/backup alpine tar czf "/backup/$volume.tar.gz" -C /data .
        else
            warning "Volume $volume not found, skipping"
        fi
    done
}

# Create backup archive
create_archive() {
    log "Creating backup archive..."
    
    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME-"*
    cd ..
    
    # Remove individual backup directories
    rm -rf "$BACKUP_DIR/$BACKUP_NAME-"*
    
    log "Backup archive created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (keeping last 7 days)..."
    
    find "$BACKUP_DIR" -name "trading-bot-backup-*.tar.gz" -mtime +7 -delete 2>/dev/null || true
    
    log "Old backups cleaned up"
}

# Show backup information
show_backup_info() {
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)
    log "Backup completed successfully!"
    echo ""
    echo "Backup details:"
    echo "  - File: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
    echo "  - Size: $BACKUP_SIZE"
    echo "  - Created: $(date)"
    echo ""
    echo "To restore from this backup, use:"
    echo "  ./backup.sh restore $BACKUP_NAME.tar.gz"
}

# Restore from backup
restore_backup() {
    BACKUP_FILE="$1"
    
    if [ -z "$BACKUP_FILE" ]; then
        error "Please specify a backup file to restore"
    fi
    
    if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        error "Backup file not found: $BACKUP_DIR/$BACKUP_FILE"
    fi
    
    log "Restoring from backup: $BACKUP_FILE"
    
    # Extract backup
    cd "$BACKUP_DIR"
    tar -xzf "$BACKUP_FILE"
    cd ..
    
    # Restore database
    if [ -f "$BACKUP_DIR/$BACKUP_NAME-database.sql" ]; then
        log "Restoring database..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U postgres -d trading_bot < "$BACKUP_DIR/$BACKUP_NAME-database.sql"
    fi
    
    # Restore volumes
    VOLUMES_DIR="$BACKUP_DIR/$BACKUP_NAME-volumes"
    if [ -d "$VOLUMES_DIR" ]; then
        log "Restoring Docker volumes..."
        for volume_file in "$VOLUMES_DIR"/*.tar.gz; do
            if [ -f "$volume_file" ]; then
                volume_name=$(basename "$volume_file" .tar.gz)
                docker run --rm -v "$volume_name":/data -v "$(pwd)/$VOLUMES_DIR":/backup alpine tar xzf "/backup/$(basename "$volume_file")" -C /data
            fi
        done
    fi
    
    log "Restore completed successfully!"
}

# Main backup function
backup() {
    log "Starting backup process..."
    
    create_backup_dir
    backup_database
    backup_config
    backup_data
    backup_volumes
    create_archive
    cleanup_old_backups
    show_backup_info
}

# Handle script arguments
case "${1:-backup}" in
    backup)
        backup
        ;;
    restore)
        restore_backup "$2"
        ;;
    list)
        log "Available backups:"
        ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
        ;;
    *)
        echo "Usage: $0 {backup|restore <backup_file>|list}"
        exit 1
        ;;
esac











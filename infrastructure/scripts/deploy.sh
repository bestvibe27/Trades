#!/bin/bash

# Trading Bot Deployment Script
# This script handles the deployment of the trading bot application

set -e

# Configuration
PROJECT_NAME="trading-bot"
DOCKER_COMPOSE_FILE="infrastructure/docker/docker-compose.yml"
BACKUP_DIR="backups"
LOG_FILE="deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
    fi
    log "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose and try again."
    fi
    log "Docker Compose is available"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup current deployment
backup_current() {
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        BACKUP_NAME="backup-$(date +'%Y%m%d-%H%M%S')"
        cp "$DOCKER_COMPOSE_FILE" "$BACKUP_DIR/$BACKUP_NAME.yml"
        log "Backed up current deployment to: $BACKUP_DIR/$BACKUP_NAME.yml"
    fi
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
}

# Build application images
build_images() {
    log "Building application images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
}

# Stop current services
stop_services() {
    log "Stopping current services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
}

# Start services
start_services() {
    log "Starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
}

# Wait for services to be healthy
wait_for_services() {
    log "Waiting for services to be healthy..."
    
    # Wait for backend
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:8000/healthz > /dev/null 2>&1; then
            log "Backend is healthy"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        error "Backend failed to become healthy within 60 seconds"
    fi
    
    # Wait for frontend
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            log "Frontend is healthy"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        warning "Frontend may not be fully ready yet"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    # Add migration commands here when database is implemented
    # docker-compose -f "$DOCKER_COMPOSE_FILE" exec backend python manage.py migrate
}

# Clean up old images
cleanup() {
    log "Cleaning up old Docker images..."
    docker image prune -f
    docker volume prune -f
}

# Show deployment status
show_status() {
    log "Deployment completed successfully!"
    echo ""
    echo "Services are running at:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8000"
    echo "  - API Docs: http://localhost:8000/docs"
    echo "  - Grafana: http://localhost:3001 (admin/admin)"
    echo "  - Prometheus: http://localhost:9090"
    echo ""
    echo "To view logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "To stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
}

# Main deployment function
deploy() {
    log "Starting deployment of $PROJECT_NAME..."
    
    check_docker
    check_docker_compose
    create_backup_dir
    backup_current
    pull_images
    build_images
    stop_services
    start_services
    wait_for_services
    run_migrations
    cleanup
    show_status
}

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    stop)
        log "Stopping services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        ;;
    restart)
        log "Restarting services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" restart
        ;;
    logs)
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
        ;;
    status)
        docker-compose -f "$DOCKER_COMPOSE_FILE" ps
        ;;
    *)
        echo "Usage: $0 {deploy|stop|restart|logs|status}"
        exit 1
        ;;
esac











# Variables
DOCKER_COMPOSE = docker compose
BACKEND_SERVICE = backend
DB_SERVICE = db

.PHONY: build up down restart logs ps db-shell migrate seed

# Build all images
build:
	$(DOCKER_COMPOSE) build

# Start containers in background
up:
	$(DOCKER_COMPOSE) up -d

# Stop containers
down:
	$(DOCKER_COMPOSE) down

# Restart containers
restart:
	$(DOCKER_COMPOSE) restart

# View logs
logs:
	$(DOCKER_COMPOSE) logs -f

# Show container status
ps:
	$(DOCKER_COMPOSE) ps

# Access database shell
db-shell:
	$(DOCKER_COMPOSE) exec $(DB_SERVICE) psql -U vortex_user -d vortex_db

# Run Prisma migrations inside backend container
migrate:
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) npx prisma db push --accept-data-loss

# Seed the database with full mission-ready data
seed-full:
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) npm run db:seed

# Complete setup (build -> up -> migrate -> seed)
setup: build up migrate seed-full

# Orchestrated launch: Start DB/Backend -> Sync/Seed -> Start Frontend -> Watch logs
launch: build
	@echo "--- STARTING_TACTICAL_UNITS (DB & BACKEND) ---"
	$(DOCKER_COMPOSE) up -d db backend
	@echo "--- WAITING_FOR_UPLINK_STABILITY ---"
	@sleep 5
	@echo "--- SYNCHRONIZING_DATABASE_SCHEMA ---"
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) npx prisma db push --accept-data-loss
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) npx prisma generate
	@echo "--- INJECTING_MISSION_CRITICAL_DATA ---"
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) npm run db:seed
	@echo "--- ACTIVATING_FRONTEND_INTERFACE ---"
	$(DOCKER_COMPOSE) up -d frontend
	@echo "--- ALL_SYSTEMS_OPERATIONAL ---"
	$(DOCKER_COMPOSE) logs -f

COMPOSE_FILE := docker-compose.dev.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)

.PHONY: dev dev-stop dev-clean dev-ngrok dev-ngrok-stop

# Start development containers in detached mode.
dev:
	$(COMPOSE) up --build -d

# Start development containers with ngrok tunnel.
dev-ngrok:
	$(COMPOSE) --profile ngrok up --build -d

# Stop and remove development containers/network.
dev-stop:
	$(COMPOSE) down

# Stop development containers including ngrok.
dev-ngrok-stop:
	$(COMPOSE) --profile ngrok down

# Fully clean development Docker resources for this project.
dev-clean:
	$(COMPOSE) down --volumes --remove-orphans --rmi local

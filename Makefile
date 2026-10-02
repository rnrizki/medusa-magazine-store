.PHONY: up down restart logs build ps seed migrate clean user help

help:
	@echo "Medusa v2 Docker Commands:"
	@echo "  make up       - Build and start all services in the background"
	@echo "  make down     - Stop all running services"
	@echo "  make restart  - Restart all services"
	@echo "  make logs     - View and follow container logs"
	@echo "  make ps       - List running containers and status"
	@echo "  make seed     - Run the seed script to populate products and regions"
	@echo "  make migrate  - Run database migrations"
	@echo "  make user     - Create a new Medusa admin user"
	@echo "  make clean    - Remove containers, volumes, and cached data"

up:
	./start.sh

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

ps:
	docker compose ps

seed:
	docker compose exec backend npm run seed

migrate:
	docker compose exec backend npx medusa db:migrate

user:
	@read -p "Enter admin email: " email; \
	read -s -p "Enter admin password: " password; \
	echo ""; \
	docker compose exec backend npx medusa user -e $$email -p $$password

clean:
	docker compose down -v --remove-orphans

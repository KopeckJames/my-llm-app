# Docker Setup Instructions

This document explains how to run the application using Docker.

## Prerequisites

- Docker installed on your machine
- Docker Compose installed on your machine

## Configuration Files

The Docker setup consists of three main files:

1. `Dockerfile` - Defines how to build the application image
2. `docker-compose.yml` - Defines the services, networks, and volumes
3. `.dockerignore` - Specifies which files should be excluded from the Docker build

## Running the Application

1. Build and start the containers:
```bash
docker-compose up --build
```

2. For running in detached mode:
```bash
docker-compose up -d
```

3. To stop the containers:
```bash
docker-compose down
```

4. To view logs:
```bash
docker-compose logs -f
```

## Services

The application consists of two main services:

1. `app` - The Next.js application running on port 3000
2. `db` - PostgreSQL database running on port 5432

## Environment Variables

The following environment variables are configured in docker-compose.yml:

### Application
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production" by default

### Database
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name

## Volumes

- `postgres_data`: Persistent volume for PostgreSQL data

## Accessing the Application

Once the containers are running:
- Web application: http://localhost:3000
- Database: localhost:5432

## Troubleshooting

1. If the application fails to start, check the logs:
```bash
docker-compose logs app
```

2. To rebuild the containers after making changes:
```bash
docker-compose down
docker-compose up --build
```

3. To reset the database volume:
```bash
docker-compose down -v
docker-compose up
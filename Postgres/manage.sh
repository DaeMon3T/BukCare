#!/bin/bash
# File: manage_postgres.sh

PG_CONTAINER="postgres_db"
PGADMIN_CONTAINER="pgadmin"

if [ "$1" == "1" ]; then
    echo "Starting PostgreSQL and pgAdmin containers..."
    docker start "$PG_CONTAINER" "$PGADMIN_CONTAINER"

elif [ "$1" == "0" ]; then
    echo "Stopping PostgreSQL and pgAdmin containers..."
    docker stop "$PG_CONTAINER" "$PGADMIN_CONTAINER"

else
    echo "Usage: $0 {1=start | 0=stop}"
    exit 1
fi

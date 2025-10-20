#!/bin/bash

# Script to enter PostgreSQL inside Docker container
# Container: postgres_db
# User: ken
# Database: bukcare

docker exec -it postgres_db psql -U ken -d bukcare

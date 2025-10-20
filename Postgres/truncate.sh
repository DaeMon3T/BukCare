#!/bin/bash

# Run truncate_all.sql against bukcare database
docker exec -i postgres_db psql	 -U ken -d bukcare < truncate.sql

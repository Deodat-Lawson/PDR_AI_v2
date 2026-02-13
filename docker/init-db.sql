-- Enable pgvector extension on first database initialisation.
-- This file is mounted into /docker-entrypoint-initdb.d/ and only
-- runs when PostgreSQL creates a fresh data directory.
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the Authentik database (separate from Ghostfolio)
-- This runs automatically on first postgres container start via docker-entrypoint-initdb.d
SELECT 'CREATE DATABASE authentik'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'authentik')\gexec

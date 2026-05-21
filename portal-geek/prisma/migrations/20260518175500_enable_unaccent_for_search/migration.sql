-- ST-18: enable accent-insensitive search.
-- unaccent ships with PostgreSQL contrib; managed providers (RDS, Supabase, Cloud SQL) all support it.
-- Used by lib/services/servicios.ts::listServicios when a `query` is present.

CREATE EXTENSION IF NOT EXISTS unaccent;

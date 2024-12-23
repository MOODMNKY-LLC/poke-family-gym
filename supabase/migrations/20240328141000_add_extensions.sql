-- Migration: Add Required Extensions
-- Description: Creates necessary extensions for the family management system
-- Author: CODE MNKY

begin;

-- Enable required extensions
create extension if not exists "uuid-ossp";      -- For UUID generation
create extension if not exists "moddatetime";    -- For automatic updated_at timestamps
create extension if not exists "pg_trgm";        -- For text search optimization
create extension if not exists "hstore";         -- For key-value pairs

commit; 
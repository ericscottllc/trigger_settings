/*
  # Schema Management Functions

  1. New Functions
    - `get_schema_tables()` - Returns all tables in the public schema with metadata
    - `get_table_columns(table_name)` - Returns column information for a specific table including PK/FK relationships

  2. Security
    - Functions are accessible to authenticated users only
    - Read-only operations for schema introspection
    - No data modification capabilities

  3. Purpose
    - Support the Settings > Master Data functionality
    - Enable dynamic table discovery and management
    - Provide metadata for table structure analysis
*/

-- Function to get all tables in the public schema
CREATE OR REPLACE FUNCTION get_schema_tables()
RETURNS TABLE (
    table_name text,
    table_schema text,
    table_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        t.table_schema::text,
        t.table_type::text
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name;
END;
$$;

-- Function to get column information for a specific table
CREATE OR REPLACE FUNCTION get_table_columns(table_name_param text)
RETURNS TABLE (
    column_name text,
    data_type text,
    is_nullable text,
    column_default text,
    is_primary_key boolean,
    is_foreign_key boolean,
    foreign_table text,
    foreign_column text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text,
        c.column_default::text,
        CASE 
            WHEN pk.column_name IS NOT NULL THEN true 
            ELSE false 
        END as is_primary_key,
        CASE 
            WHEN fk.column_name IS NOT NULL THEN true 
            ELSE false 
        END as is_foreign_key,
        fk.foreign_table_name::text as foreign_table,
        fk.foreign_column_name::text as foreign_column
    FROM information_schema.columns c
    LEFT JOIN (
        -- Primary key information
        SELECT 
            kcu.column_name,
            kcu.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
    ) pk ON c.column_name = pk.column_name AND c.table_name = pk.table_name
    LEFT JOIN (
        -- Foreign key information
        SELECT 
            kcu.column_name,
            kcu.table_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    ) fk ON c.column_name = fk.column_name AND c.table_name = fk.table_name
    WHERE c.table_schema = 'public'
    AND c.table_name = table_name_param
    ORDER BY c.ordinal_position;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_schema_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_schema_tables() IS 'Returns all tables in the public schema with basic metadata';
COMMENT ON FUNCTION get_table_columns(text) IS 'Returns detailed column information for a specific table including primary and foreign key relationships';
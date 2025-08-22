/*
  # Database Schema Functions

  1. Functions
    - `get_schema_tables()` - Get all tables in public schema with metadata
    - `get_table_columns(table_name)` - Get column information for a specific table
    - `execute_sql(query)` - Execute arbitrary SQL queries (for schema explorer)

  2. Security
    - Functions are accessible to authenticated users only
    - Proper error handling and validation
*/

-- Function to get all tables in the public schema
CREATE OR REPLACE FUNCTION get_schema_tables()
RETURNS TABLE (
  table_name text,
  table_schema text,
  table_type text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    t.table_name::text,
    t.table_schema::text,
    t.table_type::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;

-- Function to get column information for a specific table
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
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
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text,
    COALESCE(pk.is_primary_key, false) as is_primary_key,
    COALESCE(fk.is_foreign_key, false) as is_foreign_key,
    fk.foreign_table_name::text as foreign_table,
    fk.foreign_column_name::text as foreign_column
  FROM information_schema.columns c
  LEFT JOIN (
    SELECT 
      kcu.column_name,
      true as is_primary_key
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_name = $1
      AND tc.table_schema = 'public'
  ) pk ON c.column_name = pk.column_name
  LEFT JOIN (
    SELECT 
      kcu.column_name,
      true as is_foreign_key,
      ccu.table_name as foreign_table_name,
      ccu.column_name as foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
      AND tc.table_schema = 'public'
  ) fk ON c.column_name = fk.column_name
  WHERE c.table_name = $1
    AND c.table_schema = 'public'
  ORDER BY c.ordinal_position;
$$;

-- Function to execute SQL queries (for schema explorer)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Basic validation to prevent dangerous operations
  IF query ~* '\b(DROP|DELETE|TRUNCATE|ALTER|INSERT|UPDATE)\b' THEN
    RAISE EXCEPTION 'Destructive operations are not allowed';
  END IF;
  
  -- Execute the query and return as JSON
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_schema_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
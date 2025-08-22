/*
  # Populate Master Data Tables

  1. Data Population
    - Clear existing data from master_elevators and master_towns tables
    - Insert elevator records (18 elevators including ADM, Pioneer, Viterra, etc.)
    - Insert town records (21 towns including Lloydminster, Unity, Maidstone, etc.)
  
  2. Data Structure
    - All records use auto-generated UUIDs for primary keys
    - Names are inserted as provided
    - Default values applied for is_active (true) and timestamps
    - No codes or provinces specified as they are optional fields
*/

-- Clear existing data
DELETE FROM master_elevators;
DELETE FROM master_towns;

-- Insert elevator data
INSERT INTO master_elevators (name) VALUES
('ADM'),
('Pioneer'),
('Viterra'),
('G3'),
('P&H'),
('Husky'),
('Cargill'),
('Broker'),
('Providence'),
('Bunge'),
('LDC'),
('Grainsconnect');

-- Insert town data  
INSERT INTO master_towns (name) VALUES
('Lloydminster'),
('Unity'),
('Maidstone'),
('Provost'),
('Wilkie'),
('Rosetown'),
('Clavet'),
('Picked Up'),
('Marengo'),
('Marshall'),
('N. Battleford'),
('Vermilion'),
('Camrose'),
('Viking'),
('Melfort'),
('Tisdale'),
('Nipawin'),
('Watson'),
('Yorkton'),
('Hamlin'),
('Maymont');
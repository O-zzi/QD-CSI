-- Facilities Educational Content Columns Migration
-- Generated: December 28, 2025
-- Description: Adds 4 new educational content columns to facilities table
-- Run this FIRST before the data update

ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS how_to_play_content TEXT,
ADD COLUMN IF NOT EXISTS scoring_rules_content TEXT,
ADD COLUMN IF NOT EXISTS winning_criteria_content TEXT,
ADD COLUMN IF NOT EXISTS points_system_content TEXT;

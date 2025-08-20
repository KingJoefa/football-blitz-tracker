-- NFL Play Tracking System Database Schema
-- Designed for PostgreSQL with performance optimizations

-- Core entity tables
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(5) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    division VARCHAR(20) NOT NULL,
    conference VARCHAR(5) NOT NULL CHECK (conference IN ('AFC', 'NFC')),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    founded_year INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    season_type VARCHAR(20) DEFAULT 'regular' CHECK (season_type IN ('preseason', 'regular', 'playoffs')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    nfl_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(10) NOT NULL,
    jersey_number INTEGER,
    team_id INTEGER REFERENCES teams(id),
    height_inches INTEGER,
    weight_lbs INTEGER,
    college VARCHAR(100),
    draft_year INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_jersey_number CHECK (jersey_number BETWEEN 0 AND 99)
);

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    nfl_game_id VARCHAR(50) UNIQUE,
    season_id INTEGER NOT NULL REFERENCES seasons(id),
    week INTEGER NOT NULL,
    game_date TIMESTAMP NOT NULL,
    home_team_id INTEGER NOT NULL REFERENCES teams(id),
    away_team_id INTEGER NOT NULL REFERENCES teams(id),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    game_status VARCHAR(20) DEFAULT 'scheduled' CHECK (
        game_status IN ('scheduled', 'in_progress', 'completed', 'postponed', 'cancelled')
    ),
    weather_conditions TEXT,
    temperature INTEGER,
    wind_speed INTEGER,
    venue VARCHAR(200),
    attendance INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

-- Formation and personnel group reference tables
CREATE TABLE formations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    formation_type VARCHAR(20) NOT NULL CHECK (formation_type IN ('offensive', 'defensive')),
    description TEXT,
    personnel_count JSONB, -- e.g., {"DB": 4, "LB": 3, "DL": 4} for defense
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE personnel_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g., "11 Personnel", "Nickel", "Dime"
    group_type VARCHAR(20) NOT NULL CHECK (group_type IN ('offensive', 'defensive')),
    description TEXT,
    player_positions JSONB, -- detailed position breakdown
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main plays table - partitioned by season for performance
CREATE TABLE plays (
    id BIGSERIAL PRIMARY KEY,
    nfl_play_id VARCHAR(100) UNIQUE,
    game_id INTEGER NOT NULL REFERENCES games(id),
    drive_id INTEGER,
    play_number INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    time_remaining INTERVAL NOT NULL,
    down INTEGER CHECK (down BETWEEN 1 AND 4),
    yards_to_go INTEGER NOT NULL,
    yard_line INTEGER NOT NULL CHECK (yard_line BETWEEN 0 AND 100),
    possession_team_id INTEGER NOT NULL REFERENCES teams(id),
    
    -- Play details
    play_type VARCHAR(50) NOT NULL, -- pass, run, punt, field_goal, etc.
    play_description TEXT,
    yards_gained INTEGER NOT NULL DEFAULT 0,
    
    -- Situational context
    score_differential INTEGER, -- possession team score - opponent score
    is_touchdown BOOLEAN DEFAULT false,
    is_turnover BOOLEAN DEFAULT false,
    is_penalty BOOLEAN DEFAULT false,
    is_scoring_play BOOLEAN DEFAULT false,
    
    -- Formation and personnel
    offensive_formation_id INTEGER REFERENCES formations(id),
    defensive_formation_id INTEGER REFERENCES formations(id),
    offensive_personnel_id INTEGER REFERENCES personnel_groups(id),
    defensive_personnel_id INTEGER REFERENCES personnel_groups(id),
    
    -- Performance metrics (populated post-analysis)
    expected_points_added DECIMAL(5,2),
    win_probability_added DECIMAL(5,4),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (EXTRACT(year FROM created_at));

-- Create partitions for plays table (example for recent years)
CREATE TABLE plays_2024 PARTITION OF plays 
    FOR VALUES FROM (2024) TO (2025);
CREATE TABLE plays_2023 PARTITION OF plays 
    FOR VALUES FROM (2023) TO (2024);
CREATE TABLE plays_2022 PARTITION OF plays 
    FOR VALUES FROM (2022) TO (2023);

-- Defensive success metrics table
CREATE TABLE defensive_metrics (
    id BIGSERIAL PRIMARY KEY,
    play_id BIGINT NOT NULL REFERENCES plays(id),
    
    -- Pass defense metrics
    pressure_generated BOOLEAN DEFAULT false,
    sack_recorded BOOLEAN DEFAULT false,
    hurry_recorded BOOLEAN DEFAULT false,
    pass_breakup BOOLEAN DEFAULT false,
    interception BOOLEAN DEFAULT false,
    
    -- Coverage metrics
    target_player_id INTEGER REFERENCES players(id),
    coverage_type VARCHAR(50), -- man, zone, blitz, etc.
    completion_allowed BOOLEAN,
    yards_allowed INTEGER DEFAULT 0,
    
    -- Run defense metrics
    run_stuff BOOLEAN DEFAULT false, -- stop for loss or no gain
    missed_tackles INTEGER DEFAULT 0,
    
    -- Situational success
    third_down_stop BOOLEAN DEFAULT false,
    red_zone_stop BOOLEAN DEFAULT false,
    goal_line_stop BOOLEAN DEFAULT false,
    
    -- Player involvement (can be multiple defenders)
    primary_defender_id INTEGER REFERENCES players(id),
    assist_defenders JSONB, -- array of player IDs
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (EXTRACT(year FROM created_at));

-- Create partitions for defensive_metrics
CREATE TABLE defensive_metrics_2024 PARTITION OF defensive_metrics 
    FOR VALUES FROM (2024) TO (2025);
CREATE TABLE defensive_metrics_2023 PARTITION OF defensive_metrics 
    FOR VALUES FROM (2023) TO (2024);
CREATE TABLE defensive_metrics_2022 PARTITION OF defensive_metrics 
    FOR VALUES FROM (2022) TO (2023);

-- Player participation in plays (many-to-many)
CREATE TABLE play_participants (
    id BIGSERIAL PRIMARY KEY,
    play_id BIGINT NOT NULL REFERENCES plays(id),
    player_id INTEGER NOT NULL REFERENCES players(id),
    participation_type VARCHAR(50) NOT NULL, -- offense, defense, special_teams
    position_on_play VARCHAR(10),
    snap_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(play_id, player_id, participation_type)
) PARTITION BY RANGE (EXTRACT(year FROM created_at));

CREATE TABLE play_participants_2024 PARTITION OF play_participants 
    FOR VALUES FROM (2024) TO (2025);
CREATE TABLE play_participants_2023 PARTITION OF play_participants 
    FOR VALUES FROM (2023) TO (2024);
CREATE TABLE play_participants_2022 PARTITION OF play_participants 
    FOR VALUES FROM (2022) TO (2023);

-- Aggregated defensive statistics (materialized for performance)
CREATE MATERIALIZED VIEW defensive_team_stats AS
SELECT 
    p.possession_team_id as opponent_team_id,
    pp.player_id,
    pl.team_id as defensive_team_id,
    DATE_TRUNC('week', g.game_date) as week_start,
    COUNT(*) as total_snaps,
    COUNT(*) FILTER (WHERE dm.pressure_generated) as pressures,
    COUNT(*) FILTER (WHERE dm.sack_recorded) as sacks,
    COUNT(*) FILTER (WHERE dm.hurry_recorded) as hurries,
    COUNT(*) FILTER (WHERE dm.interception) as interceptions,
    COUNT(*) FILTER (WHERE dm.pass_breakup) as pass_breakups,
    COUNT(*) FILTER (WHERE dm.third_down_stop) as third_down_stops,
    AVG(dm.yards_allowed) as avg_yards_allowed,
    COUNT(*) FILTER (WHERE p.play_type = 'pass' AND dm.completion_allowed = false) as pass_defenses
FROM plays p
JOIN games g ON p.game_id = g.id
JOIN play_participants pp ON p.id = pp.play_id AND pp.participation_type = 'defense'
JOIN players pl ON pp.player_id = pl.id
LEFT JOIN defensive_metrics dm ON p.id = dm.play_id
GROUP BY p.possession_team_id, pp.player_id, pl.team_id, DATE_TRUNC('week', g.game_date);

-- Indexes for optimal query performance
CREATE INDEX CONCURRENTLY idx_plays_game_quarter ON plays(game_id, quarter);
CREATE INDEX CONCURRENTLY idx_plays_possession_team ON plays(possession_team_id);
CREATE INDEX CONCURRENTLY idx_plays_down_distance ON plays(down, yards_to_go);
CREATE INDEX CONCURRENTLY idx_plays_formation ON plays(defensive_formation_id, offensive_formation_id);
CREATE INDEX CONCURRENTLY idx_plays_type_date ON plays(play_type, created_at);
CREATE INDEX CONCURRENTLY idx_plays_situation ON plays(down, yards_to_go, yard_line, score_differential);

CREATE INDEX CONCURRENTLY idx_defensive_metrics_play ON defensive_metrics(play_id);
CREATE INDEX CONCURRENTLY idx_defensive_metrics_player ON defensive_metrics(primary_defender_id);
CREATE INDEX CONCURRENTLY idx_defensive_metrics_success ON defensive_metrics(pressure_generated, sack_recorded, interception);

CREATE INDEX CONCURRENTLY idx_play_participants_play ON play_participants(play_id);
CREATE INDEX CONCURRENTLY idx_play_participants_player ON play_participants(player_id);
CREATE INDEX CONCURRENTLY idx_play_participants_type ON play_participants(participation_type);

CREATE INDEX CONCURRENTLY idx_games_date_teams ON games(game_date, home_team_id, away_team_id);
CREATE INDEX CONCURRENTLY idx_players_team_position ON players(team_id, position) WHERE active = true;

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_plays_complex_filter ON plays(
    possession_team_id, 
    play_type, 
    down, 
    yards_to_go
) INCLUDE (yards_gained, is_touchdown);

CREATE INDEX CONCURRENTLY idx_defensive_performance ON defensive_metrics(
    primary_defender_id,
    pressure_generated,
    sack_recorded
) WHERE primary_defender_id IS NOT NULL;

-- GIN indexes for JSONB columns
CREATE INDEX CONCURRENTLY idx_formations_personnel_gin ON formations USING GIN (personnel_count);
CREATE INDEX CONCURRENTLY idx_personnel_positions_gin ON personnel_groups USING GIN (player_positions);

-- Triggers to maintain updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plays_updated_at BEFORE UPDATE ON plays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO seasons (year, start_date, end_date) VALUES 
(2024, '2024-09-01', '2025-02-28'),
(2023, '2023-09-01', '2024-02-28'),
(2022, '2022-09-01', '2023-02-28');

-- Sample formations
INSERT INTO formations (name, formation_type, description, personnel_count) VALUES
('4-3 Base', 'defensive', 'Standard 4-3 defensive formation', '{"DL": 4, "LB": 3, "DB": 4}'),
('3-4 Base', 'defensive', 'Standard 3-4 defensive formation', '{"DL": 3, "LB": 4, "DB": 4}'),
('Nickel', 'defensive', '5 defensive backs, 6 in the box', '{"DL": 4, "LB": 2, "DB": 5}'),
('Dime', 'defensive', '6 defensive backs, 5 in the box', '{"DL": 4, "LB": 1, "DB": 6}'),
('Goal Line', 'defensive', 'Heavy run stopping formation', '{"DL": 5, "LB": 3, "DB": 3}');

INSERT INTO personnel_groups (name, group_type, description) VALUES
('Base Defense', 'defensive', 'Standard defensive personnel'),
('Nickel Defense', 'defensive', 'Extra defensive back for pass coverage'),
('Dime Defense', 'defensive', 'Two extra defensive backs'),
('Quarter Defense', 'defensive', 'Three extra defensive backs for pass coverage'),
('Goal Line Defense', 'defensive', 'Heavy personnel for short yardage situations');
-- NFL Play Tracking System - Sample Queries
-- Optimized for PostgreSQL with performance considerations

-- ============================================================================
-- BASIC FILTERING QUERIES
-- ============================================================================

-- 1. Get all third down plays for a specific team in 2024
SELECT 
    p.*,
    g.week,
    ht.name as home_team,
    at.name as away_team,
    pt.name as possession_team
FROM plays p
JOIN games g ON p.game_id = g.id
JOIN seasons s ON g.season_id = s.id
JOIN teams ht ON g.home_team_id = ht.id
JOIN teams at ON g.away_team_id = at.id
JOIN teams pt ON p.possession_team_id = pt.id
WHERE s.year = 2024
AND p.possession_team_id = 15  -- Team ID
AND p.down = 3
ORDER BY g.game_date DESC, p.play_number ASC;

-- 2. Find defensive plays in red zone situations
SELECT 
    p.*,
    dm.pressure_generated,
    dm.sack_recorded,
    dm.interception,
    pl.first_name || ' ' || pl.last_name as defender_name
FROM plays p
JOIN defensive_metrics dm ON p.id = dm.play_id
LEFT JOIN players pl ON dm.primary_defender_id = pl.id
WHERE p.yard_line <= 20  -- Red zone
AND p.down IN (1, 2, 3)
ORDER BY dm.pressure_generated DESC, dm.sack_recorded DESC;

-- ============================================================================
-- ADVANCED DEFENSIVE ANALYTICS
-- ============================================================================

-- 3. Team pressure rates by down and distance
SELECT 
    t.name as team_name,
    p.down,
    CASE 
        WHEN p.yards_to_go <= 3 THEN 'short'
        WHEN p.yards_to_go BETWEEN 4 AND 7 THEN 'medium'
        ELSE 'long'
    END as distance_category,
    COUNT(*) as total_plays,
    COUNT(*) FILTER (WHERE dm.pressure_generated = true) as pressures,
    COUNT(*) FILTER (WHERE dm.sack_recorded = true) as sacks,
    ROUND(
        COUNT(*) FILTER (WHERE dm.pressure_generated = true)::decimal / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as pressure_rate_pct
FROM teams t
JOIN players pl ON t.id = pl.team_id
JOIN play_participants pp ON pl.id = pp.player_id AND pp.participation_type = 'defense'
JOIN plays p ON pp.play_id = p.id
JOIN games g ON p.game_id = g.id
JOIN seasons s ON g.season_id = s.id
LEFT JOIN defensive_metrics dm ON p.id = dm.play_id
WHERE s.year = 2024
GROUP BY t.id, t.name, p.down, distance_category
HAVING COUNT(*) >= 10
ORDER BY t.name, p.down, distance_category;

-- 4. Player defensive efficiency by formation
SELECT 
    pl.first_name || ' ' || pl.last_name as player_name,
    pl.position,
    t.name as team_name,
    f.name as formation_name,
    COUNT(*) as snaps,
    COUNT(*) FILTER (WHERE dm.pressure_generated = true) as pressures,
    COUNT(*) FILTER (WHERE dm.sack_recorded = true) as sacks,
    COUNT(*) FILTER (WHERE dm.interception = true) as interceptions,
    ROUND(AVG(dm.yards_allowed), 2) as avg_yards_allowed,
    ROUND(
        COUNT(*) FILTER (WHERE dm.pressure_generated = true)::decimal / 
        NULLIF(COUNT(*), 0), 3
    ) as pressure_rate
FROM players pl
JOIN teams t ON pl.team_id = t.id
JOIN play_participants pp ON pl.id = pp.player_id AND pp.participation_type = 'defense'
JOIN plays p ON pp.play_id = p.id
JOIN games g ON p.game_id = g.id
JOIN seasons s ON g.season_id = s.id
LEFT JOIN formations f ON p.defensive_formation_id = f.id
LEFT JOIN defensive_metrics dm ON p.id = dm.play_id AND dm.primary_defender_id = pl.id
WHERE s.year = 2024
AND pl.position IN ('CB', 'S', 'LB')
GROUP BY pl.id, pl.first_name, pl.last_name, pl.position, t.name, f.name
HAVING COUNT(*) >= 20
ORDER BY pressure_rate DESC NULLS LAST;

-- ============================================================================
-- SITUATIONAL DEFENSIVE SUCCESS
-- ============================================================================

-- 5. Third down conversion defense by team
SELECT 
    t.name as defending_team,
    COUNT(*) as third_downs_faced,
    COUNT(*) FILTER (WHERE dm.third_down_stop = true) as third_down_stops,
    COUNT(*) FILTER (WHERE dm.pressure_generated = true) as pressures_on_third,
    COUNT(*) FILTER (WHERE dm.sack_recorded = true) as sacks_on_third,
    ROUND(
        COUNT(*) FILTER (WHERE dm.third_down_stop = true)::decimal / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as third_down_stop_rate
FROM teams t
JOIN players pl ON t.id = pl.team_id
JOIN play_participants pp ON pl.id = pp.player_id AND pp.participation_type = 'defense'
JOIN plays p ON pp.play_id = p.id
JOIN games g ON p.game_id = g.id
JOIN seasons s ON g.season_id = s.id
LEFT JOIN defensive_metrics dm ON p.id = dm.play_id
WHERE s.year = 2024
AND p.down = 3
GROUP BY t.id, t.name
HAVING COUNT(*) >= 25
ORDER BY third_down_stop_rate DESC;

-- 6. Goal line defensive efficiency
SELECT 
    t.name as defending_team,
    COUNT(*) as goal_line_plays,
    COUNT(*) FILTER (WHERE p.is_touchdown = false) as stops,
    COUNT(*) FILTER (WHERE dm.goal_line_stop = true) as defensive_stops,
    COUNT(*) FILTER (WHERE p.is_turnover = true) as turnovers_forced,
    ROUND(
        COUNT(*) FILTER (WHERE p.is_touchdown = false)::decimal / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as goal_line_stop_rate
FROM teams t
JOIN players pl ON t.id = pl.team_id
JOIN play_participants pp ON pl.id = pp.player_id AND pp.participation_type = 'defense'
JOIN plays p ON pp.play_id = p.id
JOIN games g ON p.game_id = g.id
JOIN seasons s ON g.season_id = s.id
LEFT JOIN defensive_metrics dm ON p.id = dm.play_id
WHERE s.year = 2024
AND p.yard_line <= 5  -- Goal line situations
GROUP BY t.id, t.name
HAVING COUNT(*) >= 5
ORDER BY goal_line_stop_rate DESC;

-- ============================================================================
-- FORMATION MATCHUP ANALYSIS
-- ============================================================================

-- 7. Formation vs Formation effectiveness
SELECT 
    of.name as offensive_formation,
    df.name as defensive_formation,
    COUNT(*) as matchup_count,
    ROUND(AVG(p.yards_gained), 2) as avg_yards_allowed,
    COUNT(*) FILTER (WHERE dm.pressure_generated = true) as pressures,
    COUNT(*) FILTER (WHERE p.is_turnover = true) as turnovers_forced,
    COUNT(*) FILTER (WHERE p.yards_gained <= 2) as stuffed_plays,
    ROUND(
        COUNT(*) FILTER (WHERE p.yards_gained <= 2)::decimal / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as stuff_rate
FROM plays p
JOIN games g ON p.game_id = g.id
JOIN seasons s ON g.season_id = s.id
LEFT JOIN formations of ON p.offensive_formation_id = of.id
LEFT JOIN formations df ON p.defensive_formation_id = df.id
LEFT JOIN defensive_metrics dm ON p.id = dm.play_id
WHERE s.year = 2024
AND of.name IS NOT NULL 
AND df.name IS NOT NULL
AND p.play_type IN ('pass', 'run')
GROUP BY of.name, df.name
HAVING COUNT(*) >= 15
ORDER BY avg_yards_allowed ASC;

-- ============================================================================
-- PLAYER PERFORMANCE RANKINGS
-- ============================================================================

-- 8. Top pass rushers by pressure rate (minimum 100 snaps)
WITH pass_rush_stats AS (
    SELECT 
        pl.id,
        pl.first_name || ' ' || pl.last_name as player_name,
        pl.position,
        t.name as team_name,
        COUNT(*) as pass_rush_snaps,
        COUNT(*) FILTER (WHERE dm.pressure_generated = true) as pressures,
        COUNT(*) FILTER (WHERE dm.sack_recorded = true) as sacks,
        COUNT(*) FILTER (WHERE dm.hurry_recorded = true) as hurries,
        ROUND(
            COUNT(*) FILTER (WHERE dm.pressure_generated = true)::decimal / 
            NULLIF(COUNT(*), 0), 3
        ) as pressure_rate
    FROM players pl
    JOIN teams t ON pl.team_id = t.id
    JOIN play_participants pp ON pl.id = pp.player_id AND pp.participation_type = 'defense'
    JOIN plays p ON pp.play_id = p.id
    JOIN games g ON p.game_id = g.id
    JOIN seasons s ON g.season_id = s.id
    LEFT JOIN defensive_metrics dm ON p.id = dm.play_id AND dm.primary_defender_id = pl.id
    WHERE s.year = 2024
    AND p.play_type = 'pass'
    AND pl.position IN ('DE', 'DT', 'OLB')
    GROUP BY pl.id, pl.first_name, pl.last_name, pl.position, t.name
    HAVING COUNT(*) >= 100
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY pressure_rate DESC) as rank,
    *
FROM pass_rush_stats
ORDER BY pressure_rate DESC
LIMIT 25;

-- 9. Coverage specialists - lowest completion rate allowed
WITH coverage_stats AS (
    SELECT 
        pl.id,
        pl.first_name || ' ' || pl.last_name as player_name,
        pl.position,
        t.name as team_name,
        COUNT(*) as targets,
        COUNT(*) FILTER (WHERE dm.completion_allowed = true) as completions_allowed,
        COUNT(*) FILTER (WHERE dm.interception = true) as interceptions,
        COUNT(*) FILTER (WHERE dm.pass_breakup = true) as pass_breakups,
        SUM(dm.yards_allowed) as total_yards_allowed,
        ROUND(
            COUNT(*) FILTER (WHERE dm.completion_allowed = true)::decimal / 
            NULLIF(COUNT(*), 0) * 100, 2
        ) as completion_rate_allowed,
        ROUND(AVG(dm.yards_allowed), 2) as avg_yards_per_target
    FROM players pl
    JOIN teams t ON pl.team_id = t.id
    JOIN defensive_metrics dm ON pl.id = dm.primary_defender_id
    JOIN plays p ON dm.play_id = p.id
    JOIN games g ON p.game_id = g.id
    JOIN seasons s ON g.season_id = s.id
    WHERE s.year = 2024
    AND dm.target_player_id IS NOT NULL  -- Player was targeted in coverage
    AND pl.position IN ('CB', 'S')
    GROUP BY pl.id, pl.first_name, pl.last_name, pl.position, t.name
    HAVING COUNT(*) >= 25  -- Minimum targets
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY completion_rate_allowed ASC) as rank,
    *
FROM coverage_stats
ORDER BY completion_rate_allowed ASC
LIMIT 25;

-- ============================================================================
-- GAME SITUATION ANALYSIS
-- ============================================================================

-- 10. Late game defensive performance (4th quarter, close games)
SELECT 
    t.name as defending_team,
    COUNT(*) as fourth_quarter_plays,
    COUNT(*) FILTER (WHERE ABS(p.score_differential) <= 7) as close_game_plays,
    COUNT(*) FILTER (WHERE dm.pressure_generated = true AND ABS(p.score_differential) <= 7) as clutch_pressures,
    COUNT(*) FILTER (WHERE dm.sack_recorded = true AND ABS(p.score_differential) <= 7) as clutch_sacks,
    COUNT(*) FILTER (WHERE p.is_turnover = true AND ABS(p.score_differential) <= 7) as clutch_turnovers,
    ROUND(
        COUNT(*) FILTER (WHERE dm.pressure_generated = true AND ABS(p.score_differential) <= 7)::decimal / 
        NULLIF(COUNT(*) FILTER (WHERE ABS(p.score_differential) <= 7), 0) * 100, 2
    ) as clutch_pressure_rate
FROM teams t
JOIN players pl ON t.id = pl.team_id
JOIN play_participants pp ON pl.id = pp.player_id AND pp.participation_type = 'defense'
JOIN plays p ON pp.play_id = p.id
JOIN games g ON p.game_id = g.id
JOIN seasons s ON g.season_id = s.id
LEFT JOIN defensive_metrics dm ON p.id = dm.play_id
WHERE s.year = 2024
AND p.quarter = 4
AND p.time_remaining <= INTERVAL '10 minutes'  -- Final 10 minutes
GROUP BY t.id, t.name
HAVING COUNT(*) FILTER (WHERE ABS(p.score_differential) <= 7) >= 20
ORDER BY clutch_pressure_rate DESC;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION QUERIES
-- ============================================================================

-- 11. Explain plan for complex query optimization
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    pl.first_name || ' ' || pl.last_name as player_name,
    COUNT(*) as total_snaps,
    COUNT(*) FILTER (WHERE dm.pressure_generated = true) as pressures
FROM players pl
JOIN play_participants pp ON pl.id = pp.player_id
JOIN plays p ON pp.play_id = p.id
JOIN defensive_metrics dm ON p.id = dm.play_id
WHERE pp.participation_type = 'defense'
AND p.down = 3
AND p.yards_to_go BETWEEN 5 AND 10
GROUP BY pl.id, pl.first_name, pl.last_name
HAVING COUNT(*) >= 25;

-- 12. Query performance monitoring
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    min_time,
    max_time
FROM pg_stat_statements 
WHERE query LIKE '%defensive_metrics%'
ORDER BY total_time DESC
LIMIT 10;

-- ============================================================================
-- DATA VALIDATION AND INTEGRITY
-- ============================================================================

-- 13. Check for data consistency issues
SELECT 
    'Missing defensive metrics' as issue_type,
    COUNT(*) as count
FROM plays p
LEFT JOIN defensive_metrics dm ON p.id = dm.play_id
WHERE p.play_type = 'pass'
AND dm.id IS NULL

UNION ALL

SELECT 
    'Plays without participants' as issue_type,
    COUNT(*) as count
FROM plays p
LEFT JOIN play_participants pp ON p.id = pp.play_id
WHERE pp.id IS NULL

UNION ALL

SELECT 
    'Invalid yard_line values' as issue_type,
    COUNT(*) as count
FROM plays p
WHERE p.yard_line < 0 OR p.yard_line > 100;

-- 14. Performance statistics for monitoring
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename IN ('plays', 'defensive_metrics', 'play_participants')
ORDER BY n_live_tup DESC;
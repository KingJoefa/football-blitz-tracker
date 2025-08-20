const express = require('express');
const router = express.Router();
const { query, cache, preparedStatements } = require('../config/database');
const validationMiddleware = require('../middleware/validation');
const { defensiveFilters } = require('../validators/defensiveValidators');

// Get defensive metrics with filtering
router.get('/', validationMiddleware(defensiveFilters), async (req, res, next) => {
    try {
        const {
            player_id,
            team_id,
            season,
            week,
            formation_id,
            situation,
            limit = 50,
            offset = 0
        } = req.query;

        const cacheKey = `defensive_metrics:${JSON.stringify(req.query)}`;
        const cachedResult = await cache.get(cacheKey);
        
        if (cachedResult) {
            return res.json(cachedResult);
        }

        let situationFilter = '';
        if (situation === 'third_down') {
            situationFilter = 'AND p.down = 3';
        } else if (situation === 'red_zone') {
            situationFilter = 'AND p.yard_line <= 20';
        } else if (situation === 'goal_line') {
            situationFilter = 'AND p.yard_line <= 5';
        }

        const defensiveQuery = `
            SELECT 
                dm.*,
                p.play_type,
                p.down,
                p.yards_to_go,
                p.yard_line,
                p.quarter,
                p.score_differential,
                pl.first_name,
                pl.last_name,
                pl.position,
                pl.jersey_number,
                t.name as team_name,
                t.abbreviation as team_abbr,
                g.week,
                s.year as season_year,
                f.name as formation_name
            FROM defensive_metrics dm
            JOIN plays p ON dm.play_id = p.id
            JOIN games g ON p.game_id = g.id
            JOIN seasons s ON g.season_id = s.id
            LEFT JOIN players pl ON dm.primary_defender_id = pl.id
            LEFT JOIN teams t ON pl.team_id = t.id
            LEFT JOIN formations f ON p.defensive_formation_id = f.id
            WHERE ($1::int IS NULL OR dm.primary_defender_id = $1)
            AND ($2::int IS NULL OR pl.team_id = $2)
            AND ($3::int IS NULL OR s.year = $3)
            AND ($4::int IS NULL OR g.week = $4)
            AND ($5::int IS NULL OR p.defensive_formation_id = $5)
            ${situationFilter}
            ORDER BY dm.created_at DESC
            LIMIT $6 OFFSET $7
        `;

        const result = await query(
            defensiveQuery,
            [
                player_id || null,
                team_id || null,
                season || null,
                week || null,
                formation_id || null,
                parseInt(limit),
                parseInt(offset)
            ],
            true
        );

        // Get count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM defensive_metrics dm
            JOIN plays p ON dm.play_id = p.id
            JOIN games g ON p.game_id = g.id
            JOIN seasons s ON g.season_id = s.id
            LEFT JOIN players pl ON dm.primary_defender_id = pl.id
            WHERE ($1::int IS NULL OR dm.primary_defender_id = $1)
            AND ($2::int IS NULL OR pl.team_id = $2)
            AND ($3::int IS NULL OR s.year = $3)
            AND ($4::int IS NULL OR g.week = $4)
            AND ($5::int IS NULL OR p.defensive_formation_id = $5)
            ${situationFilter}
        `;

        const countResult = await query(
            countQuery,
            [
                player_id || null,
                team_id || null,
                season || null,
                week || null,
                formation_id || null
            ],
            true
        );

        const total = parseInt(countResult.rows[0].total);

        const response = {
            data: result.rows,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: total > (parseInt(offset) + parseInt(limit))
            },
            filters_applied: {
                player_id: player_id || null,
                team_id: team_id || null,
                season: season || null,
                week: week || null,
                formation_id: formation_id || null,
                situation: situation || null
            }
        };

        await cache.set(cacheKey, response, 300); // 5 minute cache
        res.json(response);

    } catch (error) {
        next(error);
    }
});

// Get team defensive rankings
router.get('/team-rankings', async (req, res, next) => {
    try {
        const { 
            season = 2024, 
            metric = 'pressure_rate',
            min_games = 1
        } = req.query;

        const cacheKey = `team_rankings:${season}:${metric}:${min_games}`;
        const cachedResult = await cache.get(cacheKey);
        
        if (cachedResult) {
            return res.json(cachedResult);
        }

        const validMetrics = {
            'pressure_rate': 'pressure_generated',
            'sack_rate': 'sack_recorded',
            'int_rate': 'interception',
            'third_down_stop_rate': 'third_down_stop',
            'red_zone_stop_rate': 'red_zone_stop'
        };

        const metricColumn = validMetrics[metric];
        if (!metricColumn) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_METRIC',
                    message: `Invalid metric. Valid options: ${Object.keys(validMetrics).join(', ')}`
                }
            });
        }

        const rankingsQuery = `
            WITH team_stats AS (
                SELECT 
                    t.id,
                    t.name,
                    t.abbreviation,
                    COUNT(DISTINCT g.id) as games_played,
                    COUNT(pp.play_id) as total_defensive_snaps,
                    COUNT(CASE WHEN dm.${metricColumn} = true THEN 1 END) as metric_successes,
                    ROUND(
                        COUNT(CASE WHEN dm.${metricColumn} = true THEN 1 END)::decimal / 
                        NULLIF(COUNT(pp.play_id), 0), 4
                    ) as success_rate
                FROM teams t
                JOIN players pl ON t.id = pl.team_id
                JOIN play_participants pp ON pl.id = pp.player_id AND pp.participation_type = 'defense'
                JOIN plays p ON pp.play_id = p.id
                JOIN games g ON p.game_id = g.id
                JOIN seasons s ON g.season_id = s.id
                LEFT JOIN defensive_metrics dm ON p.id = dm.play_id
                WHERE s.year = $1
                AND t.active = true
                GROUP BY t.id, t.name, t.abbreviation
                HAVING COUNT(DISTINCT g.id) >= $2
            )
            SELECT 
                ROW_NUMBER() OVER (ORDER BY success_rate DESC NULLS LAST) as rank,
                *
            FROM team_stats
            ORDER BY success_rate DESC NULLS LAST
        `;

        const result = await query(rankingsQuery, [season, min_games], true);

        const response = {
            data: result.rows,
            metadata: {
                season: parseInt(season),
                metric,
                min_games: parseInt(min_games),
                total_teams: result.rows.length
            }
        };

        await cache.set(cacheKey, response, 600); // 10 minute cache
        res.json(response);

    } catch (error) {
        next(error);
    }
});

// Get player defensive rankings
router.get('/player-rankings', async (req, res, next) => {
    try {
        const {
            season = 2024,
            position,
            metric = 'pressures',
            min_snaps = 100,
            limit = 50
        } = req.query;

        const cacheKey = `player_rankings:${season}:${position}:${metric}:${min_snaps}:${limit}`;
        const cachedResult = await cache.get(cacheKey);
        
        if (cachedResult) {
            return res.json(cachedResult);
        }

        const result = await query(
            preparedStatements.getPlayerDefensiveStats,
            [
                null, // player_id
                null, // team_id
                season, // season
                null, // week
                position || null,
                min_snaps,
                limit,
                0 // offset
            ],
            true
        );

        // Calculate additional metrics
        const enhancedData = result.rows.map((player, index) => ({
            rank: index + 1,
            player: {
                id: player.id,
                name: `${player.first_name} ${player.last_name}`,
                position: player.position,
                team: player.team_name
            },
            stats: {
                total_snaps: parseInt(player.total_snaps),
                pressures: parseInt(player.pressures),
                sacks: parseInt(player.sacks),
                hurries: parseInt(player.hurries),
                interceptions: parseInt(player.interceptions),
                pass_breakups: parseInt(player.pass_breakups),
                third_down_stops: parseInt(player.third_down_stops),
                avg_yards_allowed: parseFloat(player.avg_yards_allowed || 0),
                pressure_rate: parseFloat(player.pressure_rate || 0)
            },
            rates: {
                sack_rate: player.total_snaps > 0 ? 
                    Math.round((player.sacks / player.total_snaps) * 1000) / 1000 : 0,
                hurry_rate: player.total_snaps > 0 ? 
                    Math.round((player.hurries / player.total_snaps) * 1000) / 1000 : 0,
                int_rate: player.total_snaps > 0 ? 
                    Math.round((player.interceptions / player.total_snaps) * 1000) / 1000 : 0
            }
        }));

        const response = {
            data: enhancedData,
            metadata: {
                season: parseInt(season),
                position: position || 'all',
                metric,
                min_snaps: parseInt(min_snaps),
                total_players: enhancedData.length
            }
        };

        await cache.set(cacheKey, response, 600); // 10 minute cache
        res.json(response);

    } catch (error) {
        next(error);
    }
});

// Get situational defensive stats
router.get('/situational', async (req, res, next) => {
    try {
        const {
            down,
            distance,
            field_position,
            team_id,
            season = 2024,
            limit = 20
        } = req.query;

        const cacheKey = `defensive_situational:${JSON.stringify(req.query)}`;
        const cachedResult = await cache.get(cacheKey);
        
        if (cachedResult) {
            return res.json(cachedResult);
        }

        let distanceFilter = '';
        if (distance === 'short') {
            distanceFilter = 'AND p.yards_to_go <= 3';
        } else if (distance === 'medium') {
            distanceFilter = 'AND p.yards_to_go BETWEEN 4 AND 7';
        } else if (distance === 'long') {
            distanceFilter = 'AND p.yards_to_go >= 8';
        }

        let fieldPositionFilter = '';
        if (field_position === 'own') {
            fieldPositionFilter = 'AND p.yard_line >= 50';
        } else if (field_position === 'midfield') {
            fieldPositionFilter = 'AND p.yard_line BETWEEN 35 AND 65';
        } else if (field_position === 'opponent') {
            fieldPositionFilter = 'AND p.yard_line <= 34';
        }

        const situationalQuery = `
            SELECT 
                t.name as team_name,
                t.abbreviation,
                COUNT(*) as total_plays,
                COUNT(CASE WHEN dm.pressure_generated = true THEN 1 END) as pressures,
                COUNT(CASE WHEN dm.sack_recorded = true THEN 1 END) as sacks,
                COUNT(CASE WHEN dm.interception = true THEN 1 END) as interceptions,
                COUNT(CASE WHEN dm.pass_breakup = true THEN 1 END) as pass_breakups,
                COUNT(CASE WHEN dm.third_down_stop = true THEN 1 END) as third_down_stops,
                ROUND(AVG(p.yards_gained), 2) as avg_yards_allowed,
                ROUND(
                    COUNT(CASE WHEN dm.pressure_generated = true THEN 1 END)::decimal / 
                    NULLIF(COUNT(*), 0), 3
                ) as pressure_rate,
                ROUND(
                    COUNT(CASE WHEN p.yards_gained <= 0 THEN 1 END)::decimal / 
                    NULLIF(COUNT(*), 0), 3
                ) as negative_play_rate
            FROM teams t
            JOIN players pl ON t.id = pl.team_id
            JOIN play_participants pp ON pl.id = pp.player_id AND pp.participation_type = 'defense'
            JOIN plays p ON pp.play_id = p.id
            JOIN games g ON p.game_id = g.id
            JOIN seasons s ON g.season_id = s.id
            LEFT JOIN defensive_metrics dm ON p.id = dm.play_id
            WHERE s.year = $1
            AND ($2::int IS NULL OR p.down = $2)
            AND ($3::int IS NULL OR t.id = $3)
            ${distanceFilter}
            ${fieldPositionFilter}
            GROUP BY t.id, t.name, t.abbreviation
            HAVING COUNT(*) >= 10
            ORDER BY pressure_rate DESC
            LIMIT $4
        `;

        const result = await query(
            situationalQuery,
            [
                season,
                down || null,
                team_id || null,
                limit
            ],
            true
        );

        const response = {
            data: result.rows.map((team, index) => ({
                rank: index + 1,
                team: {
                    name: team.team_name,
                    abbreviation: team.abbreviation
                },
                stats: {
                    total_plays: parseInt(team.total_plays),
                    pressures: parseInt(team.pressures),
                    sacks: parseInt(team.sacks),
                    interceptions: parseInt(team.interceptions),
                    pass_breakups: parseInt(team.pass_breakups),
                    third_down_stops: parseInt(team.third_down_stops),
                    avg_yards_allowed: parseFloat(team.avg_yards_allowed),
                    pressure_rate: parseFloat(team.pressure_rate),
                    negative_play_rate: parseFloat(team.negative_play_rate)
                }
            })),
            filters: {
                season: parseInt(season),
                down: down ? parseInt(down) : null,
                distance: distance || null,
                field_position: field_position || null,
                team_id: team_id ? parseInt(team_id) : null
            }
        };

        await cache.set(cacheKey, response, 600); // 10 minute cache
        res.json(response);

    } catch (error) {
        next(error);
    }
});

// Get defensive efficiency by formation matchups
router.get('/formation-matchups', async (req, res, next) => {
    try {
        const {
            season = 2024,
            team_id,
            offensive_formation,
            defensive_formation
        } = req.query;

        const cacheKey = `formation_matchups:${JSON.stringify(req.query)}`;
        const cachedResult = await cache.get(cacheKey);
        
        if (cachedResult) {
            return res.json(cachedResult);
        }

        const matchupQuery = `
            SELECT 
                of.name as offensive_formation,
                df.name as defensive_formation,
                t.name as defending_team,
                COUNT(*) as total_plays,
                ROUND(AVG(p.yards_gained), 2) as avg_yards_allowed,
                COUNT(CASE WHEN dm.pressure_generated = true THEN 1 END) as pressures,
                COUNT(CASE WHEN dm.sack_recorded = true THEN 1 END) as sacks,
                COUNT(CASE WHEN p.is_turnover = true THEN 1 END) as turnovers_forced,
                ROUND(
                    COUNT(CASE WHEN dm.pressure_generated = true THEN 1 END)::decimal / 
                    NULLIF(COUNT(*), 0), 3
                ) as pressure_rate,
                ROUND(
                    COUNT(CASE WHEN p.yards_gained <= 2 THEN 1 END)::decimal / 
                    NULLIF(COUNT(*), 0), 3
                ) as stuff_rate
            FROM plays p
            JOIN games g ON p.game_id = g.id
            JOIN seasons s ON g.season_id = s.id
            LEFT JOIN formations of ON p.offensive_formation_id = of.id
            LEFT JOIN formations df ON p.defensive_formation_id = df.id
            LEFT JOIN defensive_metrics dm ON p.id = dm.play_id
            LEFT JOIN play_participants pp ON p.id = pp.play_id AND pp.participation_type = 'defense'
            LEFT JOIN players pl ON pp.player_id = pl.id
            LEFT JOIN teams t ON pl.team_id = t.id
            WHERE s.year = $1
            AND ($2::int IS NULL OR t.id = $2)
            AND ($3::text IS NULL OR of.name ILIKE $3)
            AND ($4::text IS NULL OR df.name ILIKE $4)
            AND of.name IS NOT NULL 
            AND df.name IS NOT NULL
            GROUP BY of.name, df.name, t.name
            HAVING COUNT(*) >= 5
            ORDER BY avg_yards_allowed ASC, pressure_rate DESC
            LIMIT 50
        `;

        const result = await query(
            matchupQuery,
            [
                season,
                team_id || null,
                offensive_formation ? `%${offensive_formation}%` : null,
                defensive_formation ? `%${defensive_formation}%` : null
            ],
            true
        );

        const response = {
            data: result.rows.map(matchup => ({
                matchup: {
                    offensive_formation: matchup.offensive_formation,
                    defensive_formation: matchup.defensive_formation,
                    defending_team: matchup.defending_team
                },
                stats: {
                    total_plays: parseInt(matchup.total_plays),
                    avg_yards_allowed: parseFloat(matchup.avg_yards_allowed),
                    pressures: parseInt(matchup.pressures),
                    sacks: parseInt(matchup.sacks),
                    turnovers_forced: parseInt(matchup.turnovers_forced),
                    pressure_rate: parseFloat(matchup.pressure_rate),
                    stuff_rate: parseFloat(matchup.stuff_rate)
                }
            })),
            filters: {
                season: parseInt(season),
                team_id: team_id ? parseInt(team_id) : null,
                offensive_formation: offensive_formation || null,
                defensive_formation: defensive_formation || null
            }
        };

        await cache.set(cacheKey, response, 900); // 15 minute cache
        res.json(response);

    } catch (error) {
        next(error);
    }
});

// Get player coverage statistics
router.get('/coverage-stats', async (req, res, next) => {
    try {
        const {
            player_id,
            season = 2024,
            coverage_type,
            min_targets = 10
        } = req.query;

        const cacheKey = `coverage_stats:${player_id}:${season}:${coverage_type}:${min_targets}`;
        const cachedResult = await cache.get(cacheKey);
        
        if (cachedResult) {
            return res.json(cachedResult);
        }

        const coverageQuery = `
            SELECT 
                pl.id,
                pl.first_name,
                pl.last_name,
                pl.position,
                t.name as team_name,
                dm.coverage_type,
                COUNT(*) as targets,
                COUNT(CASE WHEN dm.completion_allowed = true THEN 1 END) as completions_allowed,
                COUNT(CASE WHEN dm.completion_allowed = false THEN 1 END) as pass_defenses,
                COUNT(CASE WHEN dm.interception = true THEN 1 END) as interceptions,
                COUNT(CASE WHEN dm.pass_breakup = true THEN 1 END) as pass_breakups,
                SUM(dm.yards_allowed) as total_yards_allowed,
                ROUND(AVG(dm.yards_allowed), 2) as avg_yards_per_target,
                ROUND(
                    COUNT(CASE WHEN dm.completion_allowed = true THEN 1 END)::decimal / 
                    NULLIF(COUNT(*), 0), 3
                ) as completion_rate_allowed,
                ROUND(
                    COUNT(CASE WHEN dm.completion_allowed = false THEN 1 END)::decimal / 
                    NULLIF(COUNT(*), 0), 3
                ) as pass_defense_rate
            FROM defensive_metrics dm
            JOIN plays p ON dm.play_id = p.id
            JOIN games g ON p.game_id = g.id
            JOIN seasons s ON g.season_id = s.id
            JOIN players pl ON dm.primary_defender_id = pl.id
            JOIN teams t ON pl.team_id = t.id
            WHERE s.year = $1
            AND dm.target_player_id IS NOT NULL
            AND ($2::int IS NULL OR pl.id = $2)
            AND ($3::text IS NULL OR dm.coverage_type = $3)
            GROUP BY pl.id, pl.first_name, pl.last_name, pl.position, t.name, dm.coverage_type
            HAVING COUNT(*) >= $4
            ORDER BY pass_defense_rate DESC, avg_yards_per_target ASC
            LIMIT 50
        `;

        const result = await query(
            coverageQuery,
            [
                season,
                player_id || null,
                coverage_type || null,
                min_targets
            ],
            true
        );

        const response = {
            data: result.rows.map(player => ({
                player: {
                    id: player.id,
                    name: `${player.first_name} ${player.last_name}`,
                    position: player.position,
                    team: player.team_name
                },
                coverage_type: player.coverage_type,
                stats: {
                    targets: parseInt(player.targets),
                    completions_allowed: parseInt(player.completions_allowed),
                    pass_defenses: parseInt(player.pass_defenses),
                    interceptions: parseInt(player.interceptions),
                    pass_breakups: parseInt(player.pass_breakups),
                    total_yards_allowed: parseInt(player.total_yards_allowed),
                    avg_yards_per_target: parseFloat(player.avg_yards_per_target),
                    completion_rate_allowed: parseFloat(player.completion_rate_allowed),
                    pass_defense_rate: parseFloat(player.pass_defense_rate)
                }
            })),
            filters: {
                season: parseInt(season),
                player_id: player_id ? parseInt(player_id) : null,
                coverage_type: coverage_type || null,
                min_targets: parseInt(min_targets)
            }
        };

        await cache.set(cacheKey, response, 600); // 10 minute cache
        res.json(response);

    } catch (error) {
        next(error);
    }
});

module.exports = router;
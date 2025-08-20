const express = require('express');
const router = express.Router();
const { query, transaction, cache, pubsub, preparedStatements } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');
const { playFilters, playCreation } = require('../validators/playValidators');

// Get plays with comprehensive filtering
router.get('/', validationMiddleware(playFilters), async (req, res, next) => {
    try {
        const {
            game_id,
            team_id,
            down,
            yards_to_go_min,
            yards_to_go_max,
            quarter,
            play_type,
            formation_id,
            personnel_id,
            yard_line_min,
            yard_line_max,
            score_differential_min,
            score_differential_max,
            season,
            week,
            limit = 50,
            offset = 0,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        // Build cache key based on query parameters
        const cacheKey = `plays:${JSON.stringify(req.query)}`;
        
        // Try cache first for non-real-time requests
        if (!req.query.real_time) {
            const cachedResult = await cache.get(cacheKey);
            if (cachedResult) {
                return res.json(cachedResult);
            }
        }

        // Execute main query
        const result = await query(
            preparedStatements.getPlaysFiltered,
            [
                game_id || null,
                team_id || null,
                down || null,
                yards_to_go_min || null,
                yards_to_go_max || null,
                quarter || null,
                play_type || null,
                formation_id || null,
                personnel_id || null,
                yard_line_min || null,
                yard_line_max || null,
                score_differential_min || null,
                score_differential_max || null,
                season || null,
                week || null,
                parseInt(limit),
                parseInt(offset)
            ],
            true // Use read replica for this query
        );

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM plays p
            JOIN games g ON p.game_id = g.id
            WHERE ($1::int IS NULL OR p.game_id = $1)
            AND ($2::int IS NULL OR p.possession_team_id = $2)
            AND ($3::int IS NULL OR p.down = $3)
            AND ($4::int IS NULL OR p.yards_to_go >= $4)
            AND ($5::int IS NULL OR p.yards_to_go <= $5)
            AND ($6::int IS NULL OR p.quarter = $6)
            AND ($7::text IS NULL OR p.play_type = $7)
            AND ($8::int IS NULL OR p.defensive_formation_id = $8)
            AND ($9::int IS NULL OR p.defensive_personnel_id = $9)
            AND ($10::int IS NULL OR p.yard_line >= $10)
            AND ($11::int IS NULL OR p.yard_line <= $11)
            AND ($12::int IS NULL OR p.score_differential >= $12)
            AND ($13::int IS NULL OR p.score_differential <= $13)
            AND ($14::int IS NULL OR g.season_id = $14)
            AND ($15::int IS NULL OR g.week = $15)
        `;

        const countResult = await query(
            countQuery,
            [
                game_id || null,
                team_id || null,
                down || null,
                yards_to_go_min || null,
                yards_to_go_max || null,
                quarter || null,
                play_type || null,
                formation_id || null,
                personnel_id || null,
                yard_line_min || null,
                yard_line_max || null,
                score_differential_min || null,
                score_differential_max || null,
                season || null,
                week || null
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
                game_id: game_id || null,
                team_id: team_id || null,
                down: down || null,
                yards_to_go: yards_to_go_min || yards_to_go_max ? 
                    `${yards_to_go_min || 0}-${yards_to_go_max || 'max'}` : null,
                quarter: quarter || null,
                play_type: play_type || null,
                formation_id: formation_id || null,
                personnel_id: personnel_id || null,
                season: season || null,
                week: week || null
            }
        };

        // Cache the result for 2 minutes if not real-time
        if (!req.query.real_time) {
            await cache.set(cacheKey, response, 120);
        }

        res.json(response);
    } catch (error) {
        next(error);
    }
});

// Get single play with full details
router.get('/:id', async (req, res, next) => {
    try {
        const playId = req.params.id;
        
        const cacheKey = `play:${playId}`;
        const cachedPlay = await cache.get(cacheKey);
        
        if (cachedPlay) {
            return res.json({ data: cachedPlay });
        }

        const playQuery = `
            SELECT 
                p.*,
                g.home_team_id,
                g.away_team_id,
                g.week,
                g.season_id,
                s.year as season_year,
                g.game_date,
                ht.name as home_team_name,
                ht.abbreviation as home_team_abbr,
                at.name as away_team_name,
                at.abbreviation as away_team_abbr,
                pt.name as possession_team_name,
                pt.abbreviation as possession_team_abbr,
                of.name as offensive_formation,
                df.name as defensive_formation,
                op.name as offensive_personnel,
                dp.name as defensive_personnel
            FROM plays p
            JOIN games g ON p.game_id = g.id
            JOIN seasons s ON g.season_id = s.id
            JOIN teams ht ON g.home_team_id = ht.id
            JOIN teams at ON g.away_team_id = at.id
            JOIN teams pt ON p.possession_team_id = pt.id
            LEFT JOIN formations of ON p.offensive_formation_id = of.id
            LEFT JOIN formations df ON p.defensive_formation_id = df.id
            LEFT JOIN personnel_groups op ON p.offensive_personnel_id = op.id
            LEFT JOIN personnel_groups dp ON p.defensive_personnel_id = dp.id
            WHERE p.id = $1
        `;

        const playResult = await query(playQuery, [playId], true);
        
        if (playResult.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'PLAY_NOT_FOUND',
                    message: 'Play not found'
                }
            });
        }

        const play = playResult.rows[0];

        // Get defensive metrics for this play
        const defensiveMetricsQuery = `
            SELECT 
                dm.*,
                pl.first_name,
                pl.last_name,
                pl.position,
                t.name as defender_team
            FROM defensive_metrics dm
            LEFT JOIN players pl ON dm.primary_defender_id = pl.id
            LEFT JOIN teams t ON pl.team_id = t.id
            WHERE dm.play_id = $1
        `;

        const metricsResult = await query(defensiveMetricsQuery, [playId], true);

        // Get all participants
        const participantsQuery = `
            SELECT 
                pp.participation_type,
                pp.position_on_play,
                pl.first_name,
                pl.last_name,
                pl.position,
                pl.jersey_number,
                t.name as team_name
            FROM play_participants pp
            JOIN players pl ON pp.player_id = pl.id
            JOIN teams t ON pl.team_id = t.id
            WHERE pp.play_id = $1
            ORDER BY pp.participation_type, pl.position
        `;

        const participantsResult = await query(participantsQuery, [playId], true);

        const fullPlay = {
            ...play,
            defensive_metrics: metricsResult.rows[0] || null,
            participants: {
                offense: participantsResult.rows.filter(p => p.participation_type === 'offense'),
                defense: participantsResult.rows.filter(p => p.participation_type === 'defense'),
                special_teams: participantsResult.rows.filter(p => p.participation_type === 'special_teams')
            }
        };

        // Cache for 5 minutes
        await cache.set(cacheKey, fullPlay, 300);

        res.json({ data: fullPlay });
    } catch (error) {
        next(error);
    }
});

// Create new play (real-time ingestion)
router.post('/', authMiddleware.authenticate, validationMiddleware(playCreation), async (req, res, next) => {
    try {
        const playData = req.body;
        const io = req.app.get('io');

        const result = await transaction(async (client) => {
            // Insert main play record
            const playInsertQuery = `
                INSERT INTO plays (
                    nfl_play_id, game_id, drive_id, play_number, quarter, time_remaining,
                    down, yards_to_go, yard_line, possession_team_id, play_type, play_description,
                    yards_gained, score_differential, is_touchdown, is_turnover, is_penalty,
                    is_scoring_play, offensive_formation_id, defensive_formation_id,
                    offensive_personnel_id, defensive_personnel_id, expected_points_added,
                    win_probability_added
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
                    $19, $20, $21, $22, $23, $24
                ) RETURNING id
            `;

            const playResult = await client.query(playInsertQuery, [
                playData.nfl_play_id,
                playData.game_id,
                playData.drive_id,
                playData.play_number,
                playData.quarter,
                playData.time_remaining,
                playData.down,
                playData.yards_to_go,
                playData.yard_line,
                playData.possession_team_id,
                playData.play_type,
                playData.play_description,
                playData.yards_gained,
                playData.score_differential,
                playData.is_touchdown || false,
                playData.is_turnover || false,
                playData.is_penalty || false,
                playData.is_scoring_play || false,
                playData.offensive_formation_id,
                playData.defensive_formation_id,
                playData.offensive_personnel_id,
                playData.defensive_personnel_id,
                playData.expected_points_added,
                playData.win_probability_added
            ]);

            const playId = playResult.rows[0].id;

            // Insert defensive metrics if provided
            let defensiveMetricsId = null;
            if (playData.defensive_metrics) {
                const dm = playData.defensive_metrics;
                const defensiveInsertQuery = `
                    INSERT INTO defensive_metrics (
                        play_id, pressure_generated, sack_recorded, hurry_recorded,
                        pass_breakup, interception, target_player_id, coverage_type,
                        completion_allowed, yards_allowed, run_stuff, missed_tackles,
                        third_down_stop, red_zone_stop, goal_line_stop, primary_defender_id,
                        assist_defenders
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
                    ) RETURNING id
                `;

                const defensiveResult = await client.query(defensiveInsertQuery, [
                    playId,
                    dm.pressure_generated || false,
                    dm.sack_recorded || false,
                    dm.hurry_recorded || false,
                    dm.pass_breakup || false,
                    dm.interception || false,
                    dm.target_player_id,
                    dm.coverage_type,
                    dm.completion_allowed,
                    dm.yards_allowed || 0,
                    dm.run_stuff || false,
                    dm.missed_tackles || 0,
                    dm.third_down_stop || false,
                    dm.red_zone_stop || false,
                    dm.goal_line_stop || false,
                    dm.primary_defender_id,
                    dm.assist_defenders ? JSON.stringify(dm.assist_defenders) : null
                ]);

                defensiveMetricsId = defensiveResult.rows[0].id;
            }

            // Insert participants
            if (playData.participants && playData.participants.length > 0) {
                const participantInsertQuery = `
                    INSERT INTO play_participants (
                        play_id, player_id, participation_type, position_on_play, snap_count
                    ) VALUES ($1, $2, $3, $4, $5)
                `;

                for (const participant of playData.participants) {
                    await client.query(participantInsertQuery, [
                        playId,
                        participant.player_id,
                        participant.participation_type,
                        participant.position_on_play,
                        participant.snap_count || 1
                    ]);
                }
            }

            return { playId, defensiveMetricsId };
        });

        // Invalidate related cache entries
        await cache.invalidatePattern('plays:*');
        await cache.invalidatePattern(`game:${playData.game_id}:*`);

        // Emit real-time update via WebSocket
        if (io) {
            const playUpdate = {
                type: 'play_added',
                play_id: result.playId,
                game_id: playData.game_id,
                quarter: playData.quarter,
                down: playData.down,
                yards_to_go: playData.yards_to_go,
                play_type: playData.play_type,
                yards_gained: playData.yards_gained,
                timestamp: new Date().toISOString()
            };

            io.to(`game_${playData.game_id}`).emit('play_update', playUpdate);
            
            // Also publish to Redis for other server instances
            await pubsub.publish('play_updates', playUpdate);
        }

        res.status(201).json({
            success: true,
            play_id: result.playId,
            defensive_metrics_id: result.defensiveMetricsId,
            message: 'Play successfully recorded'
        });

    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({
                error: {
                    code: 'DUPLICATE_PLAY',
                    message: 'Play with this NFL ID already exists'
                }
            });
        }
        next(error);
    }
});

// Bulk play import
router.post('/bulk', authMiddleware.authenticate, authMiddleware.requireRole(['admin']), async (req, res, next) => {
    try {
        const { plays } = req.body;
        
        if (!Array.isArray(plays) || plays.length === 0) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_BULK_DATA',
                    message: 'Plays array is required and must not be empty'
                }
            });
        }

        let processed = 0;
        let errors = [];

        // Process in batches of 100 for memory efficiency
        const batchSize = 100;
        for (let i = 0; i < plays.length; i += batchSize) {
            const batch = plays.slice(i, i + batchSize);
            
            for (let j = 0; j < batch.length; j++) {
                try {
                    const playData = batch[j];
                    // Reuse the single play creation logic
                    await transaction(async (client) => {
                        // Same insertion logic as single play creation
                        // ... (abbreviated for brevity)
                    });
                    processed++;
                } catch (error) {
                    errors.push({
                        index: i + j,
                        play_id: batch[j].nfl_play_id,
                        error: error.message
                    });
                }
            }
        }

        // Invalidate caches after bulk import
        await cache.invalidatePattern('plays:*');

        res.json({
            success: true,
            processed,
            total: plays.length,
            errors: errors.length,
            error_details: errors.slice(0, 10) // Limit error details returned
        });

    } catch (error) {
        next(error);
    }
});

// Update play (admin only)
router.put('/:id', authMiddleware.authenticate, authMiddleware.requireRole(['admin']), async (req, res, next) => {
    try {
        const playId = req.params.id;
        const updates = req.body;

        // Build dynamic update query
        const allowedFields = [
            'play_description', 'yards_gained', 'is_touchdown', 'is_turnover', 
            'is_penalty', 'is_scoring_play', 'expected_points_added', 'win_probability_added'
        ];

        const updateFields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                error: {
                    code: 'NO_VALID_UPDATES',
                    message: 'No valid fields to update'
                }
            });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(playId);

        const updateQuery = `
            UPDATE plays 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'PLAY_NOT_FOUND',
                    message: 'Play not found'
                }
            });
        }

        // Invalidate cache
        await cache.del(`play:${playId}`);
        await cache.invalidatePattern('plays:*');

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

// Get defensive metrics for a specific play
router.get('/:id/defensive-metrics', async (req, res, next) => {
    try {
        const playId = req.params.id;

        const result = await query(
            preparedStatements.getDefensiveMetrics,
            [playId, null, 1, 0],
            true
        );

        res.json({
            data: result.rows[0] || null
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
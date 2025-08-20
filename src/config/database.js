const { Pool } = require('pg');
const Redis = require('ioredis');

// PostgreSQL connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nfl_analytics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    
    // Connection pool settings for high performance
    max: 20, // Maximum number of clients in the pool
    min: 2,  // Minimum number of clients in the pool
    idle: 30000, // Close idle clients after 30 seconds
    acquire: 60000, // Acquire timeout
    
    // Performance optimizations
    statement_timeout: 30000, // 30 second query timeout
    query_timeout: 30000,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
};

// Create read-only replica pool for analytics queries
const readReplicaConfig = {
    ...dbConfig,
    host: process.env.DB_READ_HOST || process.env.DB_HOST || 'localhost',
    max: 10, // Fewer connections for read replica
};

// Main database pool (read/write)
const pool = new Pool(dbConfig);

// Read replica pool for analytics queries
const readPool = new Pool(readReplicaConfig);

// Redis configuration for caching
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    
    // Connection pool settings
    family: 4,
    keepAlive: true,
    lazyConnect: true,
};

const redis = new Redis(redisConfig);

// Redis pub/sub for real-time updates
const redisPub = new Redis(redisConfig);
const redisSub = new Redis(redisConfig);

// Database connection event handlers
pool.on('connect', (client) => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('PostgreSQL connection error:', err);
    process.exit(-1);
});

readPool.on('connect', (client) => {
    console.log('Connected to PostgreSQL read replica');
});

readPool.on('error', (err) => {
    console.error('PostgreSQL read replica error:', err);
});

// Redis connection event handlers
redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

// Database query wrapper with error handling and logging
const query = async (text, params = [], useReadReplica = false) => {
    const start = Date.now();
    const selectedPool = useReadReplica ? readPool : pool;
    
    try {
        const res = await selectedPool.query(text, params);
        const duration = Date.now() - start;
        
        if (process.env.NODE_ENV === 'development') {
            console.log('Executed query', { text, duration, rows: res.rowCount });
        }
        
        return res;
    } catch (error) {
        const duration = Date.now() - start;
        console.error('Database query error:', {
            error: error.message,
            text: text.substring(0, 100) + '...',
            duration,
            params: params.length
        });
        throw error;
    }
};

// Transaction wrapper
const transaction = async (callback) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Cache utilities
const cache = {
    get: async (key) => {
        try {
            const value = await redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },
    
    set: async (key, value, ttl = 300) => {
        try {
            await redis.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    },
    
    del: async (key) => {
        try {
            await redis.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    },
    
    invalidatePattern: async (pattern) => {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            console.error('Cache invalidation error:', error);
        }
    }
};

// Real-time pub/sub for WebSocket updates
const pubsub = {
    publish: async (channel, message) => {
        try {
            await redisPub.publish(channel, JSON.stringify(message));
        } catch (error) {
            console.error('Pub/sub publish error:', error);
        }
    },
    
    subscribe: (channel, callback) => {
        redisSub.subscribe(channel);
        redisSub.on('message', (receivedChannel, message) => {
            if (receivedChannel === channel) {
                try {
                    const data = JSON.parse(message);
                    callback(data);
                } catch (error) {
                    console.error('Pub/sub message parse error:', error);
                }
            }
        });
    }
};

// Prepared statements for common queries
const preparedStatements = {
    // Play filtering query with all possible filters
    getPlaysFiltered: `
        SELECT 
            p.*,
            g.home_team_id,
            g.away_team_id,
            g.week,
            g.season_id,
            ht.name as home_team_name,
            at.name as away_team_name,
            pt.name as possession_team_name,
            of.name as offensive_formation,
            df.name as defensive_formation,
            op.name as offensive_personnel,
            dp.name as defensive_personnel
        FROM plays p
        JOIN games g ON p.game_id = g.id
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        JOIN teams pt ON p.possession_team_id = pt.id
        LEFT JOIN formations of ON p.offensive_formation_id = of.id
        LEFT JOIN formations df ON p.defensive_formation_id = df.id
        LEFT JOIN personnel_groups op ON p.offensive_personnel_id = op.id
        LEFT JOIN personnel_groups dp ON p.defensive_personnel_id = dp.id
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
        ORDER BY p.created_at DESC
        LIMIT $16 OFFSET $17
    `,
    
    // Defensive metrics with player info
    getDefensiveMetrics: `
        SELECT 
            dm.*,
            p.play_type,
            p.down,
            p.yards_to_go,
            pl.first_name,
            pl.last_name,
            pl.position,
            t.name as team_name
        FROM defensive_metrics dm
        JOIN plays p ON dm.play_id = p.id
        LEFT JOIN players pl ON dm.primary_defender_id = pl.id
        LEFT JOIN teams t ON pl.team_id = t.id
        WHERE ($1::bigint IS NULL OR dm.play_id = $1)
        AND ($2::int IS NULL OR dm.primary_defender_id = $2)
        ORDER BY dm.created_at DESC
        LIMIT $3 OFFSET $4
    `,
    
    // Player defensive stats aggregation
    getPlayerDefensiveStats: `
        SELECT 
            pl.id,
            pl.first_name,
            pl.last_name,
            pl.position,
            t.name as team_name,
            COUNT(*) as total_snaps,
            COUNT(*) FILTER (WHERE dm.pressure_generated = true) as pressures,
            COUNT(*) FILTER (WHERE dm.sack_recorded = true) as sacks,
            COUNT(*) FILTER (WHERE dm.hurry_recorded = true) as hurries,
            COUNT(*) FILTER (WHERE dm.interception = true) as interceptions,
            COUNT(*) FILTER (WHERE dm.pass_breakup = true) as pass_breakups,
            COUNT(*) FILTER (WHERE dm.third_down_stop = true) as third_down_stops,
            ROUND(AVG(dm.yards_allowed), 2) as avg_yards_allowed,
            ROUND(
                COUNT(*) FILTER (WHERE dm.pressure_generated = true)::decimal / 
                NULLIF(COUNT(*), 0), 3
            ) as pressure_rate
        FROM players pl
        JOIN teams t ON pl.team_id = t.id
        JOIN play_participants pp ON pl.id = pp.player_id
        JOIN plays p ON pp.play_id = p.id
        JOIN games g ON p.game_id = g.id
        LEFT JOIN defensive_metrics dm ON p.id = dm.play_id AND dm.primary_defender_id = pl.id
        WHERE pp.participation_type = 'defense'
        AND ($1::int IS NULL OR pl.id = $1)
        AND ($2::int IS NULL OR pl.team_id = $2)
        AND ($3::int IS NULL OR g.season_id = $3)
        AND ($4::int IS NULL OR g.week = $4)
        AND ($5::text IS NULL OR pl.position = $5)
        GROUP BY pl.id, pl.first_name, pl.last_name, pl.position, t.name
        HAVING COUNT(*) >= $6
        ORDER BY pressure_rate DESC NULLS LAST
        LIMIT $7 OFFSET $8
    `
};

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('Closing database connections...');
    try {
        await pool.end();
        await readPool.end();
        redis.disconnect();
        redisPub.disconnect();
        redisSub.disconnect();
        console.log('Database connections closed');
    } catch (error) {
        console.error('Error closing database connections:', error);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = {
    query,
    transaction,
    cache,
    pubsub,
    preparedStatements,
    pool,
    readPool,
    redis
};
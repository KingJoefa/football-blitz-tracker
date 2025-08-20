const { cache } = require('../config/database');

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds
 * @param {function} keyGenerator - Custom key generator function
 * @returns {function} Express middleware
 */
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
    return async (req, res, next) => {
        // Skip cache for real-time requests or authenticated write operations
        if (req.method !== 'GET' || req.query.real_time === 'true') {
            return next();
        }

        try {
            // Generate cache key
            let cacheKey;
            if (keyGenerator) {
                cacheKey = keyGenerator(req);
            } else {
                // Default key generation
                const queryString = JSON.stringify(req.query);
                const pathString = req.route ? req.route.path : req.path;
                cacheKey = `api:${req.method}:${pathString}:${Buffer.from(queryString).toString('base64')}`;
            }

            // Try to get from cache
            const cachedData = await cache.get(cacheKey);
            
            if (cachedData) {
                // Add cache headers
                res.set({
                    'X-Cache': 'HIT',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${ttl}`
                });
                
                return res.json(cachedData);
            }

            // Store original res.json function
            const originalJson = res.json.bind(res);
            
            // Override res.json to cache the response
            res.json = function(data) {
                // Only cache successful responses
                if (res.statusCode === 200) {
                    cache.set(cacheKey, data, ttl).catch(err => {
                        console.error('Cache set error:', err);
                    });
                }
                
                // Add cache headers
                res.set({
                    'X-Cache': 'MISS',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${ttl}`
                });
                
                return originalJson(data);
            };

            next();
        } catch (error) {
            // If cache fails, continue without caching
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * Cache invalidation middleware for write operations
 * Automatically invalidates related cache entries on POST/PUT/DELETE
 */
const cacheInvalidationMiddleware = (patterns = []) => {
    return async (req, res, next) => {
        // Store original response methods
        const originalJson = res.json.bind(res);
        const originalStatus = res.status.bind(res);
        
        let statusCode = 200;
        
        // Override status to track status codes
        res.status = function(code) {
            statusCode = code;
            return originalStatus(code);
        };
        
        // Override json to invalidate cache on successful writes
        res.json = async function(data) {
            // Only invalidate on successful write operations
            if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') && 
                statusCode >= 200 && statusCode < 300) {
                
                try {
                    // Default invalidation patterns based on route
                    const defaultPatterns = generateInvalidationPatterns(req);
                    const allPatterns = [...defaultPatterns, ...patterns];
                    
                    // Invalidate all matching patterns
                    await Promise.all(
                        allPatterns.map(pattern => cache.invalidatePattern(pattern))
                    );
                    
                    console.log('Cache invalidated for patterns:', allPatterns);
                } catch (error) {
                    console.error('Cache invalidation error:', error);
                }
            }
            
            return originalJson(data);
        };
        
        next();
    };
};

/**
 * Generate cache invalidation patterns based on request
 * @param {Object} req - Express request object
 * @returns {Array} Array of patterns to invalidate
 */
const generateInvalidationPatterns = (req) => {
    const patterns = [];
    const baseUrl = req.baseUrl || '';
    
    // General patterns based on route
    if (baseUrl.includes('/plays')) {
        patterns.push(
            'api:GET:/v1/plays:*',
            'plays:*',
            'defensive_metrics:*',
            'player_rankings:*',
            'team_rankings:*'
        );
        
        // If game_id is provided, invalidate game-specific caches
        if (req.body.game_id) {
            patterns.push(`game:${req.body.game_id}:*`);
        }
    }
    
    if (baseUrl.includes('/defensive')) {
        patterns.push(
            'defensive_*',
            'player_rankings:*',
            'team_rankings:*',
            'formation_matchups:*'
        );
    }
    
    if (baseUrl.includes('/players')) {
        patterns.push(
            'api:GET:/v1/players:*',
            'player_*'
        );
    }
    
    if (baseUrl.includes('/teams')) {
        patterns.push(
            'api:GET:/v1/teams:*',
            'team_*'
        );
    }
    
    if (baseUrl.includes('/games')) {
        patterns.push(
            'api:GET:/v1/games:*',
            'game:*'
        );
    }
    
    return patterns;
};

/**
 * Cache warming functions for frequently accessed data
 */
const cacheWarming = {
    /**
     * Warm team rankings cache for current season
     */
    warmTeamRankings: async () => {
        const currentYear = new Date().getFullYear();
        const metrics = ['pressure_rate', 'sack_rate', 'int_rate', 'third_down_stop_rate'];
        
        for (const metric of metrics) {
            const cacheKey = `team_rankings:${currentYear}:${metric}:1`;
            
            try {
                // Check if already cached
                const existing = await cache.get(cacheKey);
                if (!existing) {
                    console.log(`Warming cache for team rankings: ${metric}`);
                    // Would trigger the actual query here - abbreviated for brevity
                }
            } catch (error) {
                console.error(`Error warming team rankings cache for ${metric}:`, error);
            }
        }
    },
    
    /**
     * Warm player rankings cache for key positions
     */
    warmPlayerRankings: async () => {
        const currentYear = new Date().getFullYear();
        const positions = ['CB', 'S', 'LB', 'DE', 'DT'];
        
        for (const position of positions) {
            const cacheKey = `player_rankings:${currentYear}:${position}:pressures:100:50`;
            
            try {
                const existing = await cache.get(cacheKey);
                if (!existing) {
                    console.log(`Warming cache for player rankings: ${position}`);
                    // Would trigger the actual query here
                }
            } catch (error) {
                console.error(`Error warming player rankings cache for ${position}:`, error);
            }
        }
    },
    
    /**
     * Warm formation matchup data
     */
    warmFormationMatchups: async () => {
        const currentYear = new Date().getFullYear();
        const cacheKey = `formation_matchups:{"season":"${currentYear}"}`;
        
        try {
            const existing = await cache.get(cacheKey);
            if (!existing) {
                console.log('Warming cache for formation matchups');
                // Would trigger the actual query here
            }
        } catch (error) {
            console.error('Error warming formation matchups cache:', error);
        }
    }
};

/**
 * Cache statistics and monitoring
 */
const cacheStats = {
    getStats: async () => {
        try {
            // Redis info command to get cache statistics
            const info = await cache.redis.info('memory');
            const keyspace = await cache.redis.info('keyspace');
            
            return {
                memory_usage: info,
                keyspace_info: keyspace,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting cache stats:', error);
            return null;
        }
    }
};

/**
 * Initialize cache warming on server start
 */
const initializeCacheWarming = async () => {
    console.log('Initializing cache warming...');
    
    try {
        await Promise.all([
            cacheWarming.warmTeamRankings(),
            cacheWarming.warmPlayerRankings(),
            cacheWarming.warmFormationMatchups()
        ]);
        
        console.log('Cache warming completed');
    } catch (error) {
        console.error('Cache warming failed:', error);
    }
};

// Set up periodic cache warming (every 30 minutes)
setInterval(() => {
    initializeCacheWarming();
}, 30 * 60 * 1000);

module.exports = {
    cacheMiddleware,
    cacheInvalidationMiddleware,
    cacheWarming,
    cacheStats,
    initializeCacheWarming
};
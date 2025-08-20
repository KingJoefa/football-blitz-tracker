# NFL Play Tracking System - Deployment Guide

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available
- 50GB+ disk space for data growth

### Local Development Setup

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd nfl-play-tracking-system
   cp .env.example .env
   ```

2. **Configure Environment**
   Edit `.env` file with your settings:
   ```bash
   DB_PASSWORD=your_secure_password
   JWT_SECRET=your_32_character_jwt_secret
   REDIS_PASSWORD=your_redis_password
   ```

3. **Start Services**
   ```bash
   # Start core services
   docker-compose up -d postgres redis api

   # Start with monitoring (optional)
   docker-compose --profile tools up -d
   ```

4. **Initialize Database**
   ```bash
   # Database will auto-initialize with schema and seed data
   # Check logs: docker-compose logs postgres
   ```

5. **Verify Installation**
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"healthy"}
   ```

## Production Deployment

### Infrastructure Requirements

**Minimum Production Setup:**
- CPU: 4 cores (2 for API, 1 for DB, 1 for Redis)
- RAM: 8GB (4GB for PostgreSQL, 2GB for API, 1GB for Redis, 1GB system)
- Storage: 100GB SSD (database will grow ~10GB per season)
- Network: 1Gbps connection for real-time updates

**Recommended Production Setup:**
- CPU: 8 cores
- RAM: 16GB
- Storage: 500GB NVMe SSD
- Network: 10Gbps connection

### Production Environment Variables

```bash
NODE_ENV=production
DB_POOL_MAX=50
REDIS_PASSWORD=strong_production_password
JWT_SECRET=production_jwt_secret_at_least_32_chars
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
RATE_LIMIT_MAX_REQUESTS=5000
LOG_LEVEL=warn
```

### SSL/TLS Configuration

1. **Generate SSL Certificates**
   ```bash
   mkdir ssl
   # Use Let's Encrypt or your certificate provider
   certbot certonly --standalone -d api.yourdomain.com
   cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem ssl/
   cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem ssl/
   ```

2. **Update NGINX Configuration**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name api.yourdomain.com;
       
       ssl_certificate /etc/nginx/ssl/fullchain.pem;
       ssl_certificate_key /etc/nginx/ssl/privkey.pem;
       
       location / {
           proxy_pass http://api:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

### Database Optimization for Production

1. **PostgreSQL Configuration**
   ```bash
   # Add to docker-compose.yml postgres service
   command: >
     postgres
     -c shared_buffers=2GB
     -c effective_cache_size=6GB
     -c maintenance_work_mem=256MB
     -c checkpoint_completion_target=0.9
     -c wal_buffers=64MB
     -c random_page_cost=1.1
     -c effective_io_concurrency=300
     -c max_worker_processes=8
     -c max_parallel_workers_per_gather=4
     -c max_parallel_workers=8
   ```

2. **Setup Read Replica**
   ```bash
   # Read replica will automatically sync with primary
   # Configure API to use replica for analytics queries
   DB_READ_HOST=postgres_replica
   ```

## Monitoring and Alerting

### Health Checks

The system includes comprehensive health checks:

- **API Health**: `GET /health`
- **Database Health**: Connection pool status
- **Redis Health**: Cache connectivity
- **WebSocket Health**: Real-time connection status

### Monitoring Stack

1. **Prometheus Metrics**
   - API request rates and latency
   - Database query performance
   - Cache hit/miss ratios
   - WebSocket connections

2. **Grafana Dashboards**
   - System overview
   - API performance
   - Database metrics
   - Real-time game tracking

3. **Log Aggregation**
   ```bash
   # Logs are stored in /app/logs inside containers
   # Mount to host for persistence
   volumes:
     - ./logs:/app/logs
   ```

### Alerting Rules

Create alerts for:
- API response time > 2 seconds
- Database connection pool exhaustion
- Cache memory usage > 80%
- Disk space < 10GB remaining
- Error rate > 1%

## Scaling Strategies

### Horizontal Scaling (Multiple API Instances)

1. **Load Balancer Configuration**
   ```yaml
   # docker-compose.yml
   api:
     deploy:
       replicas: 3
   nginx:
     depends_on:
       - api
   ```

2. **Session Persistence**
   - JWT tokens are stateless (no server-side sessions)
   - WebSocket sessions stored in Redis
   - Cache shared across all instances

### Database Scaling

1. **Read Replicas**
   ```bash
   # Already configured in docker-compose.yml
   # Analytics queries automatically use read replica
   ```

2. **Connection Pooling**
   ```javascript
   // Optimized connection pool settings
   max: 20,          // Max connections per instance
   min: 2,           // Minimum connections
   acquire: 60000,   // Max time to get connection
   idle: 30000       // Close idle connections
   ```

### Cache Scaling

1. **Redis Cluster** (for high traffic)
   ```bash
   # Replace single Redis with cluster
   redis-cluster:
     image: redis:7-alpine
     command: redis-server --cluster-enabled yes
   ```

2. **Multi-level Caching**
   - L1: Application memory (reference data)
   - L2: Redis (query results)
   - L3: CDN (API responses)

## Security Hardening

### Network Security

1. **Internal Network Isolation**
   ```yaml
   networks:
     backend:
       internal: true
     frontend:
       # External facing
   ```

2. **Firewall Rules**
   ```bash
   # Only allow necessary ports
   ufw allow 80      # HTTP
   ufw allow 443     # HTTPS
   ufw allow 22      # SSH (admin only)
   ufw deny 5432     # PostgreSQL (internal only)
   ufw deny 6379     # Redis (internal only)
   ```

### Application Security

1. **Rate Limiting by IP**
   ```javascript
   // Configured in API
   max: 1000,        // Requests per hour for authenticated users
   max: 100,         // Requests per hour for public
   ```

2. **Input Validation**
   - Joi validation on all endpoints
   - SQL injection prevention via prepared statements
   - XSS protection via helmet middleware

3. **Authentication & Authorization**
   - JWT tokens with short expiration
   - Role-based access control
   - API key authentication for integrations

### Data Security

1. **Encryption at Rest**
   ```bash
   # Enable PostgreSQL encryption
   -c ssl=on
   -c ssl_cert_file='/etc/ssl/certs/server.crt'
   -c ssl_key_file='/etc/ssl/private/server.key'
   ```

2. **Audit Logging**
   ```javascript
   // All data modifications logged with:
   // - User ID
   // - Timestamp
   // - Action type
   // - IP address
   // - Changed data
   ```

## Backup and Recovery

### Automated Backups

1. **Database Backup**
   ```bash
   # Daily backup script
   pg_dump -h postgres -U postgres nfl_analytics | gzip > backup_$(date +%Y%m%d).sql.gz
   
   # Upload to cloud storage
   aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://your-backup-bucket/
   ```

2. **Redis Backup**
   ```bash
   # Redis automatically saves to disk
   # Copy RDB file for backup
   docker cp nfl_redis:/data/dump.rdb ./backup/redis_$(date +%Y%m%d).rdb
   ```

### Recovery Procedures

1. **Database Recovery**
   ```bash
   # Stop API service
   docker-compose stop api
   
   # Restore database
   gunzip -c backup_20241215.sql.gz | docker exec -i nfl_postgres psql -U postgres -d nfl_analytics
   
   # Restart services
   docker-compose start api
   ```

2. **Point-in-Time Recovery**
   ```bash
   # PostgreSQL WAL archiving enabled
   # Can restore to any point in time within retention period
   ```

## Performance Tuning

### Database Optimization

1. **Index Maintenance**
   ```sql
   -- Weekly index maintenance
   REINDEX DATABASE nfl_analytics;
   ANALYZE;
   ```

2. **Partition Maintenance**
   ```sql
   -- Create new partitions for upcoming seasons
   CREATE TABLE plays_2025 PARTITION OF plays 
   FOR VALUES FROM (2025) TO (2026);
   ```

### Cache Optimization

1. **Cache Warming**
   ```bash
   # Automated cache warming on startup
   # Preloads frequently accessed data
   ```

2. **Cache Eviction Policies**
   ```bash
   # Redis configuration
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   ```

### API Performance

1. **Response Compression**
   ```javascript
   // Gzip compression enabled
   // Reduces payload size by ~70%
   ```

2. **Query Optimization**
   ```sql
   -- All queries use proper indexes
   -- Query execution plans monitored
   -- Slow queries automatically logged
   ```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   ```bash
   # Check PostgreSQL settings
   docker exec nfl_postgres psql -U postgres -c "SHOW shared_buffers;"
   
   # Check Redis memory
   docker exec nfl_redis redis-cli info memory
   ```

2. **Slow Queries**
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls FROM pg_stat_statements 
   ORDER BY mean_time DESC LIMIT 10;
   ```

3. **WebSocket Connection Issues**
   ```bash
   # Check WebSocket status
   curl -H "Upgrade: websocket" http://localhost:3001/socket.io/
   ```

### Log Analysis

```bash
# API logs
docker-compose logs -f api | grep ERROR

# Database logs
docker-compose logs -f postgres | grep "LOG:"

# Redis logs
docker-compose logs -f redis
```

This deployment guide provides everything needed to run the NFL Play Tracking System in production with high availability, security, and performance.
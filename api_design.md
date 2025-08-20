# NFL Play Tracking API Design

## Base URL
```
https://api.nfl-analytics.com/v1
```

## Authentication
- JWT Bearer tokens for authenticated endpoints
- API key for public read-only endpoints
- Rate limiting: 1000 requests/hour for authenticated, 100/hour for public

## Core Endpoints

### Teams
```http
GET /teams
GET /teams/{id}
GET /teams/{id}/players
GET /teams/{id}/games?season={year}
GET /teams/{id}/defensive-stats?season={year}&week={week}
```

### Players
```http
GET /players
GET /players/{id}
GET /players/{id}/defensive-metrics?season={year}
GET /players/search?name={name}&position={position}
POST /players (admin only)
PUT /players/{id} (admin only)
```

### Games
```http
GET /games?season={year}&week={week}&team={team_id}
GET /games/{id}
GET /games/{id}/plays
GET /games/{id}/summary
POST /games (admin only)
PUT /games/{id} (admin only)
```

### Plays (Core Analytics Endpoints)
```http
GET /plays
  ?game_id={id}
  &team_id={id}
  &down={1-4}
  &yards_to_go={min}-{max}
  &quarter={1-4}
  &play_type={type}
  &formation_id={id}
  &personnel_id={id}
  &yard_line={min}-{max}
  &score_differential={min}-{max}
  &season={year}
  &week={week}
  &limit={50}
  &offset={0}
  &sort_by={field}
  &sort_order={asc|desc}

GET /plays/{id}
GET /plays/{id}/defensive-metrics
POST /plays (real-time ingestion)
PUT /plays/{id} (admin only)
DELETE /plays/{id} (admin only)
```

### Defensive Analytics
```http
GET /defensive-metrics
  ?player_id={id}
  &team_id={id}
  &season={year}
  &week={week}
  &formation_id={id}
  &situation={third_down|red_zone|goal_line}
  
GET /defensive-metrics/team-rankings
  ?season={year}
  &metric={pressure_rate|sack_rate|int_rate}
  
GET /defensive-metrics/player-rankings
  ?season={year}
  &position={position}
  &metric={pressures|sacks|ints}
  &min_snaps={number}
  
GET /defensive-metrics/situational
  ?down={1-4}
  &distance={short|medium|long}
  &field_position={own|midfield|opponent}
```

### Formations & Personnel
```http
GET /formations?type={offensive|defensive}
GET /formations/{id}/effectiveness
GET /personnel-groups?type={offensive|defensive}
GET /personnel-groups/{id}/matchup-data
```

### Advanced Analytics
```http
GET /analytics/pressure-rates
  ?team_id={id}
  &season={year}
  &vs_formation={formation_id}
  &situation={down}&{distance}

GET /analytics/coverage-success
  ?defender_id={id}
  &coverage_type={man|zone}
  &season={year}

GET /analytics/third-down-defense
  ?team_id={id}
  &season={year}
  &distance={short|medium|long}

GET /analytics/red-zone-defense
  ?team_id={id}
  &season={year}
  &personnel={personnel_id}

GET /analytics/turnover-generation
  ?team_id={id}
  &player_id={id}
  &season={year}
  &play_type={pass|run}
```

## Request/Response Examples

### Get Plays with Complex Filtering
```http
GET /plays?team_id=15&down=3&yards_to_go=5-10&formation_id=3&season=2024&limit=100

Response:
{
  "data": [
    {
      "id": 12345,
      "nfl_play_id": "2024_1_NYG_DAL_123",
      "game": {
        "id": 456,
        "home_team": "Dallas Cowboys",
        "away_team": "New York Giants",
        "week": 1,
        "season": 2024
      },
      "quarter": 3,
      "time_remaining": "08:42",
      "down": 3,
      "yards_to_go": 7,
      "yard_line": 35,
      "possession_team": "New York Giants",
      "play_type": "pass",
      "play_description": "3-DAL 35 (8:42) E.Manning pass short right to O.Beckham pushed ob at DAL 28 for 7 yards",
      "yards_gained": 7,
      "formations": {
        "offensive": "11 Personnel",
        "defensive": "Nickel"
      },
      "situation": {
        "score_differential": -3,
        "is_conversion": true,
        "field_position": "opponent_territory"
      },
      "defensive_metrics": {
        "pressure_generated": true,
        "completion_allowed": true,
        "yards_allowed": 7,
        "coverage_type": "zone"
      }
    }
  ],
  "pagination": {
    "total": 1247,
    "limit": 100,
    "offset": 0,
    "has_more": true
  },
  "filters_applied": {
    "team_id": 15,
    "down": 3,
    "yards_to_go": "5-10",
    "formation_id": 3,
    "season": 2024
  }
}
```

### Get Defensive Player Rankings
```http
GET /defensive-metrics/player-rankings?season=2024&position=CB&metric=pressures&min_snaps=200

Response:
{
  "data": [
    {
      "rank": 1,
      "player": {
        "id": 789,
        "name": "Jalen Ramsey",
        "team": "Miami Dolphins",
        "position": "CB"
      },
      "stats": {
        "total_snaps": 645,
        "pressures": 23,
        "pressure_rate": 0.036,
        "sacks": 2,
        "hurries": 18,
        "pass_breakups": 12,
        "interceptions": 4,
        "completion_rate_allowed": 0.487,
        "yards_per_target": 6.2
      },
      "situational": {
        "third_down_stops": 15,
        "red_zone_stops": 8,
        "man_coverage_success": 0.672,
        "zone_coverage_success": 0.591
      }
    }
  ],
  "metadata": {
    "season": 2024,
    "position": "CB",
    "metric": "pressures",
    "min_snaps": 200,
    "total_players": 64
  }
}
```

### Real-time Play Ingestion
```http
POST /plays
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "nfl_play_id": "2024_1_KC_BUF_456",
  "game_id": 789,
  "quarter": 2,
  "time_remaining": "05:23",
  "down": 1,
  "yards_to_go": 10,
  "yard_line": 45,
  "possession_team_id": 12,
  "play_type": "pass",
  "play_description": "1-BUF 45 (5:23) P.Mahomes pass deep right to T.Kelce for 18 yards",
  "yards_gained": 18,
  "offensive_formation_id": 2,
  "defensive_formation_id": 5,
  "offensive_personnel_id": 1,
  "defensive_personnel_id": 3,
  "score_differential": 3,
  "defensive_metrics": {
    "pressure_generated": false,
    "completion_allowed": true,
    "yards_allowed": 18,
    "coverage_type": "zone",
    "primary_defender_id": 234,
    "missed_tackles": 1
  },
  "participants": [
    {
      "player_id": 100,
      "participation_type": "offense",
      "position_on_play": "QB"
    },
    {
      "player_id": 234,
      "participation_type": "defense", 
      "position_on_play": "S"
    }
  ]
}

Response:
{
  "success": true,
  "play_id": 98765,
  "message": "Play successfully recorded",
  "defensive_metrics_id": 45678
}
```

## Error Responses

```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "Invalid formation_id provided",
    "details": {
      "formation_id": "Formation with ID 999 does not exist"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Rate Limiting Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1642248600
```

## Bulk Operations

### Bulk Play Import
```http
POST /plays/bulk
Content-Type: application/json
Authorization: Bearer {admin_jwt_token}

{
  "plays": [
    {play_data_1},
    {play_data_2},
    ...
  ]
}

Response:
{
  "success": true,
  "processed": 150,
  "errors": 3,
  "error_details": [
    {
      "index": 45,
      "error": "Invalid game_id"
    }
  ]
}
```

### Data Export
```http
GET /export/plays?season=2024&team_id=15&format=csv
Authorization: Bearer {jwt_token}

# Returns CSV download or JSON with download URL
```
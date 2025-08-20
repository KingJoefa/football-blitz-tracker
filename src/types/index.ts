export interface Team {
  id: string
  name: string
  city: string
  abbreviation: string
  conference: 'AFC' | 'NFC'
  division: string
  primaryColor: string
  secondaryColor: string
}

export interface Game {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeam: Team
  awayTeam: Team
  date: string
  season: number
  week: number
  homeScore?: number
  awayScore?: number
  status: 'scheduled' | 'live' | 'final'
}

export interface BlitzType {
  id: string
  name: string
  category: 'Zone' | 'Man' | 'Stunt' | 'Edge' | 'A-Gap' | 'Delayed'
  description: string
  diagram?: string
  commonFormations: string[]
}

export interface BlitzRecord {
  id: string
  gameId: string
  game: Game
  defensiveTeamId: string
  defensiveTeam: Team
  offensiveTeamId: string
  offensiveTeam: Team
  blitzTypeId: string
  blitzType: BlitzType
  quarter: 1 | 2 | 3 | 4
  timeRemaining: string // "12:34" format
  down: 1 | 2 | 3 | 4
  distance: number
  fieldPosition: number // yards from own goal line
  formation: string
  personnel: string // e.g., "3-4", "4-3", "Nickel"
  blitzers: string[] // player positions/jerseys
  result: 'sack' | 'pressure' | 'hurry' | 'hit' | 'incomplete' | 'complete' | 'touchdown' | 'interception' | 'penalty'
  yardsGained?: number
  notes?: string
  timestamp: string
}

export interface BlitzPattern {
  id: string
  name: string
  description: string
  blitzTypeId: string
  blitzType: BlitzType
  formation: string
  personnel: string
  blitzers: string[]
  successRate: number
  totalAttempts: number
  teams: string[]
  lastUsed?: string
}

export interface SearchFilters {
  teams?: string[]
  blitzTypes?: string[]
  formations?: string[]
  personnel?: string[]
  dateRange?: {
    start: string
    end: string
  }
  result?: string
  down?: number
  fieldPosition?: {
    min: number
    max: number
  }
}

import React, { useState } from 'react'
import { Calendar, Target, Search } from 'lucide-react'
import { teams } from '../data/teams'
import { Game } from '../types'

const Games: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWeek, setSelectedWeek] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Mock data - in a real app, this would come from your database
  const games: (Game & { blitzCount: number; homeBlitzes: number; awayBlitzes: number })[] = [
    {
      id: 'game1',
      homeTeamId: 'buf',
      awayTeamId: 'kc',
      homeTeam: teams.find(t => t.id === 'buf')!,
      awayTeam: teams.find(t => t.id === 'kc')!,
      date: '2024-01-21',
      season: 2024,
      week: 18,
      homeScore: 24,
      awayScore: 27,
      status: 'final',
      blitzCount: 23,
      homeBlitzes: 12,
      awayBlitzes: 11
    },
    {
      id: 'game2',
      homeTeamId: 'phi',
      awayTeamId: 'dal',
      homeTeam: teams.find(t => t.id === 'phi')!,
      awayTeam: teams.find(t => t.id === 'dal')!,
      date: '2024-01-21',
      season: 2024,
      week: 18,
      homeScore: 31,
      awayScore: 28,
      status: 'final',
      blitzCount: 19,
      homeBlitzes: 10,
      awayBlitzes: 9
    },
    {
      id: 'game3',
      homeTeamId: 'bal',
      awayTeamId: 'cin',
      homeTeam: teams.find(t => t.id === 'bal')!,
      awayTeam: teams.find(t => t.id === 'cin')!,
      date: '2024-01-21',
      season: 2024,
      week: 18,
      homeScore: 34,
      awayScore: 20,
      status: 'final',
      blitzCount: 28,
      homeBlitzes: 15,
      awayBlitzes: 13
    },
    {
      id: 'game4',
      homeTeamId: 'sf',
      awayTeamId: 'gb',
      homeTeam: teams.find(t => t.id === 'sf')!,
      awayTeam: teams.find(t => t.id === 'gb')!,
      date: '2024-01-20',
      season: 2024,
      week: 18,
      homeScore: 24,
      awayScore: 21,
      status: 'final',
      blitzCount: 21,
      homeBlitzes: 11,
      awayBlitzes: 10
    },
    {
      id: 'game5',
      homeTeamId: 'det',
      awayTeamId: 'lar',
      homeTeam: teams.find(t => t.id === 'det')!,
      awayTeam: teams.find(t => t.id === 'lar')!,
      date: '2024-01-20',
      season: 2024,
      week: 18,
      homeScore: 31,
      awayScore: 23,
      status: 'final',
      blitzCount: 25,
      homeBlitzes: 13,
      awayBlitzes: 12
    }
  ]

  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12', 'Week 13', 'Week 14', 'Week 15', 'Week 16', 'Week 17', 'Week 18', 'Playoffs']
  const statuses = ['scheduled', 'live', 'final']

  const filteredGames = games.filter(game => {
    const matchesSearch = game.homeTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.awayTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.homeTeam.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.awayTeam.city.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesWeek = !selectedWeek || `Week ${game.week}` === selectedWeek
    const matchesStatus = !selectedStatus || game.status === selectedStatus

    return matchesSearch && matchesWeek && matchesStatus
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800'
      case 'final':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return 'LIVE'
      case 'final':
        return 'FINAL'
      default:
        return 'SCHEDULED'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Games</h1>
        <p className="mt-2 text-gray-600">
          View game schedules, results, and blitz statistics
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Games
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Week
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="select-field"
            >
              <option value="">All Weeks</option>
              {weeks.map(week => (
                <option key={week} value={week}>{week}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="select-field"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedWeek('')
                setSelectedStatus('')
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-4">
        {filteredGames.map((game) => (
          <div key={game.id} className="card hover:shadow-lg transition-shadow duration-200">
            {/* Game Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {game.awayTeam.city} {game.awayTeam.name} @ {game.homeTeam.city} {game.homeTeam.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(game.date)} • Week {game.week}
                  </p>
                </div>
              </div>
              <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(game.status)}`}>
                {getStatusText(game.status)}
              </span>
            </div>

            {/* Score and Teams */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              {/* Away Team */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: game.awayTeam.primaryColor }}
                  >
                    {game.awayTeam.abbreviation}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{game.awayTeam.city}</h4>
                    <h4 className="font-bold text-gray-900">{game.awayTeam.name}</h4>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{game.awayScore}</div>
              </div>

              {/* VS */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">VS</div>
                  <div className="text-sm text-gray-500 mt-1">Week {game.week}</div>
                </div>
              </div>

              {/* Home Team */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: game.homeTeam.primaryColor }}
                  >
                    {game.homeTeam.abbreviation}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{game.homeTeam.city}</h4>
                    <h4 className="font-bold text-gray-900">{game.homeTeam.name}</h4>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{game.homeScore}</div>
              </div>
            </div>

            {/* Blitz Statistics */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Blitz Statistics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-nfl-blue">{game.blitzCount}</p>
                  <p className="text-sm text-gray-600">Total Blitzes</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{game.homeBlitzes}</p>
                  <p className="text-sm text-gray-600">{game.homeTeam.name} Blitzes</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{game.awayBlitzes}</p>
                  <p className="text-sm text-gray-600">{game.awayTeam.name} Blitzes</p>
                </div>
              </div>
            </div>

            {/* Team Colors */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{game.awayTeam.abbreviation}:</span>
                  <div className="flex space-x-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: game.awayTeam.primaryColor }}
                      title="Primary Color"
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: game.awayTeam.secondaryColor }}
                      title="Secondary Color"
                    ></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{game.homeTeam.abbreviation}:</span>
                  <div className="flex space-x-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: game.homeTeam.primaryColor }}
                      title="Primary Color"
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: game.homeTeam.secondaryColor }}
                      title="Secondary Color"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Week Summary */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Week 18 Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-nfl-blue">{games.length}</p>
            <p className="text-sm text-gray-600">Games</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {games.reduce((acc, game) => acc + game.blitzCount, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Blitzes</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(games.reduce((acc, game) => acc + game.blitzCount, 0) / games.length)}
            </p>
            <p className="text-sm text-gray-600">Avg Blitzes/Game</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {games.filter(g => g.status === 'final').length}
            </p>
            <p className="text-sm text-gray-600">Completed Games</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Games

import React, { useState } from 'react'
import { Search, TrendingUp, Target, Users } from 'lucide-react'
import { teams } from '../data/teams'
import { Team } from '../types'

const Teams: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConference, setSelectedConference] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('')

  // Mock data - in a real app, this would come from your database
  const teamStats = teams.map(team => ({
    ...team,
    totalBlitzes: Math.floor(Math.random() * 100) + 20,
    successRate: Math.floor(Math.random() * 20) + 60,
    avgBlitzesPerGame: (Math.random() * 5 + 10).toFixed(1),
    favoriteBlitzType: ['Fire Zone', 'Cover 0 Blitz', 'Twist Blitz', 'Edge Blitz - OLB'][Math.floor(Math.random() * 4)],
    lastGame: 'Week 18',
    nextGame: 'Playoffs'
  }))

  const conferences = ['AFC', 'NFC']
  const divisions = ['East', 'North', 'South', 'West']

  const filteredTeams = teamStats.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesConference = !selectedConference || team.conference === selectedConference
    const matchesDivision = !selectedDivision || team.division === selectedDivision

    return matchesSearch && matchesConference && matchesDivision
  })

  const getTeamCardColor = (team: Team) => {
    return `border-l-4 border-l-[${team.primaryColor}]`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <p className="mt-2 text-gray-600">
          View team information and blitz performance statistics
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Teams
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
              Conference
            </label>
            <select
              value={selectedConference}
              onChange={(e) => setSelectedConference(e.target.value)}
              className="select-field"
            >
              <option value="">All Conferences</option>
              {conferences.map(conf => (
                <option key={conf} value={conf}>{conf}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Division
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="select-field"
            >
              <option value="">All Divisions</option>
              {divisions.map(div => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedConference('')
                setSelectedDivision('')
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Conference Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AFC Stats */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-3 h-3 bg-red-600 rounded-full mr-2"></span>
            AFC Conference
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {teamStats.filter(t => t.conference === 'AFC').length}
              </p>
              <p className="text-sm text-gray-600">Teams</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {Math.round(teamStats.filter(t => t.conference === 'AFC').reduce((acc, team) => acc + team.successRate, 0) / 16)}
              </p>
              <p className="text-sm text-gray-600">Avg Success Rate %</p>
            </div>
          </div>
        </div>

        {/* NFC Stats */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
            NFC Conference
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {teamStats.filter(t => t.conference === 'NFC').length}
              </p>
              <p className="text-sm text-gray-600">Teams</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(teamStats.filter(t => t.conference === 'NFC').reduce((acc, team) => acc + team.successRate, 0) / 16)}
              </p>
              <p className="text-sm text-gray-600">Avg Success Rate %</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <div key={team.id} className={`card hover:shadow-lg transition-shadow duration-200 ${getTeamCardColor(team)}`}>
            {/* Team Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: team.primaryColor }}
                >
                  {team.abbreviation}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{team.city} {team.name}</h3>
                  <p className="text-sm text-gray-500">{team.conference} {team.division}</p>
                </div>
              </div>
            </div>

            {/* Team Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Total Blitzes
                </span>
                <span className="font-semibold text-gray-900">{team.totalBlitzes}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Success Rate
                </span>
                <span className={`font-semibold ${
                  team.successRate >= 70 ? 'text-green-600' :
                  team.successRate >= 65 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {team.successRate}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Per Game
                </span>
                <span className="font-semibold text-gray-900">{team.avgBlitzesPerGame}</span>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">Favorite Blitz</p>
                <p className="text-sm font-medium text-gray-900">{team.favoriteBlitzType}</p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Last Game</p>
                    <p className="font-medium text-gray-900">{team.lastGame}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Next Game</p>
                    <p className="font-medium text-gray-900">{team.nextGame}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Colors */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex space-x-2">
                <div 
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: team.primaryColor }}
                  title="Primary Color"
                ></div>
                <div 
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: team.secondaryColor }}
                  title="Secondary Color"
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Division Breakdown */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Division Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {divisions.map(division => {
            const divisionTeams = teamStats.filter(t => t.division === division)
            const avgSuccessRate = Math.round(divisionTeams.reduce((acc, team) => acc + team.successRate, 0) / divisionTeams.length)
            
            return (
              <div key={division} className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{division} Division</h3>
                <p className="text-2xl font-bold text-nfl-blue">{avgSuccessRate}%</p>
                <p className="text-sm text-gray-600">Avg Success Rate</p>
                <p className="text-xs text-gray-500 mt-1">{divisionTeams.length} teams</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Teams

import React, { useState } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { blitzTypes } from '../data/blitzTypes'
import { teams } from '../data/teams'

const Analytics: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedBlitzType, setSelectedBlitzType] = useState('')

  // Mock data - in a real app, this would come from your database
  const blitzTypeData = [
    { name: 'Fire Zone', count: 156, successRate: 72 },
    { name: 'Cover 0 Blitz', count: 89, successRate: 68 },
    { name: 'Twist Blitz', count: 134, successRate: 65 },
    { name: 'Edge Blitz - OLB', count: 98, successRate: 71 },
    { name: 'A-Gap Blitz - MLB', count: 76, successRate: 69 },
    { name: 'Delayed Safety Blitz', count: 45, successRate: 74 }
  ]

  const teamBlitzData = [
    { name: 'Bills', blitzes: 89, successRate: 75 },
    { name: 'Eagles', blitzes: 76, successRate: 72 },
    { name: 'Ravens', blitzes: 82, successRate: 68 },
    { name: 'Chiefs', blitzes: 65, successRate: 71 },
    { name: 'Cowboys', blitzes: 71, successRate: 69 },
    { name: 'Bengals', blitzes: 58, successRate: 66 }
  ]

  const weeklyTrends = [
    { week: 'Week 1', blitzes: 45, successRate: 68 },
    { week: 'Week 2', blitzes: 52, successRate: 71 },
    { week: 'Week 3', blitzes: 48, successRate: 69 },
    { week: 'Week 4', blitzes: 61, successRate: 73 },
    { week: 'Week 5', blitzes: 55, successRate: 70 },
    { week: 'Week 6', blitzes: 58, successRate: 72 }
  ]

  const resultDistribution = [
    { name: 'Sack', value: 35, color: '#10B981' },
    { name: 'Pressure', value: 28, color: '#F59E0B' },
    { name: 'Hurry', value: 22, color: '#EF4444' },
    { name: 'Hit', value: 15, color: '#8B5CF6' }
  ]

  const downAndDistanceData = [
    { down: '1st', blitzes: 45, successRate: 65 },
    { down: '2nd', blitzes: 78, successRate: 68 },
    { down: '3rd', blitzes: 156, successRate: 72 },
    { down: '4th', blitzes: 23, successRate: 75 }
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Analyze blitz patterns, trends, and effectiveness across teams and situations
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="select-field"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.city} {team.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blitz Type
            </label>
            <select
              value={selectedBlitzType}
              onChange={(e) => setSelectedBlitzType(e.target.value)}
              className="select-field"
            >
              <option value="">All Types</option>
              {blitzTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="card text-center">
          <p className="text-sm font-medium text-gray-600">Total Blitzes</p>
          <p className="text-3xl font-bold text-nfl-blue">1,247</p>
          <p className="text-sm text-green-600">+12% from last week</p>
        </div>
        <div className="card text-center">
          <p className="text-sm font-medium text-gray-600">Success Rate</p>
          <p className="text-3xl font-bold text-green-600">68.2%</p>
          <p className="text-sm text-green-600">+2.1% from last week</p>
        </div>
        <div className="card text-center">
          <p className="text-sm font-medium text-gray-600">Avg Blitzes/Game</p>
          <p className="text-3xl font-bold text-purple-600">15.6</p>
          <p className="text-sm text-gray-600">Across all teams</p>
        </div>
        <div className="card text-center">
          <p className="text-sm font-medium text-gray-600">Most Effective</p>
          <p className="text-3xl font-bold text-orange-600">Bills</p>
          <p className="text-sm text-gray-600">75% success rate</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blitz Type Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Blitz Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={blitzTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" name="Count" />
              <Bar dataKey="successRate" fill="#10B981" name="Success Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Blitz Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Blitz Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamBlitzData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="blitzes" fill="#8B5CF6" name="Blitzes" />
              <Bar dataKey="successRate" fill="#F59E0B" name="Success Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Blitz Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="blitzes" stroke="#3B82F6" name="Blitzes" />
              <Line type="monotone" dataKey="successRate" stroke="#10B981" name="Success Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Result Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Blitz Results Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={resultDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {resultDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Down and Distance Analysis */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Down and Distance Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={downAndDistanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="down" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="blitzes" fill="#EF4444" name="Blitzes" />
            <Bar dataKey="successRate" fill="#10B981" name="Success Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Most Effective Blitz</h4>
            <p className="text-blue-700 text-sm">
              Fire Zone blitzes have the highest success rate at 72%, particularly effective on 3rd down situations.
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Team Performance</h4>
            <p className="text-green-700 text-sm">
              The Bills lead the league with a 75% blitz success rate, using a mix of zone and man blitzes effectively.
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Situational Success</h4>
            <p className="text-yellow-700 text-sm">
              3rd down blitzes are most common and have a 72% success rate, showing teams' confidence in pressure situations.
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Trend Analysis</h4>
            <p className="text-purple-700 text-sm">
              Blitz frequency has increased by 12% this week, with success rates trending upward across all teams.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics

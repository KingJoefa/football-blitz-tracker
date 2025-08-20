import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Target, 
  TrendingUp, 
  Calendar,
  Plus,
  Search,
  BarChart3
} from 'lucide-react'

const Dashboard: React.FC = () => {
  // Mock data - in a real app, this would come from your database
  const stats = [
    { name: 'Total Blitzes', value: '1,247', change: '+12%', changeType: 'increase' },
    { name: 'Success Rate', value: '68.2%', change: '+2.1%', changeType: 'increase' },
    { name: 'Teams Tracked', value: '32', change: '0%', changeType: 'neutral' },
    { name: 'Games This Week', value: '16', change: '+100%', changeType: 'increase' },
  ]

  const recentBlitzes = [
    {
      id: '1',
      team: 'Bills',
      opponent: 'Chiefs',
      type: 'Fire Zone',
      result: 'Sack',
      time: '2 hours ago'
    },
    {
      id: '2',
      team: 'Eagles',
      opponent: 'Cowboys',
      type: 'Cover 0 Blitz',
      result: 'Pressure',
      time: '4 hours ago'
    },
    {
      id: '3',
      team: 'Ravens',
      opponent: 'Bengals',
      type: 'Twist Blitz',
      result: 'Hurry',
      time: '6 hours ago'
    }
  ]

  const quickActions = [
    {
      name: 'Record New Blitz',
      description: 'Log a blitz from a recent game',
      icon: Plus,
      href: '/tracker',
      color: 'bg-nfl-blue'
    },
    {
      name: 'Search Patterns',
      description: 'Find similar blitz scenarios',
      icon: Search,
      href: '/analytics',
      color: 'bg-green-600'
    },
    {
      name: 'View Analytics',
      description: 'See blitz trends and statistics',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-purple-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Track and analyze NFL blitz pressures and defensive patterns
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div className={`flex items-center text-sm ${
                stat.changeType === 'increase' ? 'text-green-600' : 
                stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {stat.changeType === 'increase' && <TrendingUp className="h-4 w-4 mr-1" />}
                {stat.changeType === 'decrease' && <TrendingUp className="h-4 w-4 mr-1 rotate-180" />}
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.name}
                to={action.href}
                className="card hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${action.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">{action.name}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Blitzes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Blitzes</h2>
          <div className="space-y-3">
            {recentBlitzes.map((blitz) => (
              <div key={blitz.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-nfl-blue rounded-full flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {blitz.team} vs {blitz.opponent}
                    </p>
                    <p className="text-xs text-gray-500">{blitz.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    blitz.result === 'Sack' ? 'bg-green-100 text-green-800' :
                    blitz.result === 'Pressure' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {blitz.result}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{blitz.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link
              to="/tracker"
              className="text-sm text-nfl-blue hover:text-blue-700 font-medium"
            >
              View all blitzes →
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week's Games</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Bills vs Chiefs</p>
                  <p className="text-xs text-gray-500">Sunday 4:25 PM</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">Week 18</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Eagles vs Cowboys</p>
                  <p className="text-xs text-gray-500">Sunday 8:20 PM</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">Week 18</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Ravens vs Bengals</p>
                  <p className="text-xs text-gray-500">Sunday 1:00 PM</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">Week 18</span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/games"
              className="text-sm text-nfl-blue hover:text-blue-700 font-medium"
            >
              View all games →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

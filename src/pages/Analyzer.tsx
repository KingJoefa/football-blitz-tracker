import React from 'react'
import { ExternalLink, Zap, Play } from 'lucide-react'
import FootballField from '../components/FootballField'

const Analyzer: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">Football Analyzer</h1>
            <p className="text-gray-600 mt-2">
              Visualize and diagram football plays, formations, and blitz patterns
            </p>
          </div>

        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Play className="h-6 w-6 text-nfl-blue" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Play Visualization</h3>
              <p className="text-gray-600 text-sm">Diagram offensive and defensive formations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Blitz Patterns</h3>
              <p className="text-gray-600 text-sm">Show pressure schemes and routes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <ExternalLink className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Export & Share</h3>
              <p className="text-gray-600 text-sm">Save diagrams and share with team</p>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Integration with Blitz Tracker</h3>
        <div className="space-y-3 text-gray-700">
          <p>🎯 <strong>From Tracker to Analyzer:</strong> Visualize recorded blitzes and plays</p>
          <p>📊 <strong>From Analyzer to Tracker:</strong> Save new formations and submit blitz data</p>
          <p>🔄 <strong>Seamless Workflow:</strong> Design plays → Record results → Analyze patterns</p>
        </div>
        <div className="mt-4 flex items-center space-x-3">
          <a
            href="/tracker"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-nfl-blue border border-nfl-blue rounded-lg hover:bg-blue-50 transition-colors"
          >
            Go to Tracker
          </a>
          <a
            href="/analytics"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
          >
            View Analytics
          </a>
        </div>
      </div>

      {/* Embedded Field Analyzer */}
      <FootballField />
    </div>
  )
}

export default Analyzer

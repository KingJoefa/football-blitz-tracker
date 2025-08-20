import React, { useState } from 'react'
import { Plus, Target, Search } from 'lucide-react'
import { blitzTypes } from '../data/blitzTypes'
import { teams } from '../data/teams'
import { BlitzRecord } from '../types'

const BlitzTracker: React.FC = () => {
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedBlitzType, setSelectedBlitzType] = useState('')

  // Mock data - in a real app, this would come from your database
  const [blitzes, setBlitzes] = useState<BlitzRecord[]>([
    {
      id: '1',
      gameId: 'game1',
      game: {
        id: 'game1',
        homeTeamId: 'buf',
        awayTeamId: 'kc',
        homeTeam: teams.find(t => t.id === 'buf')!,
        awayTeam: teams.find(t => t.id === 'kc')!,
        date: '2024-01-21',
        season: 2024,
        week: 18,
        status: 'final'
      },
      defensiveTeamId: 'buf',
      defensiveTeam: teams.find(t => t.id === 'buf')!,
      offensiveTeamId: 'kc',
      offensiveTeam: teams.find(t => t.id === 'kc')!,
      blitzTypeId: 'fire-zone',
      blitzType: blitzTypes.find(bt => bt.id === 'fire-zone')!,
      quarter: 2,
      timeRemaining: '8:45',
      down: 3,
      distance: 7,
      fieldPosition: 45,
      formation: '3-4',
      personnel: 'Nickel',
      blitzers: ['MLB', 'SS'],
      result: 'sack',
      yardsGained: -8,
      notes: 'Great timing on the blitz, forced fumble',
      timestamp: '2024-01-21T20:30:00Z'
    }
  ])

  const [formData, setFormData] = useState({
    gameId: '',
    defensiveTeamId: '',
    offensiveTeamId: '',
    blitzTypeId: '',
    quarter: 1,
    timeRemaining: '',
    down: 1,
    distance: 10,
    fieldPosition: 20,
    formation: '',
    personnel: '',
    blitzers: [''],
    result: 'pressure' as const,
    yardsGained: 0,
    notes: ''
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBlitzerChange = (index: number, value: string) => {
    const newBlitzers = [...formData.blitzers]
    newBlitzers[index] = value
    setFormData(prev => ({ ...prev, blitzers: newBlitzers }))
  }

  const addBlitzer = () => {
    setFormData(prev => ({ ...prev, blitzers: [...prev.blitzers, ''] }))
  }

  const removeBlitzer = (index: number) => {
    if (formData.blitzers.length > 1) {
      const newBlitzers = formData.blitzers.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, blitzers: newBlitzers }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create new blitz record
    const newBlitz: BlitzRecord = {
      id: Date.now().toString(),
      gameId: formData.gameId,
      game: {
        id: formData.gameId,
        homeTeamId: 'buf', // Mock data
        awayTeamId: 'kc',
        homeTeam: teams.find(t => t.id === 'buf')!,
        awayTeam: teams.find(t => t.id === 'kc')!,
        date: '2024-01-21',
        season: 2024,
        week: 18,
        status: 'final'
      },
      defensiveTeamId: formData.defensiveTeamId,
      defensiveTeam: teams.find(t => t.id === formData.defensiveTeamId)!,
      offensiveTeamId: formData.offensiveTeamId,
      offensiveTeam: teams.find(t => t.id === formData.offensiveTeamId)!,
      blitzTypeId: formData.blitzTypeId,
      blitzType: blitzTypes.find(bt => bt.id === formData.blitzTypeId)!,
      quarter: formData.quarter,
      timeRemaining: formData.timeRemaining,
      down: formData.down,
      distance: formData.distance,
      fieldPosition: formData.fieldPosition,
      formation: formData.formation,
      personnel: formData.personnel,
      blitzers: formData.blitzers.filter(b => b.trim() !== ''),
      result: formData.result,
      yardsGained: formData.yardsGained,
      notes: formData.notes,
      timestamp: new Date().toISOString()
    }

    setBlitzes(prev => [newBlitz, ...prev])
    setShowForm(false)
    setFormData({
      gameId: '',
      defensiveTeamId: '',
      offensiveTeamId: '',
      blitzTypeId: '',
      quarter: 1,
      timeRemaining: '',
      down: 1,
      distance: 10,
      fieldPosition: 20,
      formation: '',
      personnel: '',
      blitzers: [''],
      result: 'pressure',
      yardsGained: 0,
      notes: ''
    })
  }

  const filteredBlitzes = blitzes.filter(blitz => {
    const matchesSearch = blitz.defensiveTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blitz.offensiveTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blitz.blitzType.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTeam = !selectedTeam || blitz.defensiveTeamId === selectedTeam
    const matchesType = !selectedBlitzType || blitz.blitzTypeId === selectedBlitzType

    return matchesSearch && matchesTeam && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blitz Tracker</h1>
          <p className="mt-2 text-gray-600">
            Record and track blitz pressures from NFL games
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Record Blitz</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search blitzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Defensive Team
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

      {/* Blitz Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record New Blitz</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Defensive Team
                </label>
                <select
                  required
                  value={formData.defensiveTeamId}
                  onChange={(e) => handleInputChange('defensiveTeamId', e.target.value)}
                  className="select-field"
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.city} {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offensive Team
                </label>
                <select
                  required
                  value={formData.offensiveTeamId}
                  onChange={(e) => handleInputChange('offensiveTeamId', e.target.value)}
                  className="select-field"
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.city} {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blitz Type
                </label>
                <select
                  required
                  value={formData.blitzTypeId}
                  onChange={(e) => handleInputChange('blitzTypeId', e.target.value)}
                  className="select-field"
                >
                  <option value="">Select Blitz Type</option>
                  {blitzTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Result
                </label>
                <select
                  required
                  value={formData.result}
                  onChange={(e) => handleInputChange('result', e.target.value)}
                  className="select-field"
                >
                  <option value="sack">Sack</option>
                  <option value="pressure">Pressure</option>
                  <option value="hurry">Hurry</option>
                  <option value="hit">Hit</option>
                  <option value="incomplete">Incomplete</option>
                  <option value="complete">Complete</option>
                  <option value="touchdown">Touchdown</option>
                  <option value="interception">Interception</option>
                  <option value="penalty">Penalty</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quarter
                </label>
                <select
                  required
                  value={formData.quarter}
                  onChange={(e) => handleInputChange('quarter', parseInt(e.target.value))}
                  className="select-field"
                >
                  <option value={1}>1st</option>
                  <option value={2}>2nd</option>
                  <option value={3}>3rd</option>
                  <option value={4}>4th</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Remaining
                </label>
                <input
                  type="text"
                  placeholder="12:34"
                  required
                  value={formData.timeRemaining}
                  onChange={(e) => handleInputChange('timeRemaining', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Down
                </label>
                <select
                  required
                  value={formData.down}
                  onChange={(e) => handleInputChange('down', parseInt(e.target.value))}
                  className="select-field"
                >
                  <option value={1}>1st</option>
                  <option value={2}>2nd</option>
                  <option value={3}>3rd</option>
                  <option value={4}>4th</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance
                </label>
                <input
                  type="number"
                  required
                  value={formData.distance}
                  onChange={(e) => handleInputChange('distance', parseInt(e.target.value))}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Position
                </label>
                <input
                  type="number"
                  required
                  value={formData.fieldPosition}
                  onChange={(e) => handleInputChange('fieldPosition', parseInt(e.target.value))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formation
                </label>
                <input
                  type="text"
                  placeholder="3-4, 4-3, etc."
                  value={formData.formation}
                  onChange={(e) => handleInputChange('formation', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personnel
                </label>
                <input
                  type="text"
                  placeholder="Nickel, Dime, etc."
                  value={formData.personnel}
                  onChange={(e) => handleInputChange('personnel', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blitzers
              </label>
              <div className="space-y-2">
                {formData.blitzers.map((blitzer, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="MLB, SS, CB, etc."
                      value={blitzer}
                      onChange={(e) => handleBlitzerChange(index, e.target.value)}
                      className="input-field flex-1"
                    />
                    {formData.blitzers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBlitzer(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBlitzer}
                  className="text-sm text-nfl-blue hover:text-blue-700"
                >
                  + Add Blitzer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yards Gained
                </label>
                <input
                  type="number"
                  value={formData.yardsGained}
                  onChange={(e) => handleInputChange('yardsGained', parseInt(e.target.value))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Additional observations..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Record Blitz
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Blitz List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Blitzes</h2>
        <div className="space-y-3">
          {filteredBlitzes.map((blitz) => (
            <div key={blitz.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-nfl-blue rounded-full flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {blitz.defensiveTeam.city} {blitz.defensiveTeam.name} vs {blitz.offensiveTeam.city} {blitz.offensiveTeam.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Q{blitz.quarter} - {blitz.timeRemaining} - {blitz.down}&{blitz.distance} at {blitz.fieldPosition}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  blitz.result === 'sack' ? 'bg-green-100 text-green-800' :
                  blitz.result === 'pressure' ? 'bg-yellow-100 text-yellow-800' :
                  blitz.result === 'hurry' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {blitz.result.charAt(0).toUpperCase() + blitz.result.slice(1)}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p className="font-medium">{blitz.blitzType.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Formation:</span>
                  <p className="font-medium">{blitz.formation}</p>
                </div>
                <div>
                  <span className="text-gray-500">Personnel:</span>
                  <p className="font-medium">{blitz.personnel}</p>
                </div>
                <div>
                  <span className="text-gray-500">Blitzers:</span>
                  <p className="font-medium">{blitz.blitzers.join(', ')}</p>
                </div>
              </div>
              {blitz.notes && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {blitz.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BlitzTracker

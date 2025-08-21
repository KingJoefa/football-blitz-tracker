import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Target, 
  BarChart3, 
  Users, 
  Calendar,
  Menu,
  X,
  Search,
  Plus,
  Bell,
  Settings,
  User,
  TrendingUp
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, description: 'Overview & Stats' },
    { name: 'Tracker', href: '/tracker', icon: Target, description: 'Record Blitzes' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, description: 'Charts & Trends' },
    { name: 'Teams', href: '/teams', icon: Users, description: 'Team Stats' },
    { name: 'Games', href: '/games', icon: Calendar, description: 'Schedule & Results' },
  ]

  const isActive = (href: string) => location.pathname === href

  const getPageTitle = () => {
    const currentPage = navigation.find(item => isActive(item.href))
    return currentPage?.name || 'Blitz Tracker'
  }

  const getPageDescription = () => {
    const currentPage = navigation.find(item => isActive(item.href))
    return currentPage?.description || 'NFL Blitz Analysis Platform'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Left side - Logo & Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="bg-nfl-blue p-2 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900 font-display">Blitz Tracker</h1>
                  <p className="text-xs text-gray-500">NFL Analytics Platform</p>
                </div>
              </Link>
            </div>

            {/* Center - Main Navigation (Desktop) */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-nfl-blue text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={item.description}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              {/* Quick Actions */}
              <div className="hidden lg:flex items-center space-x-2">
                <Link
                  to="/tracker"
                  className="flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Record
                </Link>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>

              {/* Notifications & Profile */}
              <div className="hidden sm:flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <User className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar (expandable) */}
        {searchOpen && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div className="mx-auto max-w-7xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search blitzes, teams, games..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nfl-blue focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-lg text-base font-medium ${
                      isActive(item.href)
                        ? 'bg-nfl-blue text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    <div>
                      <div>{item.name}</div>
                      <div className="text-sm opacity-75">{item.description}</div>
                    </div>
                  </Link>
                )
              })}
              
              {/* Mobile Quick Actions */}
              <div className="pt-4 border-t border-gray-200">
                <Link
                  to="/tracker"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-3 bg-green-600 text-white rounded-lg font-medium"
                >
                  <Plus className="mr-3 h-5 w-5" />
                  Record New Blitz
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Page Header with Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                <p className="text-sm text-gray-600 mt-1">{getPageDescription()}</p>
              </div>
              
              {/* Page-specific actions */}
              <div className="hidden sm:flex items-center space-x-3">
                {location.pathname === '/analytics' && (
                  <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Export Report
                  </button>
                )}
                {location.pathname === '/tracker' && (
                  <button className="flex items-center px-3 py-2 text-sm font-medium text-white bg-nfl-blue rounded-lg hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Blitz
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout

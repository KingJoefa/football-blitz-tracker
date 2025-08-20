import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import BlitzTracker from './pages/BlitzTracker'
import Analytics from './pages/Analytics'
import Teams from './pages/Teams'
import Games from './pages/Games'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tracker" element={<BlitzTracker />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/games" element={<Games />} />
      </Routes>
    </Layout>
  )
}

export default App

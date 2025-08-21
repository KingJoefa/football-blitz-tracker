import React, { useEffect, useRef, useState, useCallback } from 'react'
import { RotateCcw, Play, Pause } from 'lucide-react'

interface Player {
  id: string
  x: number
  y: number
  team: 'offense' | 'defense'
  number: number
  active: boolean
  startX?: number
  startY?: number
  endX?: number
  endY?: number
  route?: { x: number; y: number }[]
}

const FootballField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [offenseFormation, setOffenseFormation] = useState('')
  const [defenseFormation, setDefenseFormation] = useState('')
  const [timelineValue, setTimelineValue] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isSettingEndPoints, setIsSettingEndPoints] = useState(false)
  const [players, setPlayers] = useState<Player[]>([
    // Offense (11 players - blue) - Baltimore Ravens numbers
    { id: 'qb', x: 200, y: 200, team: 'offense', number: 8, active: true },        // QB (Lamar Jackson)
    { id: 'c', x: 240, y: 200, team: 'offense', number: 64, active: true },        // Center (Tyler Linderbaum)
    { id: 'lg', x: 240, y: 180, team: 'offense', number: 79, active: true },       // Left Guard (John Simpson)
    { id: 'rg', x: 240, y: 220, team: 'offense', number: 71, active: true },       // Right Guard (Andrew Vorhees)
    { id: 'lt', x: 240, y: 160, team: 'offense', number: 78, active: true },       // Left Tackle (Ronnie Stanley)
    { id: 'rt', x: 240, y: 240, team: 'offense', number: 74, active: true },       // Right Tackle (Roger Rosengarten)
    { id: 'rb', x: 160, y: 200, team: 'offense', number: 22, active: true },       // Running Back (Derrick Henry)
    { id: 'wr1', x: 250, y: 50, team: 'offense', number: 10, active: true },       // WR1 (DeAndre Hopkins)
    { id: 'wr2', x: 250, y: 350, team: 'offense', number: 4, active: true },        // WR2 (Zay Flowers)
    { id: 'te', x: 240, y: 130, team: 'offense', number: 89, active: true },       // Tight End (Mark Andrews)
    { id: 'wr3', x: 280, y: 100, team: 'offense', number: 16, active: true },      // WR3/Slot (Tylan Wallace)
    { id: 'fb', x: 50, y: 50, team: 'offense', number: 42, active: false },        // FB (Patrick Ricard) - inactive by default
    
    // Defense (11 players - red) - Buffalo Bills numbers
    { id: 'de1', x: 300, y: 170, team: 'defense', number: 57, active: true },      // Defensive End (A.J. Epenesa)
    { id: 'dt1', x: 300, y: 190, team: 'defense', number: 99, active: true },      // Defensive Tackle (DaQuan Jones)
    { id: 'dt2', x: 300, y: 210, team: 'defense', number: 91, active: true },      // Defensive Tackle (Ed Oliver)
    { id: 'de2', x: 300, y: 230, team: 'defense', number: 40, active: true },      // Defensive End (Von Miller)
    { id: 'mlb', x: 340, y: 200, team: 'defense', number: 50, active: true },      // Middle Linebacker (Terrel Bernard)
    { id: 'olb1', x: 340, y: 160, team: 'defense', number: 58, active: true },     // Outside LB (Matt Milano)
    { id: 'olb2', x: 340, y: 240, team: 'defense', number: 43, active: true },     // Outside LB (Nicholas Morrow)
    { id: 'cb1', x: 380, y: 80, team: 'defense', number: 7, active: true },        // Cornerback (Taron Johnson)
    { id: 'cb2', x: 380, y: 320, team: 'defense', number: 39, active: true },      // Cornerback (Tre'Davious White)
    { id: 'fs', x: 400, y: 150, team: 'defense', number: 3, active: true },        // Free Safety (Damar Hamlin)
    { id: 'ss', x: 400, y: 250, team: 'defense', number: 23, active: true }        // Strong Safety (Micah Hyde)
  ])

  const drawField = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = '#22C55E'
    ctx.fillRect(0, 0, 800, 400)
    
    // Draw yard lines
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    
    // Sidelines
    ctx.strokeRect(0, 0, 800, 400)
    
    // 50-yard line
    ctx.beginPath()
    ctx.moveTo(400, 0)
    ctx.lineTo(400, 400)
    ctx.stroke()
    
    // Goal lines
    ctx.beginPath()
    ctx.moveTo(80, 0)
    ctx.lineTo(80, 400)
    ctx.moveTo(720, 0)
    ctx.lineTo(720, 400)
    ctx.stroke()
    
    // Yard markers every 10 yards
    for (let i = 1; i < 10; i++) {
      const x = 80 + (i * 64)
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 400)
      ctx.stroke()
    }
  }

  const drawPlayers = (ctx: CanvasRenderingContext2D) => {
    players.forEach(player => {
      if (!player.active) return
      
      const radius = 15
      
      // Draw route line if exists
      if (player.route && player.route.length > 1) {
        ctx.strokeStyle = player.team === 'offense' ? '#60A5FA' : '#F87171'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(player.route[0].x, player.route[0].y)
        for (let i = 1; i < player.route.length; i++) {
          ctx.lineTo(player.route[i].x, player.route[i].y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
      
      // Draw end point if set
      if (player.endX && player.endY) {
        ctx.fillStyle = player.team === 'offense' ? '#DBEAFE' : '#FEE2E2'
        ctx.strokeStyle = player.team === 'offense' ? '#3B82F6' : '#EF4444'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(player.endX, player.endY, radius - 2, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        
        // Draw dotted line from current position to end point
        ctx.strokeStyle = player.team === 'offense' ? '#60A5FA' : '#F87171'
        ctx.lineWidth = 2
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(player.x, player.y)
        ctx.lineTo(player.endX, player.endY)
        ctx.stroke()
        ctx.setLineDash([])
      }
      
      // Player circle (current position)
      ctx.fillStyle = player.team === 'offense' ? '#3B82F6' : '#EF4444'
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(player.x, player.y, radius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      
      // Player number
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(player.number.toString(), player.x, player.y + 4)
    })
  }

  const render = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    drawField(ctx)
    drawPlayers(ctx)
  }

  const handleReset = () => {
    setPlayers([
      // Offense (11 players - blue) - Baltimore Ravens numbers
      { id: 'qb', x: 200, y: 200, team: 'offense', number: 8, active: true },        // QB (Lamar Jackson)
      { id: 'c', x: 240, y: 200, team: 'offense', number: 64, active: true },        // Center (Tyler Linderbaum)
      { id: 'lg', x: 240, y: 180, team: 'offense', number: 79, active: true },       // Left Guard (John Simpson)
      { id: 'rg', x: 240, y: 220, team: 'offense', number: 71, active: true },       // Right Guard (Andrew Vorhees)
      { id: 'lt', x: 240, y: 160, team: 'offense', number: 78, active: true },       // Left Tackle (Ronnie Stanley)
      { id: 'rt', x: 240, y: 240, team: 'offense', number: 74, active: true },       // Right Tackle (Roger Rosengarten)
      { id: 'rb', x: 160, y: 200, team: 'offense', number: 22, active: true },       // Running Back (Derrick Henry)
      { id: 'wr1', x: 250, y: 50, team: 'offense', number: 10, active: true },       // WR1 (DeAndre Hopkins)
      { id: 'wr2', x: 250, y: 350, team: 'offense', number: 4, active: true },        // WR2 (Zay Flowers)
      { id: 'te', x: 240, y: 130, team: 'offense', number: 89, active: true },       // Tight End (Mark Andrews)
      { id: 'wr3', x: 280, y: 100, team: 'offense', number: 16, active: true },      // WR3/Slot (Tylan Wallace)
      
      // Defense (11 players - red) - Buffalo Bills numbers
      { id: 'de1', x: 300, y: 170, team: 'defense', number: 57, active: true },      // Defensive End (A.J. Epenesa)
      { id: 'dt1', x: 300, y: 190, team: 'defense', number: 99, active: true },      // Defensive Tackle (DaQuan Jones)
      { id: 'dt2', x: 300, y: 210, team: 'defense', number: 91, active: true },      // Defensive Tackle (Ed Oliver)
      { id: 'de2', x: 300, y: 230, team: 'defense', number: 40, active: true },      // Defensive End (Von Miller)
      { id: 'mlb', x: 340, y: 200, team: 'defense', number: 50, active: true },      // Middle Linebacker (Terrel Bernard)
      { id: 'olb1', x: 340, y: 160, team: 'defense', number: 58, active: true },     // Outside LB (Matt Milano)
      { id: 'olb2', x: 340, y: 240, team: 'defense', number: 43, active: true },     // Outside LB (Nicholas Morrow)
      { id: 'cb1', x: 380, y: 80, team: 'defense', number: 7, active: true },        // Cornerback (Taron Johnson)
      { id: 'cb2', x: 380, y: 320, team: 'defense', number: 39, active: true },      // Cornerback (Tre'Davious White)
      { id: 'fs', x: 400, y: 150, team: 'defense', number: 3, active: true },        // Free Safety (Damar Hamlin)
      { id: 'ss', x: 400, y: 250, team: 'defense', number: 23, active: true }        // Strong Safety (Micah Hyde)
    ])
    setOffenseFormation('')
    setDefenseFormation('')
  }

  const handleOffenseFormationChange = (formation: string) => {
    setOffenseFormation(formation)
    
    // Each formation gets its own complete 11-player personnel package
    const formations = {
      'i-formation': [
        // I-Formation: QB, 5 OL, FB, RB, 2 WR, 1 TE
        { id: 'qb', x: 200, y: 200, team: 'offense', number: 8, active: true },        // QB (Lamar Jackson)
        { id: 'c', x: 240, y: 200, team: 'offense', number: 64, active: true },        // Center (Tyler Linderbaum)
        { id: 'lg', x: 240, y: 180, team: 'offense', number: 79, active: true },       // Left Guard (John Simpson)
        { id: 'rg', x: 240, y: 220, team: 'offense', number: 71, active: true },       // Right Guard (Andrew Vorhees)
        { id: 'lt', x: 240, y: 160, team: 'offense', number: 78, active: true },       // Left Tackle (Ronnie Stanley)
        { id: 'rt', x: 240, y: 240, team: 'offense', number: 74, active: true },       // Right Tackle (Roger Rosengarten)
        { id: 'fb', x: 170, y: 200, team: 'offense', number: 42, active: true },       // FB (Patrick Ricard)
        { id: 'rb', x: 140, y: 200, team: 'offense', number: 22, active: true },       // RB (Derrick Henry)
        { id: 'wr1', x: 280, y: 50, team: 'offense', number: 10, active: true },       // WR1 (DeAndre Hopkins)
        { id: 'wr2', x: 280, y: 350, team: 'offense', number: 4, active: true },       // WR2 (Zay Flowers)
        { id: 'te', x: 240, y: 130, team: 'offense', number: 89, active: true },       // TE (Mark Andrews)
      ],
      'shotgun': [
        // Shotgun: QB, 5 OL, RB, 3 WR, 1 TE
        { id: 'qb', x: 160, y: 200, team: 'offense', number: 8, active: true },        // QB (Lamar Jackson)
        { id: 'c', x: 240, y: 200, team: 'offense', number: 64, active: true },        // Center (Tyler Linderbaum)
        { id: 'lg', x: 240, y: 180, team: 'offense', number: 79, active: true },       // Left Guard (John Simpson)
        { id: 'rg', x: 240, y: 220, team: 'offense', number: 71, active: true },       // Right Guard (Andrew Vorhees)
        { id: 'lt', x: 240, y: 160, team: 'offense', number: 78, active: true },       // Left Tackle (Ronnie Stanley)
        { id: 'rt', x: 240, y: 240, team: 'offense', number: 74, active: true },       // Right Tackle (Roger Rosengarten)
        { id: 'rb', x: 120, y: 220, team: 'offense', number: 22, active: true },       // RB (Derrick Henry)
        { id: 'wr1', x: 280, y: 30, team: 'offense', number: 10, active: true },       // WR1 (DeAndre Hopkins)
        { id: 'wr2', x: 280, y: 370, team: 'offense', number: 4, active: true },       // WR2 (Zay Flowers)
        { id: 'wr3', x: 260, y: 120, team: 'offense', number: 16, active: true },      // WR3 (Tylan Wallace)
        { id: 'te', x: 240, y: 280, team: 'offense', number: 89, active: true },       // TE (Mark Andrews)
      ],
      'singleback': [
        // Singleback: QB, 5 OL, RB, 3 WR, 1 TE
        { id: 'qb', x: 200, y: 200, team: 'offense', number: 8, active: true },        // QB (Lamar Jackson)
        { id: 'c', x: 240, y: 200, team: 'offense', number: 64, active: true },        // Center (Tyler Linderbaum)
        { id: 'lg', x: 240, y: 180, team: 'offense', number: 79, active: true },       // Left Guard (John Simpson)
        { id: 'rg', x: 240, y: 220, team: 'offense', number: 71, active: true },       // Right Guard (Andrew Vorhees)
        { id: 'lt', x: 240, y: 160, team: 'offense', number: 78, active: true },       // Left Tackle (Ronnie Stanley)
        { id: 'rt', x: 240, y: 240, team: 'offense', number: 74, active: true },       // Right Tackle (Roger Rosengarten)
        { id: 'rb', x: 160, y: 200, team: 'offense', number: 22, active: true },       // RB (Derrick Henry)
        { id: 'wr1', x: 280, y: 60, team: 'offense', number: 10, active: true },       // WR1 (DeAndre Hopkins)
        { id: 'wr2', x: 280, y: 340, team: 'offense', number: 4, active: true },       // WR2 (Zay Flowers)
        { id: 'wr3', x: 260, y: 120, team: 'offense', number: 16, active: true },      // WR3 (Tylan Wallace)
        { id: 'te', x: 240, y: 280, team: 'offense', number: 89, active: true },       // TE (Mark Andrews)
      ],
      'pistol': [
        // Pistol: QB, 5 OL, RB, 3 WR, 1 TE
        { id: 'qb', x: 180, y: 200, team: 'offense', number: 8, active: true },        // QB (Lamar Jackson)
        { id: 'c', x: 240, y: 200, team: 'offense', number: 64, active: true },        // Center (Tyler Linderbaum)
        { id: 'lg', x: 240, y: 180, team: 'offense', number: 79, active: true },       // Left Guard (John Simpson)
        { id: 'rg', x: 240, y: 220, team: 'offense', number: 71, active: true },       // Right Guard (Andrew Vorhees)
        { id: 'lt', x: 240, y: 160, team: 'offense', number: 78, active: true },       // Left Tackle (Ronnie Stanley)
        { id: 'rt', x: 240, y: 240, team: 'offense', number: 74, active: true },       // Right Tackle (Roger Rosengarten)
        { id: 'rb', x: 140, y: 200, team: 'offense', number: 22, active: true },       // RB (Derrick Henry)
        { id: 'wr1', x: 280, y: 60, team: 'offense', number: 10, active: true },       // WR1 (DeAndre Hopkins)
        { id: 'wr2', x: 280, y: 340, team: 'offense', number: 4, active: true },       // WR2 (Zay Flowers)
        { id: 'wr3', x: 260, y: 120, team: 'offense', number: 16, active: true },      // WR3 (Tylan Wallace)
        { id: 'te', x: 240, y: 130, team: 'offense', number: 89, active: true },       // TE (Mark Andrews)
      ]
    }

    if (formations[formation]) {
      setPlayers(prevPlayers => {
        // Keep defense, replace offense
        const defense = prevPlayers.filter(p => p.team === 'defense')
        const offense = formations[formation]
        return [...offense, ...defense]
      })
    }
  }

  const handleDefenseFormationChange = (formation: string) => {
    setDefenseFormation(formation)
    
    setPlayers(prevPlayers => {
      const newPlayers = [...prevPlayers]
      
      if (formation === '4-3-defense') {
        // 4-3: 4 DL, 3 LB, 4 DB
        const de1 = newPlayers.find(p => p.id === 'de1'); if (de1) { de1.x = 300; de1.y = 150; }
        const dt1 = newPlayers.find(p => p.id === 'dt1'); if (dt1) { dt1.x = 300; dt1.y = 180; }
        const dt2 = newPlayers.find(p => p.id === 'dt2'); if (dt2) { dt2.x = 300; dt2.y = 220; }
        const de2 = newPlayers.find(p => p.id === 'de2'); if (de2) { de2.x = 300; de2.y = 250; }
        const mlb = newPlayers.find(p => p.id === 'mlb'); if (mlb) { mlb.x = 340; mlb.y = 200; }
        const olb1 = newPlayers.find(p => p.id === 'olb1'); if (olb1) { olb1.x = 340; olb1.y = 160; }
        const olb2 = newPlayers.find(p => p.id === 'olb2'); if (olb2) { olb2.x = 340; olb2.y = 240; }
        const cb1 = newPlayers.find(p => p.id === 'cb1'); if (cb1) { cb1.x = 380; cb1.y = 80; }
        const cb2 = newPlayers.find(p => p.id === 'cb2'); if (cb2) { cb2.x = 380; cb2.y = 320; }
        const fs = newPlayers.find(p => p.id === 'fs'); if (fs) { fs.x = 400; fs.y = 150; }
        const ss = newPlayers.find(p => p.id === 'ss'); if (ss) { ss.x = 400; ss.y = 250; }
      } else if (formation === '3-4-defense') {
        // 3-4: 3 DL, 4 LB, 4 DB
        const de1 = newPlayers.find(p => p.id === 'de1'); if (de1) { de1.x = 300; de1.y = 170; }
        const dt1 = newPlayers.find(p => p.id === 'dt1'); if (dt1) { dt1.x = 300; dt1.y = 200; }
        const dt2 = newPlayers.find(p => p.id === 'dt2'); if (dt2) { dt2.x = 300; dt2.y = 230; }
        const de2 = newPlayers.find(p => p.id === 'de2'); if (de2) { de2.x = 340; de2.y = 140; }  // OLB position
        const mlb = newPlayers.find(p => p.id === 'mlb'); if (mlb) { mlb.x = 340; mlb.y = 190; }
        const olb1 = newPlayers.find(p => p.id === 'olb1'); if (olb1) { olb1.x = 340; olb1.y = 210; }
        const olb2 = newPlayers.find(p => p.id === 'olb2'); if (olb2) { olb2.x = 340; olb2.y = 260; }
        const cb1 = newPlayers.find(p => p.id === 'cb1'); if (cb1) { cb1.x = 380; cb1.y = 80; }
        const cb2 = newPlayers.find(p => p.id === 'cb2'); if (cb2) { cb2.x = 380; cb2.y = 320; }
        const fs = newPlayers.find(p => p.id === 'fs'); if (fs) { fs.x = 400; fs.y = 150; }
        const ss = newPlayers.find(p => p.id === 'ss'); if (ss) { ss.x = 400; ss.y = 250; }
      } else if (formation === 'nickel') {
        // Nickel: 4 DL, 2 LB, 5 DB
        const de1 = newPlayers.find(p => p.id === 'de1'); if (de1) { de1.x = 300; de1.y = 160; }
        const dt1 = newPlayers.find(p => p.id === 'dt1'); if (dt1) { dt1.x = 300; dt1.y = 185; }
        const dt2 = newPlayers.find(p => p.id === 'dt2'); if (dt2) { dt2.x = 300; dt2.y = 215; }
        const de2 = newPlayers.find(p => p.id === 'de2'); if (de2) { de2.x = 300; de2.y = 240; }
        const mlb = newPlayers.find(p => p.id === 'mlb'); if (mlb) { mlb.x = 340; mlb.y = 180; }
        const olb1 = newPlayers.find(p => p.id === 'olb1'); if (olb1) { olb1.x = 340; olb1.y = 220; }
        const olb2 = newPlayers.find(p => p.id === 'olb2'); if (olb2) { olb2.x = 360; olb2.y = 130; }
        const cb1 = newPlayers.find(p => p.id === 'cb1'); if (cb1) { cb1.x = 380; cb1.y = 70; }
        const cb2 = newPlayers.find(p => p.id === 'cb2'); if (cb2) { cb2.x = 380; cb2.y = 330; }
        const fs = newPlayers.find(p => p.id === 'fs'); if (fs) { fs.x = 420; fs.y = 150; }
        const ss = newPlayers.find(p => p.id === 'ss'); if (ss) { ss.x = 420; ss.y = 250; }
      } else if (formation === 'dime') {
        // Dime: 4 DL, 1 LB, 6 DB (pass defense heavy)
        const de1 = newPlayers.find(p => p.id === 'de1'); if (de1) { de1.x = 300; de1.y = 160; }
        const dt1 = newPlayers.find(p => p.id === 'dt1'); if (dt1) { dt1.x = 300; dt1.y = 185; }
        const dt2 = newPlayers.find(p => p.id === 'dt2'); if (dt2) { dt2.x = 300; dt2.y = 215; }
        const de2 = newPlayers.find(p => p.id === 'de2'); if (de2) { de2.x = 300; de2.y = 240; }
        const mlb = newPlayers.find(p => p.id === 'mlb'); if (mlb) { mlb.x = 340; mlb.y = 200; }
        const olb1 = newPlayers.find(p => p.id === 'olb1'); if (olb1) { olb1.x = 370; olb1.y = 100; }  // Dime CB
        const olb2 = newPlayers.find(p => p.id === 'olb2'); if (olb2) { olb2.x = 370; olb2.y = 300; }  // Dime CB
        const cb1 = newPlayers.find(p => p.id === 'cb1'); if (cb1) { cb1.x = 390; cb1.y = 60; }
        const cb2 = newPlayers.find(p => p.id === 'cb2'); if (cb2) { cb2.x = 390; cb2.y = 340; }
        const fs = newPlayers.find(p => p.id === 'fs'); if (fs) { fs.x = 450; fs.y = 140; }
        const ss = newPlayers.find(p => p.id === 'ss'); if (ss) { ss.x = 450; ss.y = 260; }
      }
      
      return newPlayers
    })
  }

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    // Find clicked player
    const player = players.find(p => {
      const dx = x - p.x
      const dy = y - p.y
      return Math.sqrt(dx * dx + dy * dy) < 15
    })
    
    if (isSettingEndPoints && selectedPlayer) {
      // Set end point for selected player
      setPlayers(prevPlayers => 
        prevPlayers.map(p => 
          p.id === selectedPlayer.id 
            ? { 
                ...p, 
                endX: Math.max(15, Math.min(785, x)),
                endY: Math.max(15, Math.min(385, y)),
                startX: p.startX || p.x,
                startY: p.startY || p.y
              }
            : p
        )
      )
      setIsSettingEndPoints(false)
    } else if (player) {
      setIsDragging(true)
      setDraggedPlayer(player)
      setSelectedPlayer(player)
      setDragOffset({ x: x - player.x, y: y - player.y })
      if (canvas) canvas.style.cursor = 'grabbing'
    }
  }, [players, isSettingEndPoints, selectedPlayer])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && draggedPlayer) {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      
      const newX = Math.max(15, Math.min(785, x - dragOffset.x))
      const newY = Math.max(15, Math.min(385, y - dragOffset.y))
      
      setPlayers(prevPlayers => 
        prevPlayers.map(p => 
          p.id === draggedPlayer.id 
            ? { ...p, x: newX, y: newY }
            : p
        )
      )
      
      setSelectedPlayer(prev => prev ? { ...prev, x: newX, y: newY } : null)
    }
  }, [isDragging, draggedPlayer, dragOffset])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedPlayer(null)
    const canvas = canvasRef.current
    if (canvas) canvas.style.cursor = 'default'
  }, [])

  // Timeline animation
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineValue(prev => {
          const next = prev + 2
          return next > 100 ? 0 : next
        })
      }, 100)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying])

  // Update player positions based on timeline
  useEffect(() => {
    setPlayers(prevPlayers => 
      prevPlayers.map(player => {
        if (player.startX && player.startY && player.endX && player.endY) {
          // Interpolate between start and end positions based on timeline
          const progress = timelineValue / 100
          const newX = player.startX + (player.endX - player.startX) * progress
          const newY = player.startY + (player.endY - player.startY) * progress
          
          // Build route array for drawing
          const route = []
          for (let i = 0; i <= 10; i++) {
            const t = i / 10
            route.push({
              x: player.startX + (player.endX - player.startX) * t,
              y: player.startY + (player.endY - player.startY) * t
            })
          }
          
          return {
            ...player,
            x: Math.max(15, Math.min(785, newX)),
            y: Math.max(15, Math.min(385, newY)),
            route
          }
        }
        return player
      })
    )
  }, [timelineValue])

  useEffect(() => {
    render()
  }, [players])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Play Analyzer</h3>
        <div className="flex items-center space-x-3">
          <select
            value={offenseFormation}
            onChange={(e) => handleOffenseFormationChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-nfl-blue focus:border-transparent"
          >
            <option value="">Offense Formation...</option>
            <option value="i-formation">I-Formation</option>
            <option value="singleback">Singleback</option>
            <option value="shotgun">Shotgun</option>
            <option value="pistol">Pistol</option>
          </select>
          <select
            value={defenseFormation}
            onChange={(e) => handleDefenseFormationChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-nfl-blue focus:border-transparent"
          >
            <option value="">Defense Formation...</option>
            <option value="4-3-defense">4-3 Defense</option>
            <option value="3-4-defense">3-4 Defense</option>
            <option value="nickel">Nickel</option>
            <option value="dime">Dime</option>
          </select>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="border-2 border-gray-300 rounded-lg cursor-pointer shadow-md"
            style={{ width: '100%', height: 'auto', maxWidth: '800px', display: 'block' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
        
        <div className="lg:col-span-1 space-y-4">
          {/* Timeline Controls */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h4>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="100"
                value={timelineValue}
                onChange={(e) => setTimelineValue(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {Math.floor(timelineValue / 10)}:{(timelineValue % 10).toString().padStart(1, '0')}s
                </span>
                <div className="text-xs text-gray-600">
                  {timelineValue}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Player Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Player Info</h4>
            {selectedPlayer ? (
              <div className="text-sm space-y-2">
                <div className="font-medium">Player #{selectedPlayer.number}</div>
                <div className="text-gray-600">Team: {selectedPlayer.team}</div>
                <div className="text-gray-600">
                  Position: {selectedPlayer.x.toFixed(0)}, {selectedPlayer.y.toFixed(0)}
                </div>
                {selectedPlayer.endX && selectedPlayer.endY && (
                  <div className="text-gray-600">
                    End: {selectedPlayer.endX.toFixed(0)}, {selectedPlayer.endY.toFixed(0)}
                  </div>
                )}
                <div className={`text-xs px-2 py-1 rounded inline-block ${
                  selectedPlayer.team === 'offense' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedPlayer.team === 'offense' ? 'Offense' : 'Defense'}
                </div>
                <div className="pt-2 space-y-1">
                  <button
                    onClick={() => setIsSettingEndPoints(true)}
                    disabled={isSettingEndPoints}
                    className="w-full px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {isSettingEndPoints ? 'Click field to set end point' : 'Set Route End Point'}
                  </button>
                  {selectedPlayer.endX && selectedPlayer.endY && (
                    <button
                      onClick={() => {
                        setPlayers(prev => prev.map(p => 
                          p.id === selectedPlayer.id 
                            ? { ...p, endX: undefined, endY: undefined, startX: undefined, startY: undefined, route: undefined }
                            : p
                        ))
                      }}
                      className="w-full px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Clear Route
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Click a player to see details
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center justify-center space-x-8">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span>{offenseFormation ? offenseFormation.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Offense'}</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span>{defenseFormation ? defenseFormation.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Defense'}</span>
          </div>
        </div>
        <p className="text-center mt-3 text-xs font-medium">
          Select formations above, then click and drag players to customize positions
        </p>
        {(offenseFormation || defenseFormation) && (
          <div className="flex justify-center mt-2 space-x-4 text-xs">
            {offenseFormation && (
              <>
                <span className="text-blue-600">QB: #{players.find(p => p.id === 'qb')?.number}</span>
                <span className="text-blue-600">RB: #{players.find(p => p.id === 'rb')?.number}</span>
                {offenseFormation === 'i-formation' && <span className="text-blue-600">FB: #{players.find(p => p.id === 'fb')?.number}</span>}
                {offenseFormation !== 'i-formation' && <span className="text-blue-600">WR: #{players.find(p => p.id === 'wr1')?.number}, #{players.find(p => p.id === 'wr2')?.number}</span>}
                {offenseFormation === 'shotgun' && <span className="text-blue-600">Slot: #{players.find(p => p.id === 'te')?.number}</span>}
                {offenseFormation === 'singleback' && <span className="text-blue-600">Slot: #{players.find(p => p.id === 'te')?.number}</span>}
              </>
            )}
            {defenseFormation && (
              <>
                {defenseFormation === '4-3-defense' && <span className="text-red-600">4-3: DE #{players.find(p => p.id === 'de1')?.number}, #{players.find(p => p.id === 'de2')?.number}</span>}
                {defenseFormation === '3-4-defense' && <span className="text-red-600">3-4: NT #{players.find(p => p.id === 'dt1')?.number}</span>}
                {defenseFormation === 'nickel' && <span className="text-red-600">Nickel: 5 DB</span>}
                {defenseFormation === 'dime' && <span className="text-red-600">Dime: 6 DB</span>}
                <span className="text-red-600">LB: #{players.find(p => p.id === 'mlb')?.number}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FootballField

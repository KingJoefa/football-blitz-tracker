import './style.css'

// Simple football analyzer demo
document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector<HTMLDivElement>('#app')!;
  
  app.innerHTML = `
    <div class="football-analyzer">
      <header class="analyzer-header">
        <h1>Football Analyzer</h1>
        <div class="controls">
          <select id="formation-select">
            <option value="">Select Formation...</option>
            <option value="i-formation">I-Formation</option>
            <option value="shotgun">Shotgun</option>
            <option value="4-3-defense">4-3 Defense</option>
          </select>
          <button id="reset-btn">Reset</button>
        </div>
      </header>

      <main class="analyzer-main">
        <div class="field-container">
          <canvas id="field-canvas" width="800" height="400"></canvas>
          <div id="field-overlay"></div>
        </div>
        
        <aside class="controls-panel">
          <div class="section">
            <h3>Timeline</h3>
            <div class="timeline-controls">
              <button id="play-btn">▶</button>
              <input type="range" id="timeline" min="0" max="100" value="0">
              <span id="time-display">0:00</span>
            </div>
          </div>
          
          <div class="section">
            <h3>Player Info</h3>
            <div id="player-info">Click a player to see details</div>
          </div>
        </aside>
      </main>
    </div>
  `;

  // Simple field renderer
  const canvas = document.getElementById('field-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  
  function drawField() {
    // Clear canvas
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(0, 0, 800, 400);
    
    // Draw yard lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    
    // Sidelines
    ctx.strokeRect(0, 0, 800, 400);
    
    // 50-yard line
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 400);
    ctx.stroke();
    
    // Goal lines
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.lineTo(80, 400);
    ctx.moveTo(720, 0);
    ctx.lineTo(720, 400);
    ctx.stroke();
    
    // Yard markers every 10 yards
    for (let i = 1; i < 10; i++) {
      const x = 80 + (i * 64);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 400);
      ctx.stroke();
    }
  }

  // Simple player data
  let players = [
    // Offense (blue)
    { id: 'qb', x: 200, y: 200, team: 'offense', number: 12, active: true },
    { id: 'rb', x: 150, y: 200, team: 'offense', number: 21, active: true },
    { id: 'wr1', x: 250, y: 50, team: 'offense', number: 80, active: true },
    { id: 'wr2', x: 250, y: 350, team: 'offense', number: 83, active: true },
    
    // Defense (red)
    { id: 'de1', x: 320, y: 150, team: 'defense', number: 94, active: true },
    { id: 'de2', x: 320, y: 250, team: 'defense', number: 96, active: true },
    { id: 'lb1', x: 280, y: 180, team: 'defense', number: 54, active: true },
    { id: 'lb2', x: 280, y: 220, team: 'defense', number: 52, active: true }
  ];

  function drawPlayers() {
    players.forEach(player => {
      ctx.fillStyle = player.team === 'offense' ? '#3B82F6' : '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = player.active ? 3 : 2;
      
      // Draw player circle
      ctx.beginPath();
      ctx.arc(player.x, player.y, 15, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Draw number
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.number.toString(), player.x, player.y);
    });
  }

  function render() {
    drawField();
    drawPlayers();
  }

  // Initial render
  render();

  // Formation selector
  const formationSelect = document.getElementById('formation-select') as HTMLSelectElement;
  formationSelect.addEventListener('change', (e) => {
    const formation = (e.target as HTMLSelectElement).value;
    
    if (formation === 'i-formation') {
      players[0].x = 200; players[0].y = 200; // QB
      players[1].x = 150; players[1].y = 200; // RB
      players[2].x = 250; players[2].y = 50;  // WR1
      players[3].x = 250; players[3].y = 350; // WR2
    } else if (formation === 'shotgun') {
      players[0].x = 180; players[0].y = 200; // QB
      players[1].x = 120; players[1].y = 200; // RB
      players[2].x = 250; players[2].y = 30;  // WR1
      players[3].x = 250; players[3].y = 370; // WR2
    }
    
    render();
  });

  // Reset button
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    formationSelect.value = '';
    // Reset to default positions
    players = [
      { id: 'qb', x: 200, y: 200, team: 'offense', number: 12, active: true },
      { id: 'rb', x: 150, y: 200, team: 'offense', number: 21, active: true },
      { id: 'wr1', x: 250, y: 50, team: 'offense', number: 80, active: true },
      { id: 'wr2', x: 250, y: 350, team: 'offense', number: 83, active: true },
      { id: 'de1', x: 320, y: 150, team: 'defense', number: 94, active: true },
      { id: 'de2', x: 320, y: 250, team: 'defense', number: 96, active: true },
      { id: 'lb1', x: 280, y: 180, team: 'defense', number: 54, active: true },
      { id: 'lb2', x: 280, y: 220, team: 'defense', number: 52, active: true }
    ];
    render();
  });

  // Simple drag and drop
  let isDragging = false;
  let draggedPlayer: any = null;
  let dragOffset = { x: 0, y: 0 };

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find clicked player
    const player = players.find(p => {
      const dx = x - p.x;
      const dy = y - p.y;
      return Math.sqrt(dx * dx + dy * dy) < 15;
    });
    
    if (player) {
      isDragging = true;
      draggedPlayer = player;
      dragOffset.x = x - player.x;
      dragOffset.y = y - player.y;
      canvas.style.cursor = 'grabbing';
      
      // Show player info
      const infoEl = document.getElementById('player-info');
      if (infoEl) {
        infoEl.innerHTML = `
          <strong>Player #${player.number}</strong><br>
          Team: ${player.team}<br>
          Position: ${player.x.toFixed(0)}, ${player.y.toFixed(0)}
        `;
      }
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging && draggedPlayer) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      draggedPlayer.x = Math.max(15, Math.min(785, x - dragOffset.x));
      draggedPlayer.y = Math.max(15, Math.min(385, y - dragOffset.y));
      
      render();
      
      // Update player info
      const infoEl = document.getElementById('player-info');
      if (infoEl) {
        infoEl.innerHTML = `
          <strong>Player #${draggedPlayer.number}</strong><br>
          Team: ${draggedPlayer.team}<br>
          Position: ${draggedPlayer.x.toFixed(0)}, ${draggedPlayer.y.toFixed(0)}
        `;
      }
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
    draggedPlayer = null;
    canvas.style.cursor = 'default';
  });

  // Simple timeline
  let isPlaying = false;
  let timelineValue = 0;
  
  const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
  const timeline = document.getElementById('timeline') as HTMLInputElement;
  const timeDisplay = document.getElementById('time-display') as HTMLSpanElement;
  
  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    
    if (isPlaying) {
      const interval = setInterval(() => {
        if (!isPlaying) {
          clearInterval(interval);
          return;
        }
        
        timelineValue += 1;
        if (timelineValue > 100) {
          timelineValue = 0;
        }
        
        timeline.value = timelineValue.toString();
        const seconds = Math.floor(timelineValue / 10);
        timeDisplay.textContent = `0:${seconds.toString().padStart(2, '0')}`;
        
        // Simple animation - move players slightly
        players.forEach(player => {
          if (player.active) {
            player.x += (Math.random() - 0.5) * 2;
            player.y += (Math.random() - 0.5) * 2;
            player.x = Math.max(15, Math.min(785, player.x));
            player.y = Math.max(15, Math.min(385, player.y));
          }
        });
        
        render();
      }, 100);
    }
  });

  timeline.addEventListener('input', (e) => {
    timelineValue = parseInt((e.target as HTMLInputElement).value);
    const seconds = Math.floor(timelineValue / 10);
    timeDisplay.textContent = `0:${seconds.toString().padStart(2, '0')}`;
  });

  console.log('Football Analyzer Demo Ready!');
});
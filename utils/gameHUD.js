export class GameHUD {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'game-hud';
    this.container.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      font-family: 'Orbitron', sans-serif;
      color: #00ff88;
      z-index: 999;
    `;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes glow {
        0%, 100% { text-shadow: 0 0 10px #ff4444; }
        50% { text-shadow: 0 0 20px #ff4444, 0 0 30px #ff4444; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes pulseTimer {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.1); }
      }
    `;
    document.head.appendChild(style); // <-- IMPORTANTE: aggiungi al head!
    document.body.appendChild(this.container);
    this.createPanels();
  }

  createPanels() {
    this.createPanel('status', 'Score: 0', { top: '10px', left: '10px' });
    this.createPanel('timer', 'COLLAPSE: 60s', { top: '10px', left: '50%', transform: 'translateX(-50%)' });
    this.createPanel('objective', `
      <b>🎯 OBJECTIVE:</b><br><br>
      Rescue as many astronauts as you can before time runs out!<br>
      Each rescue grants +3 seconds<br><br>
      ⚠️ <b>WARNING:</b><br><br>
      Avoid asteroids and space storms !<br>
           
    `, { bottom: '10px', right: '10px', width: '260px', fontSize: '12px' });
    this.createEnergyBar();
  }

  createPanel(id, html, positionStyles) {
    const panel = document.createElement('div');
    panel.id = `hud-${id}`;
    panel.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.6);
      border: 2px solid #00ff88;
      border-radius: 10px;
      padding: 10px 14px;
      box-shadow: 0 0 12px #00ff88;
      color: #00ff88;
      font-size: 14px;
      text-shadow: 0 0 5px #00ff88;
      pointer-events: none;
    `;

    if (id === 'timer') {
      panel.style.width = '150px';
      panel.style.textAlign = 'center';
    }

    Object.assign(panel.style, positionStyles);
    panel.innerHTML = html;
    this.container.appendChild(panel);
  }

  createEnergyBar() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 10px;
      width: 220px;
      height: 30px;
      background: rgba(0,0,0,0.6);
      border: 2px solid #00ff88;
      border-radius: 10px;
      box-shadow: 0 0 8px #00ff88;
      display: flex;
      align-items: center;
      font-size: 12px;
      padding-left: 8px;
    `;

    const labelContainer = document.createElement('div');
    labelContainer.style.cssText = `
      display: flex;
      align-items: center;
      margin-right: 8px;
      min-width: 90px;
    `;

    this.energyLabel = document.createElement('span');
    this.energyLabel.textContent = '⚡ Energy Boost';
    this.energyLabel.style.cssText = `
      margin-right: 8px;
      color: #00ff88;
    `;

    labelContainer.appendChild(this.energyLabel);

    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
      flex: 1;
      height: 12px;
      background: rgba(255,255,255,0.2);
      border-radius: 6px;
      margin-right: 8px;
      overflow: hidden;
      position: relative;
    `;

    this.energyBar = document.createElement('div');
    this.energyBar.style.cssText = `
      height: 100%;
      width: 100%;
      background: linear-gradient(to right, #ffff00, #ff8800);
      border-radius: 6px;
      transition: width 0.1s ease-out;
      box-shadow: 0 0 4px rgba(255,255,0,0.5);
    `;

    this.energyPercentage = document.createElement('span');
    this.energyPercentage.style.cssText = `
      font-size: 10px;
      color: #00ff88;
      min-width: 30px;
      text-align: right;
    `;

    barContainer.appendChild(this.energyBar);
    wrapper.appendChild(labelContainer);
    barContainer.appendChild(this.energyPercentage);
    wrapper.appendChild(barContainer);

    this.container.appendChild(wrapper);
  } 

  updateEnergyBar(boostTimeRemaining, boostDuration, boostTimer, boostCooldown, isBoostActive, boostState) {
        if (!this.energyBar || !this.energyPercentage || !this.energyLabel) return;

        let percentage;
        
        if (isBoostActive) {
            // Durante il boost: mostra quanto boost rimane
            percentage = (boostTimeRemaining / boostDuration) * 100;
        } else {
            if (boostState === 'recharging') {
                // Siamo in ricarica: mostra progresso basato su boostTimeRemaining
                percentage = (boostTimeRemaining / boostDuration) * 100;
            } else if (boostState === 'cooldown') {
                // Compatibilità con il vecchio sistema (se ancora lo usi)
                percentage = ((boostCooldown - boostTimer) / boostCooldown) * 100;
            } else {
                // Boost è pronto (state === 'ready')
                percentage = (boostTimeRemaining / boostDuration) * 100;
            }
        }
        
        // Aggiorna la larghezza della barra
        this.energyBar.style.width = `${percentage}%`;
        
        // Aggiorna il testo della percentuale
        this.energyPercentage.textContent = `${Math.round(percentage)}%`;
        
        // Cambia colore e aspetto in base allo stato
        if (isBoostActive) {
            // Quando il boost è attivo
            this.energyBar.style.background = 'linear-gradient(to right, #ff4444, #ff8800)';
            this.energyBar.style.boxShadow = '0 0 6px rgba(255,68,68,0.8)';
            this.energyLabel.style.color = '#ff4444';
            this.energyLabel.textContent = '⚡ BOOST';
        } else {
            // Quando il boost non è attivo
            if (percentage < 100) {
                // In ricarica (sempre che non sia pieno)
                this.energyBar.style.background = 'linear-gradient(to right, #ffff00, #ff8800)';
                this.energyBar.style.boxShadow = '0 0 4px rgba(255,255,0,0.5)';
                this.energyLabel.style.color = '#ffaa00';
                this.energyLabel.textContent = '⚡ Charging...';
            } else {
                // Completamente carico
                this.energyBar.style.background = 'linear-gradient(to right, #00ff88, #44ff44)';
                this.energyBar.style.boxShadow = '0 0 6px rgba(0,255,136,0.8)';
                this.energyLabel.style.color = '#00ff88';
                this.energyLabel.textContent = '⚡ Energy Ready';
            }
        }
        
        // Effetto di pulsazione quando completamente carico
        if (percentage >= 100 && !isBoostActive) {
            this.energyBar.style.animation = 'pulse 2s infinite';
            // Aggiungi il CSS per l'animazione se non presente
            if (!document.querySelector('#energy-pulse-animation')) {
                const style = document.createElement('style');
                style.id = 'energy-pulse-animation';
                style.textContent = `
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.7; }
                        100% { opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
        } else {
            this.energyBar.style.animation = 'none';
        }
    }
      
  showScorePopup(worldPosition, camera, renderer) {
    // Converti la posizione 3D in coordinate dello schermo
    const vector = worldPosition.clone();
    vector.project(camera);
    
    const screenX = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const screenY = (vector.y * -0.5 + 0.5) * renderer.domElement.clientHeight;
    
    // Crea l'elemento del popup
    const popup = document.createElement('div');
    popup.textContent = '+1';
    popup.style.cssText = `
      position: fixed;
      left: ${screenX}px;
      top: ${screenY}px;
      font-family: 'Orbitron', sans-serif;
      color: #00ff88;
      font-size: 24px;
      font-weight: bold;
      pointer-events: none;
      z-index: 1000;
      transform: translate(-50%, -50%);
      text-shadow: 0 0 10px #00ff88;
    `;
    
    // Aggiungi al container
    this.container.appendChild(popup);
    
    // Animazione di fade out e movimento verso l'alto
    let opacity = 1;
    let yOffset = 0;
    const startTime = Date.now();
    const duration = 2000; // 2 secondi
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        opacity = 1 - progress;
        yOffset = progress * 50; // Si sposta verso l'alto
        
        popup.style.opacity = opacity;
        popup.style.transform = `translate(-50%, -50%) translateY(-${yOffset}px)`;
        
        requestAnimationFrame(animate);
      } else {
        // Rimuovi l'elemento
        this.container.removeChild(popup);
      }
    };
    
    animate();
  }

  showGameOver(finalScore, elapsedTime) {
    // Nasconde i pannelli del gioco
    const panels = ['hud-status', 'hud-timer', 'hud-objective'];
    panels.forEach(id => {
      const panel = document.getElementById(id);
      if (panel) panel.style.display = 'none';
    });

    // Nasconde la barra dell'energia
    const energyWrapper = this.container.querySelector('div[style*="bottom: 10px"][style*="left: 10px"]');
    if (energyWrapper) energyWrapper.style.display = 'none';

    // Crea l'overlay di game over
    const gameOverOverlay = document.createElement('div');
    gameOverOverlay.id = 'game-over-overlay';
    gameOverOverlay.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1001;
      animation: fadeIn 0.5s ease-in;
    `;

    // Crea il pannello centrale di game over
    const gameOverPanel = document.createElement('div');
    gameOverPanel.style.cssText = `
      background: rgba(0, 0, 0, 0.9);
      border: 3px solid #ff4444;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      color: #ff4444;
      font-family: 'Orbitron', sans-serif;
      box-shadow: 0 0 30px #ff4444;
      animation: pulse 2s infinite;
      max-width: 500px;
      min-width: 400px;
    `;

    // Converti il tempo in formato mm:ss
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    gameOverPanel.innerHTML = `
      <div style="font-size: 48px; font-weight: bold; margin-bottom: 20px; animation: glow 2s infinite;">
        GAME OVER
      </div>
      
      <div style="font-size: 16px; margin-bottom: 30px; color: #ffffff;">
        Mission Failed
      </div>
      
      <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <div style="font-size: 18px; margin-bottom: 15px; color: #00ff88;">
          📊 MISSION STATS
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #ffffff;">Astronauts Rescued:</span>
          <span style="color: #00ff88; font-weight: bold;">${finalScore}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #ffffff;">Time Survived:</span>
          <span style="color: #00ff88; font-weight: bold;">${timeFormatted}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #ffffff;">Final Score:</span>
          <span style="color: #00ff88; font-weight: bold; font-size: 20px;">${finalScore * 100}</span>
        </div>
      </div>
      
      <div style="font-size: 14px; color: #888888; margin-bottom: 20px;">
        The solar storm has consumed the space station.<br>
        Your heroic rescue mission will be remembered.
      </div>
      
      <div style="font-size: 12px; color: #666666;">
        Press F5 to restart mission
      </div>
    `;

    gameOverOverlay.appendChild(gameOverPanel);
    document.body.appendChild(gameOverOverlay);

    // Aggiungi event listener per riavviare con F5
    const handleRestart = (e) => {
      if (e.key === 'F5' || e.keyCode === 116) {
        location.reload();
      }
    };
    
    document.addEventListener('keydown', handleRestart);
    
    // Salva il riferimento per una eventuale pulizia
    this.gameOverOverlay = gameOverOverlay;
    this.restartHandler = handleRestart;
  }

  showTimeBonus() {
    const bonus = document.createElement('div');
    bonus.textContent = '+3 seconds';
    bonus.style.cssText = `
      position: absolute;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 18px;
      font-weight: bold;
      color: #00ff88;
      text-shadow: 0 0 8px #00ff88;
      pointer-events: none;
      opacity: 1;
      transition: opacity 1s ease, top 1s ease;
      z-index: 1000;
    `;

    this.container.appendChild(bonus);

    // Trigger animazione
    setTimeout(() => {
      bonus.style.opacity = '0';
      bonus.style.top = '20px';
    }, 50); // slight delay to ensure transition works

    // Rimuovi dopo l'animazione
    setTimeout(() => {
      this.container.removeChild(bonus);
    }, 1050);
  }

  // --- Update Methods ---
  updateStatus(score) {
    const panel = document.getElementById('hud-status');
    panel.innerHTML = `Score: ${score}`;
  }

  updateTimer(seconds) {
    const panel = document.getElementById('hud-timer');

    const isDanger = seconds <= 10;
    const color = isDanger ? '#ff4444' : '#00ff88';

    panel.innerHTML = `COLLAPSE: ${seconds}s`;
    panel.style.color = color;
    panel.style.textShadow = `0 0 5px ${color}`;
    panel.style.borderColor = color;
    panel.style.boxShadow = `0 0 12px ${color}`;

    if (isDanger) {
      panel.style.animation = 'pulseTimer 1s infinite';
    } else {
      panel.style.animation = 'none';
    }
  }

  updateEnergy(percent) {
    this.energyBar.style.width = `${percent}%`;
  }
}
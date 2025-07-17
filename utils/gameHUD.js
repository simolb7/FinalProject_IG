
function restartGame() {
    console.log('Riavvio del gioco...');
    sessionStorage.setItem('gameRestart', 'true');
    location.reload();
}


export class GameHUD {
  constructor(restartCallback) {
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

    this.createAdvancedStyles();
    document.body.appendChild(this.container);
    this.createPanels();
    this.hide();
    this.restartCallback = restartCallback;
  }

  createAdvancedStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes glow {
        0%, 100% { 
          text-shadow: 0 0 10px #ff4444, 0 0 20px #ff4444; 
          box-shadow: 0 0 20px #ff4444, inset 0 0 20px rgba(255,68,68,0.1);
        }
        50% { 
          text-shadow: 0 0 20px #ff4444, 0 0 30px #ff4444, 0 0 40px #ff4444; 
          box-shadow: 0 0 30px #ff4444, inset 0 0 30px rgba(255,68,68,0.2);
        }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }
      
      @keyframes pulseTimer {
        0%, 100% { 
          transform: translateX(-50%) scale(1); 
          filter: brightness(1);
        }
        50% { 
          transform: translateX(-50%) scale(1.05); 
          filter: brightness(1.3);
        }
      }
      
      @keyframes dangerPulse {
        0%, 100% { 
          transform: translateX(-50%) scale(1); 
          filter: brightness(1);
          box-shadow: 0 0 20px rgba(255,68,68,0.3), inset 0 0 20px rgba(255,68,68,0.05);
        }
        50% { 
          transform: translateX(-50%) scale(1.08); 
          filter: brightness(1.5);
          box-shadow: 0 0 40px rgba(255,68,68,0.8), inset 0 0 30px rgba(255,68,68,0.2);
        }
      }
      
      @keyframes energyPulse {
        0%, 100% { 
          opacity: 1; 
          box-shadow: 0 0 6px rgba(0,255,136,0.8), 0 0 12px rgba(0,255,136,0.4); 
        }
        50% { 
          opacity: 0.8; 
          box-shadow: 0 0 12px rgba(0,255,136,1), 0 0 24px rgba(0,255,136,0.6); 
        }
      }
      
      @keyframes scanline {
        0% { transform: translateX(-100%); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(100%); opacity: 0; }
      }
      
      @keyframes dataStream {
        0% { transform: translateY(-100%); opacity: 0; }
        50% { opacity: 0.3; }
        100% { transform: translateY(100%); opacity: 0; }
      }
      
      @keyframes timerBarDanger {
        0%, 100% { 
          background: linear-gradient(90deg, #ff4444 0%, #ff8888 50%, #ff4444 100%);
          box-shadow: 0 0 15px rgba(255,68,68,0.8), inset 0 0 15px rgba(255,255,255,0.3);
        }
        50% { 
          background: linear-gradient(90deg, #ff6666 0%, #ffaaaa 50%, #ff6666 100%);
          box-shadow: 0 0 25px rgba(255,68,68,1), inset 0 0 25px rgba(255,255,255,0.5);
        }
      }
      
      .hud-panel {
        position: relative;
        background: linear-gradient(135deg, rgba(0,20,40,0.95) 0%, rgba(0,10,20,0.95) 100%);
        border: 1px solid rgba(0,255,136,0.6);
        border-radius: 10px;
        padding: 16px 20px;
        backdrop-filter: blur(10px);
        box-shadow: 
          0 0 20px rgba(0,255,136,0.3),
          inset 0 0 20px rgba(0,255,136,0.05),
          0 4px 15px rgba(0,0,0,0.3);
        color: #00ff88;
        font-size: 16px;
        text-shadow: 0 0 8px rgba(0,255,136,0.8);
        pointer-events: none;
        overflow: hidden;
        animation: fadeIn 0.8s ease-out;
      }
      
      .hud-panel::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #00ff88, transparent);
        animation: scanline 3s infinite;
      }
      
      .hud-panel::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(0deg, transparent 0%, rgba(0,255,136,0.02) 50%, transparent 100%);
        animation: dataStream 4s infinite;
      }
      
      .energy-wrapper {
        position: absolute;
        bottom: 20px;
        left: 20px;
        width: 320px;
        height: 60px;
        background: linear-gradient(135deg, rgba(0,30,60,0.95) 0%, rgba(0,15,30,0.95) 100%);
        border: 1px solid rgba(0,255,136,0.6);
        border-radius: 15px;
        backdrop-filter: blur(15px);
        box-shadow: 
          0 0 25px rgba(0,255,136,0.4),
          inset 0 0 25px rgba(0,255,136,0.1),
          0 6px 20px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        font-size: 14px;
        padding: 0 20px;
        animation: fadeIn 1s ease-out;
        overflow: hidden;
      }
      
      .energy-wrapper::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(0,255,136,0.8), transparent);
        animation: scanline 2s infinite;
      }
      
      .timer-panel {
        background: linear-gradient(135deg, rgba(20,20,40,0.95) 0%, rgba(10,10,20,0.95) 100%) !important;
        border: 1px solid rgba(100,150,255,0.6) !important;
        box-shadow: 
          0 0 20px rgba(100,150,255,0.3),
          inset 0 0 20px rgba(100,150,255,0.05),
          0 4px 15px rgba(0,0,0,0.3) !important;
        width: 320px !important;
        transition: all 0.3s ease;
      }
      
      .timer-panel.danger {
        background: linear-gradient(135deg, rgba(40,0,20,0.95) 0%, rgba(20,0,10,0.95) 100%) !important;
        border: 1px solid rgba(255,68,68,0.8) !important;
        box-shadow: 
          0 0 30px rgba(255,68,68,0.6),
          inset 0 0 30px rgba(255,68,68,0.1),
          0 4px 20px rgba(0,0,0,0.4) !important;
        animation: dangerPulse 1s infinite !important;
      }
      
      .timer-bar-container {
        width: 100%;
        height: 8px;
        background: rgba(0,0,0,0.5);
        border-radius: 4px;
        overflow: hidden;
        margin-top: 10px;
        border: 1px solid rgba(255,255,255,0.2);
      }
      
      .timer-bar {
        height: 100%;
        background: linear-gradient(90deg, #6596ff 0%, #99bbff 50%, #6596ff 100%);
        border-radius: 4px;
        transition: width 0.3s ease-out, background 0.3s ease, box-shadow 0.3s ease;
        box-shadow: 0 0 10px rgba(101,150,255,0.6);
      }
      
      .timer-bar.danger {
        animation: timerBarDanger 0.8s infinite;
      }
      
      .objective-panel {
        background: linear-gradient(135deg, rgba(20,20,40,0.95) 0%, rgba(10,10,20,0.95) 100%) !important;
        border: 1px solid rgba(100,150,255,0.6) !important;
        box-shadow: 
          0 0 20px rgba(100,150,255,0.3),
          inset 0 0 20px rgba(100,150,255,0.05),
          0 4px 15px rgba(0,0,0,0.3) !important;
      }
      
      .game-over-panel {
        background: linear-gradient(135deg, rgba(40,0,0,0.95) 0%, rgba(20,0,0,0.95) 100%);
        border: 2px solid #ff4444;
        border-radius: 15px;
        padding: 30px;
        text-align: center;
        color: #ff4444;
        font-family: 'Orbitron', sans-serif;
        box-shadow: 
          0 0 30px rgba(255,68,68,0.6),
          inset 0 0 30px rgba(255,68,68,0.1);
        animation: pulse 2s infinite;
        max-width: 90vw;
        max-height: 90vh;
        width: 480px;
        backdrop-filter: blur(20px);
        overflow-y: auto;
      }
    `;
    document.head.appendChild(style);
  }

  createPanels() {
    this.createStatusPanel();
    this.createTimerPanel();
    this.createObjectivePanel();
    this.createAdvancedEnergyBar();
  }

  createStatusPanel() {
    const panel = document.createElement('div');
    panel.id = 'hud-status';
    panel.className = 'hud-panel';
    panel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      min-width: 160px;
      font-weight: bold;
      font-size: 18px;
    `;
    panel.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="color: #00ff88; font-size: 22px;">🎯</span>
        <span>RESCUED: <span id="score-value" style="color: #ffffff; font-size: 24px;">0</span></span>
      </div>
    `;
    this.container.appendChild(panel);
  }

  createTimerPanel() {
    const panel = document.createElement('div');
    panel.id = 'hud-timer';
    panel.className = 'hud-panel timer-panel';
    panel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      font-weight: bold;
      font-size: 18px;
    `;
    panel.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
        <span id="timer-icon" style="color: #6596ff; font-size: 22px;">⏱️</span>
        <span>COLLAPSE: <span id="timer-value" style="color: #ffffff; font-size: 24px;">60s</span></span>
      </div>
    `;
    this.container.appendChild(panel);
  }

  createObjectivePanel() {
    const panel = document.createElement('div');
    panel.id = 'hud-objective';
    panel.className = 'hud-panel objective-panel';
    panel.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 340px;
      font-size: 14px;
      line-height: 1.5;
    `;
    panel.innerHTML = `
      <div style="border-bottom: 1px solid rgba(100,150,255,0.3); padding-bottom: 10px; margin-bottom: 15px;">
        <div style="font-size: 16px; font-weight: bold; color: #6596ff; display: flex; align-items: center; gap: 10px;">
          <span>🎯</span> MISSION OBJECTIVE
        </div>
      </div>
      
      <div style="margin-bottom: 12px;">
        <div style="color: #ffffff; font-weight: bold; font-size: 15px;">Primary Goal:</div>
        <div style="color: #cccccc; margin-left: 10px;">Rescue as many astronauts as you can before time runs out!</div>
      </div>
      
      <div style="margin-bottom: 12px;">
        <div style="color: #00ff88; font-weight: bold; font-size: 15px;">Reward:</div>
        <div style="color: #cccccc; margin-left: 10px;">+3 seconds per rescue</div>
      </div>
      
      <div style="border-top: 1px solid rgba(255,100,100,0.3); padding-top: 10px; margin-top: 15px;">
        <div style="color: #ff6666; font-weight: bold; display: flex; align-items: center; gap: 8px; font-size: 15px;">
          <span>⚠️</span> HAZARDS
        </div>
        <div style="color: #cccccc; margin-left: 10px; font-size: 13px;">
          Avoid asteroids and space storms
        </div>
      </div>
    `;
    this.container.appendChild(panel);
  }

  createAdvancedEnergyBar() {
    const wrapper = document.createElement('div');
    wrapper.className = 'energy-wrapper';

    const headerSection = document.createElement('div');
    headerSection.style.cssText = `
      display: flex;
      align-items: center;
      margin-right: 15px;
      min-width: 120px;
    `;

    this.energyLabel = document.createElement('span');
    this.energyLabel.textContent = '⚡ Energy Ready';
    this.energyLabel.style.cssText = `
      color: #00ff88;
      font-weight: bold;
      font-size: 13px;
      text-shadow: 0 0 8px rgba(0,255,136,0.8);
    `;

    headerSection.appendChild(this.energyLabel);

    const barSection = document.createElement('div');
    barSection.style.cssText = `
      flex: 1;
      height: 24px;
      position: relative;
      margin-right: 12px;
    `;

    const barBackground = document.createElement('div');
    barBackground.style.cssText = `
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.4);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.2);
      overflow: hidden;
      position: relative;
    `;

    this.energyBar = document.createElement('div');
    this.energyBar.style.cssText = `
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #00ff88 0%, #44ff44 100%);
      border-radius: 12px;
      transition: width 0.3s ease-out, background 0.3s ease;
      box-shadow: 
        0 0 12px rgba(0,255,136,0.8),
        inset 0 0 12px rgba(255,255,255,0.2);
      position: relative;
    `;

    // Aggiungi effetto shimmer alla barra
    const shimmer = document.createElement('div');
    shimmer.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: scanline 2s infinite;
    `;
    this.energyBar.appendChild(shimmer);

    const percentageSection = document.createElement('div');
    percentageSection.style.cssText = `
      display: flex;
      align-items: center;
      min-width: 45px;
    `;

    this.energyPercentage = document.createElement('span');
    this.energyPercentage.style.cssText = `
      font-size: 13px;
      color: #00ff88;
      font-weight: bold;
      text-align: right;
      text-shadow: 0 0 6px rgba(0,255,136,0.8);
    `;

    barBackground.appendChild(this.energyBar);
    barSection.appendChild(barBackground);
    percentageSection.appendChild(this.energyPercentage);

    wrapper.appendChild(headerSection);
    wrapper.appendChild(barSection);
    wrapper.appendChild(percentageSection);

    this.container.appendChild(wrapper);
  }

  updateEnergyBar(boostTimeUsed, boostDuration, boostTimer, boostCooldown, isBoostActive, boostState) {
    if (!this.energyBar || !this.energyPercentage || !this.energyLabel) return;

    let percentage;
    
    if (isBoostActive) {
      // Durante il boost, mostra quanto tempo rimane
      percentage = ((boostDuration - boostTimeUsed) / boostDuration) * 100;
    } else {
      if (boostState === 'recharging') {
        // Durante la ricarica, mostra quanto è stato ricaricato
        percentage = ((boostDuration - boostTimeUsed) / boostDuration) * 100;
      } else if (boostState === 'ready') {
        // Quando è pronto, è al 100%
        percentage = 100;
      } else {
        // Fallback
        percentage = ((boostDuration - boostTimeUsed) / boostDuration) * 100;
      }
    }

    percentage = Math.round(((boostDuration - boostTimeUsed) / boostDuration) * 100);
    
    this.energyBar.style.width = `${percentage}%`;
    this.energyPercentage.textContent = `${Math.round(percentage)}%`;
    // Rimuovi sempre l'animazione prima di applicare nuovi stili
    this.energyBar.style.animation = 'none';
    
    if (isBoostActive) {
      this.energyBar.style.background = 'linear-gradient(90deg, #ff4444 0%, #ff8800 100%)';
      this.energyBar.style.boxShadow = '0 0 15px rgba(255,68,68,1), inset 0 0 15px rgba(255,255,255,0.3)';
      this.energyLabel.style.color = '#ff4444';
      this.energyLabel.textContent = '⚡ BOOST ACTIVE';
      this.energyPercentage.style.color = '#ff4444';
    } else {
      if (percentage < 100) {
        this.energyBar.style.background = 'linear-gradient(90deg, #ffaa00 0%, #ff8800 100%)';
        this.energyBar.style.boxShadow = '0 0 12px rgba(255,170,0,0.8), inset 0 0 12px rgba(255,255,255,0.2)';
        this.energyLabel.style.color = '#ffaa00';
        this.energyLabel.textContent = '⚡ Charging...';
        this.energyPercentage.style.color = '#ffaa00';
      } else {
        this.energyBar.style.background = 'linear-gradient(90deg, #00ff88 0%, #44ff44 100%)';
        this.energyBar.style.boxShadow = '0 0 15px rgba(0,255,136,1), inset 0 0 15px rgba(255,255,255,0.3)';
        this.energyLabel.style.color = '#00ff88';
        this.energyLabel.textContent = '⚡ Energy Ready';
        this.energyPercentage.style.color = '#00ff88';
        
        // Applica l'animazione DOPO aver impostato i colori
        // Usa un piccolo delay per assicurarti che i colori siano applicati
        setTimeout(() => {
          this.energyBar.style.animation = 'energyPulse 2s infinite';
        }, 10);
      }
    }
  }

  showScorePopup(worldPosition, camera, renderer) {
    const vector = worldPosition.clone();
    vector.project(camera);
    
    const screenX = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const screenY = (vector.y * -0.5 + 0.5) * renderer.domElement.clientHeight;
    
    const popup = document.createElement('div');
    popup.textContent = '+1';
    popup.style.cssText = `
      position: fixed;
      left: ${screenX}px;
      top: ${screenY}px;
      font-family: 'Orbitron', sans-serif;
      color: #00ff88;
      font-size: 28px;
      font-weight: bold;
      pointer-events: none;
      z-index: 1000;
      transform: translate(-50%, -50%);
      text-shadow: 0 0 15px #00ff88, 0 0 30px #00ff88;
    `;
    
    this.container.appendChild(popup);
    
    let opacity = 1;
    let yOffset = 0;
    const startTime = Date.now();
    const duration = 2000;
    
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
        this.container.removeChild(popup);
      }
    };
    
    animate();
  }

  showTimeBonus() {
    const bonus = document.createElement('div');
    bonus.textContent = '+3 SECONDS';
    bonus.style.cssText = `
      position: absolute;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 24px;
      font-weight: bold;
      color: #00ff88;
      text-shadow: 0 0 15px #00ff88, 0 0 30px #00ff88;
      pointer-events: none;
      opacity: 1;
      transition: opacity 1.5s ease, top 1.5s ease, transform 1.5s ease;
      z-index: 1000;
      background: rgba(0,0,0,0.8);
      padding: 10px 20px;
      border-radius: 10px;
      border: 1px solid rgba(0,255,136,0.6);
      backdrop-filter: blur(10px);
    `;

    this.container.appendChild(bonus);

    setTimeout(() => {
      bonus.style.opacity = '0';
      bonus.style.top = '40px';
      bonus.style.transform = 'translateX(-50%) scale(1.2)';
    }, 100);

    setTimeout(() => {
      this.container.removeChild(bonus);
    }, 1600);
  }

  

  showGameOver(finalScore, elapsedTime) {
    const panels = ['hud-status', 'hud-timer', 'hud-objective'];
    panels.forEach(id => {
      const panel = document.getElementById(id);
      if (panel) panel.style.display = 'none';
    });

    const energyWrapper = this.container.querySelector('.energy-wrapper');
    if (energyWrapper) energyWrapper.style.display = 'none';

    const gameOverOverlay = document.createElement('div');
    gameOverOverlay.id = 'game-over-overlay';
    gameOverOverlay.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: radial-gradient(circle at center, rgba(20,0,0,0.9) 0%, rgba(0,0,0,0.95) 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1001;
      animation: fadeIn 0.8s ease-in;
      backdrop-filter: blur(5px);
      padding: 20px;
      box-sizing: border-box;
    `;

    const gameOverPanel = document.createElement('div');
    gameOverPanel.className = 'game-over-panel';
    gameOverPanel.style.cssText = `
      background: linear-gradient(135deg, rgba(40,0,0,0.95) 0%, rgba(20,0,0,0.95) 100%);
      border: 2px solid #ff4444;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      color: #ff4444;
      font-family: 'Orbitron', sans-serif;
      box-shadow: 
        0 0 40px rgba(255,68,68,0.8),
        inset 0 0 40px rgba(255,68,68,0.15);
      animation: pulse 2s infinite;
      max-width: 95vw;
      max-height: 95vh;
      width: 100%;
      max-width: 700px;
      min-height: 500px;
      backdrop-filter: blur(25px);
      overflow-y: auto;
      box-sizing: border-box;
    `;

    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    gameOverPanel.innerHTML = `
      <div style="font-size: 48px; font-weight: bold; margin-bottom: 25px; animation: glow 2s infinite; text-shadow: 0 0 30px #ff4444; border-radius: 15px; ">
        MISSION FAILED
      </div>
      
      <div style="font-size: 18px; margin-bottom: 35px; color: #ffffff; opacity: 0.8;">
        The solar storm has consumed the station
      </div>
      
      <div style="background: rgba(0,0,0,0.4); padding: 25px; border-radius: 15px; margin-bottom: 35px; border: 1px solid rgba(255,255,255,0.15);">
        <div style="font-size: 24px; margin-bottom: 25px; color: #00ff88; font-weight: bold;">
          📊 FINAL MISSION REPORT
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
          <div style="text-align: left;">
            <div style="color: #cccccc; font-size: 16px; margin-bottom: 8px;">Astronauts Rescued</div>
            <div style="color: #00ff88; font-weight: bold; font-size: 36px;">${finalScore}</div>
          </div>
          <div style="text-align: right;">
            <div style="color: #cccccc; font-size: 16px; margin-bottom: 8px;">Time Survived</div>
            <div style="color: #6596ff; font-weight: bold; font-size: 36px;">${timeFormatted}</div>
          </div>
        </div>
        
        <div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 25px;">
          <div style="color: #cccccc; font-size: 16px; margin-bottom: 8px;">Final Score</div>
          <div style="color: #ffffff; font-weight: bold; font-size: 42px; text-shadow: 0 0 20px #ffffff;">${finalScore * 100}</div>
        </div>
      </div>
      
      <div style="font-size: 16px; color: #999999; margin-bottom: 35px; line-height: 1.6;">
        Your heroic rescue mission will be remembered.<br>
        Every life saved was a victory against the void.
      </div>
      
      <div style="font-size: 15px; color: #666666; background: rgba(0,0,0,0.6); padding: 15px; border-radius: 10px;">
        Press <span style="color: #00ff88; font-weight: bold;">SPACE</span> to restart mission
      </div>
    `;

    gameOverOverlay.appendChild(gameOverPanel);
    document.body.appendChild(gameOverOverlay);

    const handleRestart = (e) => {
        if (e.code === 'Space') { // Usa 'Space' per la barra spaziatrice
            e.preventDefault(); // Previene lo scroll della pagina
            restartGame(); 
        }
    };
        document.addEventListener('keydown', handleRestart);
    
    this.gameOverOverlay = gameOverOverlay;
    this.restartHandler = handleRestart;
  }



  hideGameOver() {
    if (this.gameOverOverlay) {
        document.body.removeChild(this.gameOverOverlay);
        this.gameOverOverlay = null;
    }
    
    if (this.restartHandler) {
        document.removeEventListener('keydown', this.restartHandler);
        this.restartHandler = null;
    }
  }

  updateStatus(score) {
    const scoreValue = document.getElementById('score-value');
    if (scoreValue) {
      scoreValue.textContent = score;
    }
  }

  updateTimer(seconds) {
    const timerValue = document.getElementById('timer-value');
    const panel = document.getElementById('hud-timer');
    
    if (timerValue && panel) {
      timerValue.textContent = `${seconds}s`;
      
      const isDanger = seconds <= 10;
      
      if (isDanger) {
        panel.style.animation = 'pulseTimer 1s infinite';
        timerValue.style.color = '#ff4444';
      } else {
        panel.style.animation = 'none';
        timerValue.style.color = '#ffffff';
      }
    }
  }

  updateEnergy(percent) {
    if (this.energyBar) {
      this.energyBar.style.width = `${percent}%`;
    }
  }

  show() {
      // Mostra tutti gli elementi HUD che sono nascosti all'inizio
      if (this.hudElement) {
          this.hudElement.style.display = 'block';
          this.hudElement.style.opacity = '1';
      }
      
      // Se hai altri elementi HUD, mostrali qui
      // Esempio:
      // this.timerElement.style.display = 'block';
      // this.scoreElement.style.display = 'block';
      // this.energyElement.style.display = 'block';
  }

  // Opzionale: aggiungi anche un metodo hide() se vuoi nascondere l'HUD
  hide() {
      if (this.hudElement) {
          this.hudElement.style.display = 'none';
          this.hudElement.style.opacity = '0';
      }
  }
}
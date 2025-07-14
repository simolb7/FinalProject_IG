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

    document.body.appendChild(this.container);
    this.createPanels();
  }

  createPanels() {
    this.createPanel('status', 'Score: 0', { top: '10px', left: '10px' });
    this.createPanel('timer', 'COLLAPSE: 60s', { top: '10px', left: '50%', transform: 'translateX(-50%)' });
    this.createPanel('objective', `
      <b>🎯 OBJECTIVE:</b><br>
      Rescue all the astronauts<br><br>
      ⚠️ <b>WARNING:</b><br>
      Avoid space debris and space storms !<br>
      Each rescue grants +5 seconds       
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

    wrapper.innerHTML = `<span style="margin-right: 8px;">⚡ Energy Boost</span>`;

    this.energyBar = document.createElement('div');
    this.energyBar.style.cssText = `
      height: 10px;
      flex: 1;
      background: linear-gradient(to right, yellow, orange);
      border-radius: 4px;
      margin-right: 8px;
    `;

    wrapper.appendChild(this.energyBar);
    this.container.appendChild(wrapper);
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


  // --- Update Methods ---
  updateStatus(score) {
    const panel = document.getElementById('hud-status');
    panel.innerHTML = `Score: ${score}`;
  }

  updateTimer(seconds) {
    const panel = document.getElementById('hud-timer');
    panel.innerHTML = `COLLAPSE: ${seconds}s`;
  }

  updateEnergy(percent) {
    this.energyBar.style.width = `${percent}%`;
  }
}

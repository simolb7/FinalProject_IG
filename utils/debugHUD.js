export class DebugHUD {
  constructor() {
    this.debugDiv = this.createDebugElement();
    this.enabled = true;
  }

  createDebugElement() {
    const debugDiv = document.createElement('div');
    debugDiv.id = 'debug';
    debugDiv.style.cssText = `
      position: fixed; 
      top: 10px; 
      left: 10px; 
      color: white; 
      font-family: 'Courier New', monospace; 
      font-size: 12px;
      z-index: 1000; 
      background: rgba(0,0,0,0.8);
      padding: 15px; 
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      min-width: 300px;
      line-height: 1.4;
    `;
    document.body.appendChild(debugDiv);

    // Aggiungi coreDiv per il contenuto aggiornabile
    this.coreDiv = document.createElement('div');
    debugDiv.appendChild(this.coreDiv);

    return debugDiv;
  }

  update(ship, camera, shipSpeed, delta, keys) {
    if (!this.enabled || !ship) return;

    const activeKeys = Object.keys(keys).filter(k => keys[k]).join(', ') || 'nessuno';

    this.coreDiv.innerHTML = `
      <div style="color: #00ff00; font-weight: bold; margin-bottom: 8px;">🚀 DEBUG INFO</div>
      <div style="color: #ffff00;">NAVICELLA:</div>
      <div>  Posizione: ${ship.position.x.toFixed(2)}, ${ship.position.y.toFixed(2)}, ${ship.position.z.toFixed(2)}</div>
      <div>  Rotazione Y: ${(ship.rotation.y * 180 / Math.PI).toFixed(1)}°</div>
      <div>  Velocità: ${shipSpeed.toFixed(3)}</div>
      <br>
      <div style="color: #ffff00;">CAMERA:</div>
      <div>  Posizione: ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}</div>
      <br>
      <div style="color: #ffff00;">SISTEMA:</div>
      <div>  Delta: ${delta.toFixed(3)}ms</div>
      <div>  FPS: ${(1/delta).toFixed(0)}</div>
      <div>  Tasti: ${activeKeys}</div>
      <br>
      <div style="color: #888888; font-size: 10px;">
        CONTROLLI: WASD/Frecce - Movimento | H - Toggle HUD
      </div>
    `;
  }

  createTimerSection() {
    const timerDiv = document.createElement('div');
    timerDiv.id = 'debug-timer';
    timerDiv.style.cssText = `
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.2);
      color: #00ffff;
      font-weight: bold;
      font-size: 14px;
    `;
    this.debugDiv.appendChild(timerDiv);
    this.timerDiv = timerDiv;
  }

  setTimer(secondsRemaining) {
    if (!this.timerDiv) this.createTimerSection();
    this.timerDiv.textContent = `⏱ Tempo rimasto: ${secondsRemaining}s`;
  }

  toggle() {
    this.enabled = !this.enabled;
    this.debugDiv.style.display = this.enabled ? 'block' : 'none';
  }

  show() {
    this.enabled = true;
    this.debugDiv.style.display = 'block';
  }

  hide() {
    this.enabled = false;
    this.debugDiv.style.display = 'none';
  }

  addCustomInfo(key, value) {
    const customDiv = document.getElementById('debug-custom') || this.createCustomSection();
    const existingInfo = customDiv.querySelector(`[data-key="${key}"]`);

    if (existingInfo) {
      existingInfo.textContent = `${key}: ${value}`;
    } else {
      const newInfo = document.createElement('div');
      newInfo.setAttribute('data-key', key);
      newInfo.textContent = `${key}: ${value}`;
      customDiv.appendChild(newInfo);
    }
  }

  createCustomSection() {
    const customDiv = document.createElement('div');
    customDiv.id = 'debug-custom';
    customDiv.innerHTML = '<div style="color: #ffff00; margin-top: 8px;">CUSTOM:</div>';
    this.coreDiv.appendChild(customDiv);
    return customDiv;
  }

  destroy() {
    if (this.debugDiv && this.debugDiv.parentNode) {
      this.debugDiv.parentNode.removeChild(this.debugDiv);
    }
  }
}

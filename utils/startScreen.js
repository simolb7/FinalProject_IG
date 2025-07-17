// StartScreen.js
export class StartScreen {
    constructor() {
        this.overlay = null;
        this.isActive = false;
        this.onStartCallback = null;
        this.keyListener = null;
        this.createAdvancedStyles();
        this.createOverlay();
    }

    createAdvancedStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes titleGlow {
                0%, 100% { 
                    text-shadow: 0 0 20px #00ff88, 0 0 40px #00ff88, 0 0 60px #00ff88;
                    transform: scale(1);
                }
                50% { 
                    text-shadow: 0 0 30px #00ff88, 0 0 60px #00ff88, 0 0 90px #00ff88;
                    transform: scale(1.02);
                }
            }
            
            @keyframes subtitlePulse {
                0%, 100% { 
                    opacity: 0.7; 
                    transform: translateY(0px);
                }
                50% { 
                    opacity: 1; 
                    transform: translateY(-1px);
                }
            }
            
            @keyframes startPulse {
                0%, 100% { 
                    opacity: 1; 
                    transform: scale(1);
                    text-shadow: 0 0 20px rgba(255,255,255,0.8);
                }
                50% { 
                    opacity: 0.8; 
                    transform: scale(1.05);
                    text-shadow: 0 0 30px rgba(255,255,255,1);
                }
            }
            
            @keyframes floatAnimation {
                0%, 100% { 
                    transform: translateY(0px) rotate(0deg);
                }
                50% { 
                    transform: translateY(-10px) rotate(5deg);
                }
            }
            
            @keyframes orbitalRotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes energyPulse {
                0%, 100% { 
                    background: linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(0,200,100,0.05) 100%);
                    border-color: rgba(0,255,136,0.3);
                }
                50% { 
                    background: linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,200,100,0.1) 100%);
                    border-color: rgba(0,255,136,0.6);
                }
            }
            
            @keyframes warningBlink {
                0%, 60% { opacity: 1; }
                70%, 80% { opacity: 0.3; }
                90%, 100% { opacity: 1; }
            }
            
            .main-container {
                position: relative;
                max-width: 500px;
                width: 90%;
                background: linear-gradient(135deg, 
                    rgba(0,30,60,0.1) 0%, 
                    rgba(0,20,40,0.2) 30%, 
                    rgba(0,10,20,0.3) 70%, 
                    rgba(0,5,10,0.4) 100%
                );
                border: 1px solid rgba(0,255,136,0.3);
                border-radius: 20px;
                padding: 25px;
                backdrop-filter: blur(15px);
                box-shadow: 
                    0 0 50px rgba(0,255,136,0.2),
                    inset 0 0 50px rgba(0,255,136,0.03);
                animation: energyPulse 4s infinite;
                overflow: hidden;
            }
            
            .logo-section {
                text-align: center;
                margin-bottom: 25px;
                position: relative;
            }
            
            .orbital-system {
                position: relative;
                width: 80px;
                height: 80px;
                margin: 0 auto 15px;
                animation: floatAnimation 4s infinite;
            }
            
            .central-logo {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 40px;
                height: 40px;
                background: radial-gradient(circle, rgba(0,255,136,0.3) 0%, rgba(0,255,136,0.1) 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                box-shadow: 0 0 20px rgba(0,255,136,0.6);
            }
            
            .orbit-ring {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 1px solid rgba(0,255,136,0.4);
                border-radius: 50%;
                animation: orbitalRotate 8s linear infinite;
            }
            
            .orbit-ring::before {
                content: '●';
                position: absolute;
                top: -3px;
                left: 50%;
                transform: translateX(-50%);
                color: #00ff88;
                font-size: 6px;
                text-shadow: 0 0 10px #00ff88;
            }
            
            .game-title {
                font-size: clamp(2.5rem, 6vw, 3.5rem);
                margin: 0 0 8px 0;
                font-weight: 900;
                color: #00ff88;
                animation: titleGlow 3s infinite;
                text-transform: uppercase;
                letter-spacing: 3px;
                line-height: 1;
            }
            
            .game-subtitle {
                font-size: clamp(0.9rem, 2vw, 1.1rem);
                margin: 0 0 20px 0;
                color: rgba(255,255,255,0.9);
                animation: subtitlePulse 2.5s infinite;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 300;
            }
            
            .content-flow {
                display: flex;
                flex-direction: column;
                gap: 18px;
                margin-bottom: 20px;
            }
            
            .mission-brief {
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, rgba(100,150,255,0.05) 0%, rgba(50,100,200,0.05) 100%);
                border: 1px solid rgba(100,150,255,0.2);
                border-radius: 15px;
                position: relative;
                overflow: hidden;
            }
            
            .mission-title {
                color: #6596ff;
                font-size: 1.2rem;
                margin: 0 0 12px 0;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .mission-text {
                color: rgba(255,255,255,0.95);
                font-size: 1rem;
                line-height: 1.4;
                margin: 0 0 15px 0;
            }
            
            .objectives-flow {
                display: flex;
                justify-content: space-around;
                flex-wrap: wrap;
                gap: 12px;
                margin-top: 15px;
            }
            
            .objective-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding: 12px;
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.1);
                flex: 1;
                min-width: 100px;
                pointer-events: none;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
            }
            
            .objective-icon {
                font-size: 1.5rem;
                margin-bottom: 6px;
            }
            
            .objective-label {
                font-size: 0.8rem;
                color: rgba(255,255,255,0.8);
                text-transform: uppercase;
                font-weight: bold;
            }
            
            .objective-value {
                font-size: 0.75rem;
                color: rgba(255,255,255,0.6);
                margin-top: 3px;
            }
            
            .controls-info {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 15px 18px;
                background: linear-gradient(135deg, rgba(0,255,136,0.03) 0%, rgba(0,200,100,0.03) 100%);
                border: 1px solid rgba(0,255,136,0.2);
                border-radius: 10px;
                position: relative;
                
            }
            
            .controls-section {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .control-group {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .key-display {
                background: linear-gradient(135deg, rgba(0,255,136,0.2) 0%, rgba(0,200,100,0.2) 100%);
                border: 1px solid rgba(0,255,136,0.5);
                border-radius: 5px;
                padding: 4px 8px;
                color: #00ff88;
                font-weight: bold;
                font-size: 0.8rem;
                text-shadow: 0 0 8px rgba(0,255,136,0.8);
                box-shadow: 0 0 10px rgba(0,255,136,0.3);
            }
            
            .control-label {
                color: rgba(255,255,255,0.9);
                font-size: 0.85rem;
                font-weight: 500;
            }
            
            .danger-info {
                color: #ff6666;
                font-size: 0.8rem;
                text-align: center;
                font-weight: bold;
                text-transform: uppercase;
                animation: warningBlink 2s infinite;
            }
            
            .launch-section {
                text-align: center;
                position: relative;
                margin-bottom: 30px;
            }
            
            .countdown-warning {
                background: linear-gradient(135deg, rgba(255,68,68,0.1) 0%, rgba(200,30,30,0.1) 100%);
                border: 1px solid rgba(255,68,68,0.3);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 0;
                color: #ff6666;
                font-size: 0.85rem;
                font-weight: bold;
                text-transform: uppercase;
                animation: warningBlink 1.5s infinite;
            }
            
            .start-instruction {
                text-align: center;
                color: rgba(255,255,255,0.95);
                font-size: clamp(1.4rem, 3vw, 1.8rem);
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 2px;
                animation: startPulse 2s infinite;
                margin-top: 25px;
            }
            
            @media (max-width: 768px) {
                .main-container {
                    padding: 20px;
                    max-width: 420px;
                }
                
                .controls-info {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .controls-section {
                    flex-wrap: wrap;
                    justify-content: center;
                }
                
                .objectives-flow {
                    flex-direction: column;
                }
                
                .objective-item {
                    min-width: auto;
                }
                
                .start-instruction {
                    font-size: clamp(1.2rem, 4vw, 1.5rem);
                }
            }
            
            @media (max-width: 480px) {
                .main-container {
                    max-width: 350px;
                    padding: 18px;
                }
                
                .game-title {
                    font-size: 2.2rem;
                }
                
                .mission-brief {
                    padding: 15px;
                }
                
                .start-instruction {
                    font-size: clamp(1.1rem, 4vw, 1.4rem);
                }
            }
        `;
        document.head.appendChild(style);
    }

    createOverlay() {
        // Overlay principale con sfondo molto trasparente
        this.overlay = document.createElement('div');
        this.overlay.id = 'start-screen';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,10,20,0.6);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: 'Orbitron', monospace;
            backdrop-filter: blur(12px);
            padding: 20px;
            box-sizing: border-box;
        `;

        // Container principale
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';

        // Sezione logo e titolo
        const logoSection = document.createElement('div');
        logoSection.className = 'logo-section';
        
        const orbitalSystem = document.createElement('div');
        orbitalSystem.className = 'orbital-system';
        
        const centralLogo = document.createElement('div');
        centralLogo.className = 'central-logo';
        centralLogo.innerHTML = '🚀';
        
        const orbitRing = document.createElement('div');
        orbitRing.className = 'orbit-ring';
        
        orbitalSystem.appendChild(centralLogo);
        orbitalSystem.appendChild(orbitRing);
        
        const gameTitle = document.createElement('h1');
        gameTitle.className = 'game-title';
        gameTitle.textContent = 'SPACE RUSH';
        
        const gameSubtitle = document.createElement('p');
        gameSubtitle.className = 'game-subtitle';
        gameSubtitle.textContent = 'Emergency Evacuation Protocol';
        
        logoSection.appendChild(orbitalSystem);
        logoSection.appendChild(gameTitle);
        logoSection.appendChild(gameSubtitle);

        // Flusso di contenuti
        const contentFlow = document.createElement('div');
        contentFlow.className = 'content-flow';

        // Missione brief
        const missionBrief = document.createElement('div');
        missionBrief.className = 'mission-brief';
        missionBrief.innerHTML = `
            <div class="mission-title">🎯 Mission Critical</div>
            <div class="mission-text">
                Solar storm approaching! Rescue all stranded astronauts before the station collapses.
            </div>
            <div class="objectives-flow">
                <div class="objective-item">
                    <div class="objective-icon">🚀</div>
                    <div class="objective-label">Rescue</div>
                    <div class="objective-value">All astronauts</div>
                </div>
                <div class="objective-item">
                    <div class="objective-icon">⏱️</div>
                    <div class="objective-label">Bonus</div>
                    <div class="objective-value">+3 sec each</div>
                </div>
                <div class="objective-item">
                    <div class="objective-icon">⚠️</div>
                    <div class="objective-label">Avoid</div>
                    <div class="objective-value">All hazards</div>
                </div>
            </div>
        `;

        // Controlli
        const controlsInfo = document.createElement('div');
        controlsInfo.className = 'controls-info';
        controlsInfo.innerHTML = `
            <div class="controls-section">
                <div class="control-group">
                    <span class="key-display">WASD</span>
                    <span class="control-label">Navigate</span>
                </div>
                <div class="control-group">
                    <span class="key-display">SHIFT</span>
                    <span class="control-label">Boost</span>
                </div>
            </div>
        `;

        contentFlow.appendChild(missionBrief);
        contentFlow.appendChild(controlsInfo);

        // Sezione di lancio
        const launchSection = document.createElement('div');
        launchSection.className = 'launch-section';
        
        const countdownWarning = document.createElement('div');
        countdownWarning.className = 'countdown-warning';
        countdownWarning.innerHTML = '⚠️ Solar storm ETA: 60 seconds ⚠️';
        
        launchSection.appendChild(countdownWarning);

        // Assembla tutto
        mainContainer.appendChild(logoSection);
        mainContainer.appendChild(contentFlow);
        mainContainer.appendChild(launchSection);

        // Istruzioni di avvio centrate sotto il menu
        const startInstruction = document.createElement('div');
        startInstruction.className = 'start-instruction';
        startInstruction.textContent = 'Press SPACE to Start';

        // Aggiungi tutto all'overlay
        this.overlay.appendChild(mainContainer);
        this.overlay.appendChild(startInstruction);
        
        document.body.appendChild(this.overlay);
    }

    show(onStartCallback) {
        this.isActive = true;
        this.onStartCallback = onStartCallback;
        this.overlay.style.display = 'flex';
        
        // Nascondi l'HUD del gioco se è visibile
        const hudElement = document.getElementById('game-hud');
        if (hudElement) {
            hudElement.style.display = 'none';
        }
        
        // Aggiungi listener per la barra spaziatrice
        this.keyListener = (e) => {
            if (e.code === 'Space' && this.isActive) {
                e.preventDefault();
                this.hide();
                if (this.onStartCallback) {
                    this.onStartCallback();
                }
            }
        };
        
        window.addEventListener('keydown', this.keyListener);
    }

    hide() {
        this.isActive = false;
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
        
        // Rimuovi listener
        if (this.keyListener) {
            window.removeEventListener('keydown', this.keyListener);
            this.keyListener = null;
        }
        
        // Mostra l'HUD del gioco
        const hudElement = document.getElementById('game-hud');
        if (hudElement) {
            hudElement.style.display = 'block';
        }
    }

    destroy() {
        this.hide();
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        // Rimuovi gli stili se necessario
        const existingStyle = document.querySelector('style[data-start-screen]');
        if (existingStyle) {
            existingStyle.remove();
        }
    }
}
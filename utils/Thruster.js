import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class Thruster {
  constructor(parent, options = {}) {
    this.parent = parent;
    this.position = options.position || new THREE.Vector3(0, 0, 0);
    this.power = options.power || 1;
    this.maxPower = options.maxPower || 1;
    this.particleCount = options.particleCount || 1500;
    this.baseSpeed = 8;
    this.flameLength = 4;
    this.maxDistance = 6;
    this.thrusterRadius = options.thrusterRadius || 1; // Raggio del propulsore
    
    this.particles = [];
    this.particleSystem = null;
    this.geometry = null;
    this.material = null;
    
    this.init();
  }
  
  init() {
    // Crea geometria per le particelle
    this.geometry = new THREE.BufferGeometry();
    
    // Array per posizioni e velocità delle particelle
    const positions = new Float32Array(this.particleCount * 3);
    const velocities = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    const colors = new Float32Array(this.particleCount * 3);
    const alphas = new Float32Array(this.particleCount);
    
    // Inizializza particelle distribuite lungo la fiamma
    for (let i = 0; i < this.particleCount; i++) {
      this.initParticle(i, positions, velocities, sizes, colors, alphas);
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    
    // Shader materiale personalizzato per effetto fiamma
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          vAlpha = alpha;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          // Crea un gradiente radiale per effetto fiamma
          float distance = length(gl_PointCoord - vec2(0.5));
          float intensity = 1.0 - smoothstep(0.0, 0.5, distance);
          
          // Effetto fiamma con bordi sfumati
          float flame = intensity * intensity;
          
          gl_FragColor = vec4(vColor, flame * vAlpha);
        }
      `
    });
    
    // Sistema di particelle
    this.particleSystem = new THREE.Points(this.geometry, this.material);
    this.particleSystem.position.copy(this.position);
    
    this.parent.add(this.particleSystem);
  }
  
  initParticle(index, positions, velocities, sizes, colors, alphas) {
    const i3 = index * 3;
    
    // Posizione iniziale distribuita su tutta la superficie del propulsore
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * this.thrusterRadius; // Distribuzione uniforme nel cerchio
    const zOffset = Math.random() * 0.1;
    
    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = Math.sin(angle) * radius;
    positions[i3 + 2] = zOffset;
    
    // Velocità principalmente verso il basso con piccola dispersione
    const speed = this.baseSpeed + Math.random() * 3;
    const dispersion = 0.1 + Math.random() * 0.2;
    
    velocities[i3] = (Math.random() - 0.5) * dispersion * speed;
    velocities[i3 + 1] = (Math.random() - 0.5) * dispersion * speed;
    velocities[i3 + 2] = -speed;
    
    // Dimensione delle particelle per creare volume
    sizes[index] = 0.8 + Math.random() * 1.2;
    
    // Colore iniziale bianco-blu (centro della fiamma)
    colors[i3] = 0.9 + Math.random() * 0.1;     // R
    colors[i3 + 1] = 0.9 + Math.random() * 0.1; // G
    colors[i3 + 2] = 1.0;                       // B
    
    // Alpha iniziale alto
    alphas[index] = 0.8 + Math.random() * 0.2;
  }
  
  update(delta) {
    if (!this.particleSystem) return;
    
    const positions = this.geometry.attributes.position.array;
    const velocities = this.geometry.attributes.velocity.array;
    const sizes = this.geometry.attributes.size.array;
    const colors = this.geometry.attributes.color.array;
    const alphas = this.geometry.attributes.alpha.array;
    
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Aggiorna posizione
      positions[i3] += velocities[i3] * delta;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += velocities[i3 + 2] * delta;
      
      // Aggiungi turbolenza per movimento realistico della fiamma
      const turbulence = Math.sin(Date.now() * 0.01 + i) * 0.05;
      velocities[i3] += turbulence * delta;
      velocities[i3 + 1] += turbulence * delta;
      
      // Calcola progresso basato sulla distanza
      const distance = Math.abs(positions[i3 + 2]);
      const progress = Math.min(distance / this.maxDistance, 1.0);
      
      // Aggiorna dimensione (aumenta leggermente con la distanza)
      sizes[i] = (0.8 + progress * 0.6) * (0.8 + Math.random() * 0.4);
      
      // Transizione colore: bianco-blu -> giallo -> arancione -> rosso
      if (progress < 0.2) {
        // Bianco-blu (centro caldissimo)
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 1.0;
      } else if (progress < 0.4) {
        // Giallo brillante
        colors[i3] = 1.0;
        colors[i3 + 1] = 1.0;
        colors[i3 + 2] = 0.3 + Math.random() * 0.3;
      } else if (progress < 0.7) {
        // Arancione
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.5 + Math.random() * 0.3;
        colors[i3 + 2] = 0.1 + Math.random() * 0.2;
      } else {
        // Rosso scuro
        colors[i3] = 0.8 + Math.random() * 0.2;
        colors[i3 + 1] = 0.2 + Math.random() * 0.2;
        colors[i3 + 2] = 0.1;
      }
      
      // Alpha che diminuisce con la distanza
      alphas[i] = (1.0 - progress * 0.9) * (0.6 + Math.random() * 0.4);
      
      // Reset particella se troppo lontana
      if (distance > this.maxDistance) {
        this.resetParticle(i, positions, velocities, sizes, colors, alphas);
      }
    }
    
    // Marca gli attributi come aggiornati
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.velocity.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;
  }
  
  resetParticle(index, positions, velocities, sizes, colors, alphas) {
    const i3 = index * 3;
    
    // Reset posizione distribuita su tutta la superficie del propulsore
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * this.thrusterRadius;
    
    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = Math.sin(angle) * radius;
    positions[i3 + 2] = Math.random() * 0.1;
    
    // Velocità principalmente verso il basso
    const speed = this.baseSpeed + Math.random() * 3;
    const dispersion = 0.1 + Math.random() * 0.2;
    
    velocities[i3] = (Math.random() - 0.5) * dispersion * speed;
    velocities[i3 + 1] = (Math.random() - 0.5) * dispersion * speed;
    velocities[i3 + 2] = -speed;
    
    // Dimensione iniziale
    sizes[index] = 0.8 + Math.random() * 1.2;
    
    // Colore bianco-blu iniziale
    colors[i3] = 0.9 + Math.random() * 0.1;
    colors[i3 + 1] = 0.9 + Math.random() * 0.1;
    colors[i3 + 2] = 1.0;
    
    // Alpha iniziale alto
    alphas[index] = 0.8 + Math.random() * 0.2;
  }
  
  setDirection(direction) {
    // Applica rotazione al sistema di particelle basata sulla direzione
    if (this.particleSystem) {
      this.particleSystem.rotation.x = direction.x * 0.15;
      this.particleSystem.rotation.y = direction.y * 0.15;
    }
  }
  
  setPower(power) {
    this.power = Math.max(0, Math.min(power, this.maxPower));
    // Aggiorna la velocità base delle particelle
    this.baseSpeed = 6 + (this.power / this.maxPower) * 6;
  }
  
  getPower() {
    return this.power;
  }
  
  setPosition(position) {
    this.position.copy(position);
    if (this.particleSystem) {
      this.particleSystem.position.copy(position);
    }
  }
  
  destroy() {
    if (this.particleSystem) {
      this.parent.remove(this.particleSystem);
      this.geometry.dispose();
      this.material.dispose();
    }
  }
}
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class ParticleSystem {
  constructor(parent, options = {}) {
    const {
      offset = new THREE.Vector3(0, -0.5, 1.2),
      particleCount = 1000,
      particleSize = 0.05,
      emissionRate = 50,
      velocity = { x: 0, y: -2, z: 0 },
      spread = { x: 0.5, y: 0.2, z: 0.5 },
      lifespan = 2.0,
      color = new THREE.Color(1.0, 0.5, 0.1),
      gravity = -0.5
    } = options;

    this.parent = parent;
    this.particleCount = particleCount;
    this.emissionRate = emissionRate;
    this.velocity = velocity;
    this.spread = spread;
    this.lifespan = lifespan;
    this.gravity = gravity;
    this.offset = offset;
    this.power = 1.0;
    
    // Array per gestire le particelle
    this.particles = [];
    this.activeParticles = 0;
    this.lastEmission = 0;
    
    this.initGeometry();
    this.initMaterial();
    this.createMesh();
  }

  initGeometry() {
    this.geometry = new THREE.BufferGeometry();
    
    // Arrays per gli attributi delle particelle
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.lifetimes = new Float32Array(this.particleCount);
    this.sizes = new Float32Array(this.particleCount);
    this.colors = new Float32Array(this.particleCount * 3);
    
    // Inizializza tutte le particelle come inattive
    for (let i = 0; i < this.particleCount; i++) {
      this.lifetimes[i] = -1; // Particella inattiva
      this.sizes[i] = 0;
    }
    
    // Imposta gli attributi del buffer geometry
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('velocity', new THREE.BufferAttribute(this.velocities, 3));
    this.geometry.setAttribute('lifetime', new THREE.BufferAttribute(this.lifetimes, 1));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
  }

  initMaterial() {
    // Usa PointsMaterial standard per evitare problemi di shader
    this.material = new THREE.PointsMaterial({
      color: 0xff4400,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    // Crea texture procedurale per il material
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 128, 64, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 64, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    this.material.map = texture;
  }

  createMesh() {
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.position.copy(this.offset);
    this.mesh.renderOrder = 1;
    this.parent.add(this.mesh);
  }

  emitParticle() {
    // Trova una particella inattiva
    let particleIndex = -1;
    for (let i = 0; i < this.particleCount; i++) {
      if (this.lifetimes[i] <= 0) {
        particleIndex = i;
        break;
      }
    }
    
    if (particleIndex === -1) return; // Nessuna particella disponibile
    
    const i3 = particleIndex * 3;
    
    // Posizione iniziale con spread casuale
    this.positions[i3] = (Math.random() - 0.5) * this.spread.x;
    this.positions[i3 + 1] = (Math.random() - 0.5) * this.spread.y;
    this.positions[i3 + 2] = (Math.random() - 0.5) * this.spread.z;
    
    // Velocità iniziale con variazione casuale
    this.velocities[i3] = this.velocity.x + (Math.random() - 0.5) * this.spread.x;
    this.velocities[i3 + 1] = this.velocity.y + (Math.random() - 0.5) * this.spread.y * 0.5;
    this.velocities[i3 + 2] = this.velocity.z + (Math.random() - 0.5) * this.spread.z;
    
    // Lifetime e dimensione
    this.lifetimes[particleIndex] = this.lifespan * (0.8 + Math.random() * 0.4);
    this.sizes[particleIndex] = 0.02 + Math.random() * 0.08;
    
    // Colore con variazione
    const colorVar = 0.3;
    this.colors[i3] = 1.0 - Math.random() * colorVar;     // R
    this.colors[i3 + 1] = 0.5 - Math.random() * colorVar; // G
    this.colors[i3 + 2] = 0.1 + Math.random() * colorVar; // B
  }

  updateParticles(deltaTime) {
    let needsUpdate = false;
    
    for (let i = 0; i < this.particleCount; i++) {
      if (this.lifetimes[i] > 0) {
        needsUpdate = true;
        const i3 = i * 3;
        
        // Aggiorna posizione
        this.positions[i3] += this.velocities[i3] * deltaTime;
        this.positions[i3 + 1] += this.velocities[i3 + 1] * deltaTime;
        this.positions[i3 + 2] += this.velocities[i3 + 2] * deltaTime;
        
        // Applica gravità
        this.velocities[i3 + 1] += this.gravity * deltaTime;
        
        // Aggiorna lifetime
        this.lifetimes[i] -= deltaTime;
        
        // Fade out verso la fine della vita
        const lifeFactor = this.lifetimes[i] / this.lifespan;
        this.sizes[i] = (0.02 + Math.random() * 0.08) * lifeFactor;
        
        // Se la particella è morta, nascondila
        if (this.lifetimes[i] <= 0) {
          this.positions[i3] = 0;
          this.positions[i3 + 1] = -1000; // Molto lontano
          this.positions[i3 + 2] = 0;
          this.sizes[i] = 0;
        }
      }
    }
    
    if (needsUpdate) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.lifetime.needsUpdate = true;
      this.geometry.attributes.size.needsUpdate = true;
      
      // Aggiorna la dimensione del material
      const avgSize = this.sizes.reduce((a, b) => a + b, 0) / this.particleCount;
      this.material.size = Math.max(0.05, avgSize * 20);
    }
  }

  setPower(power) {
    this.power = THREE.MathUtils.clamp(power, 0, 1);
  }

  update(time, deltaTime) {
    // Emetti nuove particelle basandoti sulla potenza
    const actualEmissionRate = this.emissionRate * this.power;
    if (actualEmissionRate > 0 && time - this.lastEmission > 1.0 / actualEmissionRate) {
      this.emitParticle();
      this.lastEmission = time;
    }
    
    // Aggiorna tutte le particelle
    this.updateParticles(deltaTime);
    
    // Aggiorna il colore del material basato sulla potenza
    const intensity = this.power * 0.8 + 0.2;
    this.material.color.setRGB(intensity, intensity * 0.5, intensity * 0.1);
    this.material.opacity = intensity * 0.8;
  }

  // Rimuovi i metodi shader che non servono più
  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }
}

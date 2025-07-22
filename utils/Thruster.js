import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

/**
* Thruster particle system class for creating realistic engine flame effects.
* This class generates a dynamic particle system that simulates thruster flames
* with customizable properties including power levels, boost modes, and visual
* effects. Uses custom shaders for realistic flame rendering with color
* transitions and additive blending.
* 
* @param {THREE.Object3D} parent - The parent object to attach the thruster to
* @param {Object} options - Configuration options for the thruster system
*/
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
    this.thrusterRadius = options.thrusterRadius || 1;
    
    this.particles = [];
    this.particleSystem = null;
    this.geometry = null;
    this.material = null;

    this.isBoostActive = false;
    this.boostMaxDistance = 8; 
    this.boostBaseSpeed = 12; 

    this.originalBaseSpeed = this.baseSpeed;
    this.originalMaxDistance = this.maxDistance;

    this.boostRadius = this.thrusterRadius * 1.2;
    this.originalRadius = this.thrusterRadius;

    this.currentRadius = this.thrusterRadius;
    this.targetRadius = this.thrusterRadius;
    this.radiusTransitionSpeed = 15.0; 

    this.init();
  }
  
  /**
  * Initializes the thruster particle system with geometry, materials, and shaders.
  * This function creates buffer geometry for particle positions, velocities, sizes,
  * colors, and alpha values. It also sets up custom vertex and fragment shaders
  * for realistic flame rendering with radial gradients and additive blending.
  * The particle system is then added to the parent object.
  */
  init() {
    this.geometry = new THREE.BufferGeometry();

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
    
    // Shader materiale personalizzato per effetto fiamma, rendering with radial gradients and additive blending.
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
  
  /**
* Initializes a single particle with random properties within the thruster cone.
* This function sets up particle position in a circular pattern, assigns random
* velocity with dispersion effects, and configures initial visual properties
* including size, color (white-blue base), and alpha transparency.
* 
* @param {number} index - The particle index in the arrays
* @param {Float32Array} positions - Position buffer array
* @param {Float32Array} velocities - Velocity buffer array
* @param {Float32Array} sizes - Size buffer array
* @param {Float32Array} colors - Color buffer array
* @param {Float32Array} alphas - Alpha buffer array
*/
  initParticle(index, positions, velocities, sizes, colors, alphas) {
    const i3 = index * 3;
    
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * this.currentRadius; 
    const zOffset = Math.random() * 0.1;
    
    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = Math.sin(angle) * radius;
    positions[i3 + 2] = zOffset;
    
    const speed = this.baseSpeed + Math.random() * 3;
    const dispersion = this.isBoostActive ? 0.05 + Math.random() * 0.1 : 0.1 + Math.random() * 0.2;

    velocities[i3] = (Math.random() - 0.5) * dispersion * speed;
    velocities[i3 + 1] = (Math.random() - 0.5) * dispersion * speed;
    velocities[i3 + 2] = -speed;
        
    sizes[index] = 0.8 + Math.random() * 1.2;
    
    colors[i3] = 0.9 + Math.random() * 0.1;     
    colors[i3 + 1] = 0.9 + Math.random() * 0.1; 
    colors[i3 + 2] = 1.0;                       
    
    alphas[index] = 0.8 + Math.random() * 0.2;
  }
  /**
  * Updates the thruster particle system each frame with realistic flame physics.
  * This function handles particle movement, turbulence effects, color transitions
  * from white-blue to yellow-orange-red, size scaling, and alpha fading.
  * It also manages boost mode effects with increased cone expansion and different
  * color schemes. Particles are recycled when they exceed maximum distance.
  * 
  * @param {number} delta - Time elapsed since last frame in seconds
  */
  update(delta) {
    if (!this.particleSystem) return;

    const radiusDiff = this.targetRadius - this.currentRadius;
    if (Math.abs(radiusDiff) > 0.01) {
      this.currentRadius += radiusDiff * this.radiusTransitionSpeed * delta;
    } else {
      this.currentRadius = this.targetRadius;
    }
    
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
      
      const currentMaxDistance = this.isBoostActive ? this.boostMaxDistance : this.maxDistance;
      const distance = Math.abs(positions[i3 + 2]);
      const progress = Math.min(distance / currentMaxDistance, 1.0);
            
      // Aggiorna dimensione (aumenta leggermente con la distanza)
      sizes[i] = (0.8 + progress * 0.6) * (0.8 + Math.random() * 0.4);
      
      // Transizione colore: bianco-blu -> giallo -> arancione -> rosso
      if (this.isBoostActive) {
  
          if (progress < 0.3) {
            colors[i3] = 0.7 + Math.random() * 0.2;
            colors[i3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i3 + 2] = 1.0;
          } else if (progress < 0.6) {
            colors[i3] = 0.5 + Math.random() * 0.3;
            colors[i3 + 1] = 0.7 + Math.random() * 0.2;
            colors[i3 + 2] = 1.0;
          } else {
            colors[i3] = 0.3 + Math.random() * 0.2;
            colors[i3 + 1] = 0.5 + Math.random() * 0.2;
            colors[i3 + 2] = 1.0;
          }
        } else {
          if (progress < 0.2) {
            colors[i3] = 0.9 + Math.random() * 0.1;
            colors[i3 + 1] = 0.9 + Math.random() * 0.1;
            colors[i3 + 2] = 1.0;
          } else if (progress < 0.4) {
            colors[i3] = 1.0;
            colors[i3 + 1] = 1.0;
            colors[i3 + 2] = 0.3 + Math.random() * 0.3;
          } else if (progress < 0.7) {
            colors[i3] = 1.0;
            colors[i3 + 1] = 0.5 + Math.random() * 0.3;
            colors[i3 + 2] = 0.1 + Math.random() * 0.2;
          } else {
            colors[i3] = 0.8 + Math.random() * 0.2;
            colors[i3 + 1] = 0.2 + Math.random() * 0.2;
            colors[i3 + 2] = 0.1;
          }
        }
      
      alphas[i] = (1.0 - progress * 0.9) * (0.6 + Math.random() * 0.4);
      
      if (distance > currentMaxDistance) {
        this.resetParticle(i, positions, velocities, sizes, colors, alphas);
      }

      if (this.isBoostActive) {
        const coneExpansion = (distance / currentMaxDistance) * 8.0; 
        velocities[i3] += velocities[i3] * coneExpansion * delta * 2;
        velocities[i3 + 1] += velocities[i3 + 1] * coneExpansion * delta * 2;
      }
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.velocity.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;
  }
  
  /**
  * Resets a particle to its initial state at the thruster origin.
  * This function repositions a particle back to the thruster mouth with
  * randomized properties, effectively recycling it for continuous flame
  * effect. Used when particles travel beyond the maximum flame distance.
  * 
  * @param {number} index - The particle index to reset
  * @param {Float32Array} positions - Position buffer array
  * @param {Float32Array} velocities - Velocity buffer array
  * @param {Float32Array} sizes - Size buffer array
  * @param {Float32Array} colors - Color buffer array
  * @param {Float32Array} alphas - Alpha buffer array
  */
  resetParticle(index, positions, velocities, sizes, colors, alphas) {
    const i3 = index * 3;
    
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * this.currentRadius;
    
    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = Math.sin(angle) * radius;
    positions[i3 + 2] = Math.random() * 0.1;
    
    const speed = this.baseSpeed + Math.random() * 3;
    const dispersion = this.isBoostActive ? 0.05 + Math.random() * 0.1 : 0.1 + Math.random() * 0.2;

    velocities[i3] = (Math.random() - 0.5) * dispersion * speed;
    velocities[i3 + 1] = (Math.random() - 0.5) * dispersion * speed;
    velocities[i3 + 2] = -speed;
    sizes[index] = 0.8 + Math.random() * 1.2;
    
    colors[i3] = 0.9 + Math.random() * 0.1;
    colors[i3 + 1] = 0.9 + Math.random() * 0.1;
    colors[i3 + 2] = 1.0;
    
    alphas[index] = 0.8 + Math.random() * 0.2;
  }
  
  setDirection(direction) {
    if (this.particleSystem) {
      this.particleSystem.rotation.x = THREE.MathUtils.lerp(
        this.particleSystem.rotation.x, 
        direction.x * 0.01, 
        0.1
      );
      this.particleSystem.rotation.y = THREE.MathUtils.lerp(
        this.particleSystem.rotation.y, 
        direction.y * 0.01, 
        0.1
      );
    }
  }
  
  setPower(power) {
    this.power = Math.max(0, Math.min(power, this.maxPower));
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
  setBoostMode(isBoostActive) {
    this.isBoostActive = isBoostActive;
    if (isBoostActive) {
      this.maxDistance = this.boostMaxDistance;
      this.baseSpeed = this.boostBaseSpeed;
      this.targetRadius = this.boostRadius;
      this.currentRadius = this.boostRadius; 
    } else {
      this.maxDistance = this.originalMaxDistance;
      this.baseSpeed = this.originalBaseSpeed;
      this.targetRadius = this.originalRadius;
    }
  }
  getBoostMode() {
    return this.isBoostActive;
  }
}
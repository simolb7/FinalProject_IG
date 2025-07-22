import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

let isShipExploding = false;

/**
 * CollisionSystem handles collision detection between game objects in particular it
 * manages ship-astronaut and ship-asteroid collision detection with different collision radius
 */
export class CollisionSystem {
     constructor() {
        this.collisionDistance = 25; 
        this.asteroidCollisionDistance = 20;
    }
    /**
     * Calculates the 3D distance between two objects with position vectors
     */
    calculateDistance(object1, object2) {
        if (!object1 || !object2 || !object1.position || !object2.position) {
            return Infinity;
        }
        
        return object1.position.distanceTo(object2.position);
    }

    /**
     * Checks if two objects are colliding based on default collision distance
     */
    checkCollision(object1, object2) {
        const distance = this.calculateDistance(object1, object2);
        return distance < this.collisionDistance;
    }
    /**
     * Checks collisions between ship and astronauts
     */
    checkShipAstronautCollisions(ship, astronauts) {
        if (!ship || !astronauts) return [];

        const collisions = [];
        
        for (let i = 0; i < astronauts.length; i++) {
            const astronaut = astronauts[i];
            if (this.checkCollision(ship, astronaut)) {
                collisions.push(astronaut);
            }
        }

        return collisions;
    }
    /**
     * Animates an astronaut shrinking and moving toward collision point before removal
     * Creates a smooth animation when astronaut is picked up
     */
    shrinkAstronaut(astronaut, scene, ship) {
        if (!astronaut || astronaut.shrinking) return;
        
        // Prevent multiple shrinking animations on same astronaut
        astronaut.shrinking = true;
        const originalScale = astronaut.scale.clone();
        const startTime = Date.now();
        const duration = 175; 

        const collisionPoint = new THREE.Vector3().addVectors(
            astronaut.position,
            ship.position
        ).multiplyScalar(0.5);

        const originalPosition = astronaut.position.clone();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Scale down astronaut proportionally to animation progress
            const scale = originalScale.clone().multiplyScalar(1 - progress);
            astronaut.scale.copy(scale);
            
            astronaut.position.lerpVectors(originalPosition, collisionPoint, progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(astronaut);
            }
        };
        
        animate();
    }

    /**
     * Checks collisions between ship and multiple asteroids
     * Uses smaller collision distance for more precise asteroid collision detection
     */
    checkShipAsteroidCollisions(ship, asteroids) {
        if (!ship || !asteroids) return [];

        const collisions = [];
        
        for (let i = 0; i < asteroids.length; i++) {
            const asteroid = asteroids[i];
            const asteroidMesh = asteroid.mesh;
            if (this.checkCollision(ship, asteroidMesh, this.asteroidCollisionDistance)) {
                collisions.push(asteroid);
            }
        }

        return collisions;
    }

        
}


/**
 * Spline class for creating smooth value interpolation over time
 * Supports different easing functions for natural animation curves
 * in order to create smooth transitions between particle states
 * 
 * linear: Cambio costante
 * ease-in: Inizia lento, accelera
 * ease-out: Inizia veloce, rallenta
 * ease-in-out: Lento-veloce-lento
 */
class Spline {
    constructor() {
        this.points = [];
    }

    addPoint(t, value, easing = 'linear') {
        this.points.push({ t, value, easing });
        this.points.sort((a, b) => a.t - b.t);
    }
    /**
     * Evaluates the spline at a given time, returning interpolated value
     */
    evaluate(t) {
        if (this.points.length === 0) return 0;
        if (this.points.length === 1) return this.points[0].value;
        
        t = Math.max(0, Math.min(1, t));
        
        let i = 0;
        while (i < this.points.length - 1 && this.points[i + 1].t <= t) {
            i++;
        }
        
        if (i === this.points.length - 1) {
            return this.points[i].value;
        }
        
        const p1 = this.points[i];
        const p2 = this.points[i + 1];
        
        const localT = (t - p1.t) / (p2.t - p1.t);
        const easedT = this.applyEasing(localT, p1.easing);

        // Linear interpolation with easing applied
        return p1.value + (p2.value - p1.value) * easedT;
    }
    /**
     * Applies easing function to a normalized time value
     */
    applyEasing(t, easing) {
        switch (easing) {
            case 'ease-in':
                return t * t;
            case 'ease-out':
                return 1 - (1 - t) * (1 - t);
            case 'ease-in-out':
                return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
            default:
                return t;
        }
    }
}

/**
 * ColorSpline class for interpolating between THREE.Color objects over time
 * Similar to Spline but handles color interpolation with easing
 */
class ColorSpline {
    constructor() {
        this.points = [];
    }

    addPoint(t, color, easing = 'linear') {
        this.points.push({ t, color: color.clone(), easing });
        this.points.sort((a, b) => a.t - b.t);
    }

    evaluate(t) {
        if (this.points.length === 0) return new THREE.Color(0xffffff);
        if (this.points.length === 1) return this.points[0].color.clone();
        
        t = Math.max(0, Math.min(1, t));
        
        let i = 0;
        while (i < this.points.length - 1 && this.points[i + 1].t <= t) {
            i++;
        }
        
        if (i === this.points.length - 1) {
            return this.points[i].color.clone();
        }
        
        const p1 = this.points[i];
        const p2 = this.points[i + 1];
        
        const localT = (t - p1.t) / (p2.t - p1.t);
        const easedT = this.applyEasing(localT, p1.easing);

        // Use THREE.Color's lerp method for smooth color interpolation
        return p1.color.clone().lerp(p2.color, easedT);
    }
    /**
     * Applies easing function to a normalized time value (same as Spline)
     */
    applyEasing(t, easing) {
        switch (easing) {
            case 'ease-in':
                return t * t;
            case 'ease-out':
                return 1 - (1 - t) * (1 - t);
            case 'ease-in-out':
                return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
            default:
                return t;
        }
    }
}

/**
 * ParticleSystem manages multiple particle emitters and their materials
 * Handling creation, updating, and cleanup of particle effects
 */
class ParticleSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.emitters = [];
        this.materials = this.createMaterials();
    }
    /**
     * Creates and returns all particle material types used by the system
     * Each material is optimized for different particle types (fire, smoke, sparks, debris)
     */
    createMaterials() {
        const materials = {};
        
        materials.fire = this.createFireMaterial();
 
        materials.smoke = this.createSmokeMaterial();
        
        materials.spark = this.createSparkMaterial();

        materials.debris = this.createDebrisMaterial();
        
        return materials;
    }
    /**
     * Creates a fire particle material with bright, additive blending
     * Uses radial gradient for realistic fire particle appearance
     */
    createFireMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

         // Create radial gradient from bright center to transparent edges
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);

        // Additive blending makes fire particles glow and blend realistically
        return new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            alphaTest: 0.001
        });
    }

    /**
     * Creates a smoke particle material with noise texture
     * Uses normal blending for realistic smoke appearance
     */
    createSmokeMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        // Create base radial gradient
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        // Add noise to make smoke look more realistic
        const imageData = ctx.getImageData(0, 0, 64, 64);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 0.3;
            data[i + 3] = Math.max(0, Math.min(255, data[i + 3] + noise * 255));
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        return new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.NormalBlending,
            transparent: true,
            alphaTest: 0.001
        });
    }

    /**
     * Creates a spark particle material for bright, small particles
     * Simple circular shape with additive blending
     */
    createSparkMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        // Simple white circle for spark effect      
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.beginPath();
        ctx.arc(16, 16, 2, 0, Math.PI * 2);
        ctx.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        
        return new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            alphaTest: 0.001
        });
    }

    /**
     * Creates a debris particle material 
     */
    createDebrisMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(2, 2, 4, 4);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        return new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.NormalBlending,
            transparent: true,
            alphaTest: 0.001
        });
    }

    addEmitter(emitter) {
        this.emitters.push(emitter);
    }
    /**
     * Updates all particle emitters and removes finished ones
     * Called every frame to animate particles
     */
    update(deltaTime) {
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];
            emitter.update(deltaTime);
            
            if (emitter.isFinished()) {
                emitter.destroy();
                this.emitters.splice(i, 1);
            }
        }
    }

    destroy() {
        this.emitters.forEach(emitter => emitter.destroy());
        this.emitters = [];
    }
}

/**
 * ParticleEmitter creates and manages individual particles of a specific type
 * Handling particle creation, physics simulation, and lifecycle management
 */
class ParticleEmitter {
    constructor(origin, particleSystem, type = 'fire') {
        this.origin = origin.clone();
        this.particleSystem = particleSystem;
        this.type = type;
        this.particles = [];
        this.delay = 0;
        this.timer = 0;
        this.finished = false;
        this.active = true;
        
        // Configure emitter based on particle type
        this.setupTypeParameters();
        
        // Splines for animating particle properties over lifetime
        this.alphaSpline = new Spline();
        this.colorSpline = new ColorSpline();
        this.sizeSpline = new Spline();
        this.velocitySpline = new Spline();
    }
     /**
     * Configures emitter parameters based on particle type
     * each type has different physics properties and appearance
     */
    setupTypeParameters() {
        switch(this.type) {
            case 'fire':
                this.material = this.particleSystem.materials.fire;
                this.gravity = new THREE.Vector3(0, 30, 0);
                this.drag = 0.85;
                this.turbulenceStrength = 80;
                this.baseSize = 20;
                this.lifeRange = [1.5, 3.0];
                this.speedRange = [60, 120];
                this.spreadRadius = 2;
                break;
                
            case 'smoke':
                this.material = this.particleSystem.materials.smoke;
                this.gravity = new THREE.Vector3(0, 15, 0);
                this.drag = 0.95;
                this.turbulenceStrength = 40;
                this.baseSize = 25;
                this.lifeRange = [3.0, 6.0];
                this.speedRange = [30, 70];
                this.spreadRadius = 3;
                break;
                
            case 'spark':
                this.material = this.particleSystem.materials.spark;
                this.gravity = new THREE.Vector3(0, -200, 0);
                this.drag = 0.98;
                this.turbulenceStrength = 20;
                this.baseSize = 3;
                this.lifeRange = [0.5, 1.5];
                this.speedRange = [150, 300];
                this.spreadRadius = 1;
                break;
                
            case 'debris':
                this.material = this.particleSystem.materials.debris;
                this.gravity = new THREE.Vector3(0, -150, 0);
                this.drag = 0.97;
                this.turbulenceStrength = 10;
                this.baseSize = 4;
                this.lifeRange = [2.0, 4.0];
                this.speedRange = [100, 200];
                this.spreadRadius = 1;
                break;
        }
    }
    /**
     * Creates a specified number of particles and adds them to the emitter
     */
    addParticles(count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }
    /**
     * Creates a single particle with randomized properties
     * Uses multiple distribution patterns for realistic explosion effects
     */
    createParticle() {
        const life = this.lifeRange[0] + Math.random() * (this.lifeRange[1] - this.lifeRange[0]);
        
        const randomMethod = Math.random();
        let p;
        // Different spawn patterns for variety in explosion shape
        if (randomMethod < 0.2) {
            const jetAngle = Math.random() * Math.PI * 2;
            const jetLength = Math.pow(Math.random(), 0.3) * this.spreadRadius * 3; 
            const jetWidth = Math.random() * this.spreadRadius * 0.2;
            
            p = new THREE.Vector3(
                Math.cos(jetAngle) * jetLength + (Math.random() - 0.5) * jetWidth,
                (Math.random() - 0.5) * this.spreadRadius * 0.8,
                Math.sin(jetAngle) * jetLength + (Math.random() - 0.5) * jetWidth
            );
        } else if (randomMethod < 0.4) {
            // Cloud pattern - clustered spawning
            const cloudCenters = [
                new THREE.Vector3(Math.random() * this.spreadRadius * 2 - this.spreadRadius, 0, 0),
                new THREE.Vector3(0, Math.random() * this.spreadRadius * 2 - this.spreadRadius, 0),
                new THREE.Vector3(0, 0, Math.random() * this.spreadRadius * 2 - this.spreadRadius)
            ];
            
            const selectedCloud = cloudCenters[Math.floor(Math.random() * cloudCenters.length)];
            const cloudRadius = Math.pow(Math.random(), 2) * this.spreadRadius * 0.8;
            const cloudAngle = Math.random() * Math.PI * 2;
            
            p = selectedCloud.clone().add(new THREE.Vector3(
                Math.cos(cloudAngle) * cloudRadius,
                (Math.random() - 0.5) * this.spreadRadius * 0.6,
                Math.sin(cloudAngle) * cloudRadius
            ));
        } else if (randomMethod < 0.6) {
            // Spiral pattern - swirling effect
            const spiralAngle = Math.random() * Math.PI * 4; // Più giri
            const spiralRadius = Math.pow(Math.random(), 1.2) * this.spreadRadius * 1.5;
            const spiralHeight = Math.sin(spiralAngle * 0.5) * this.spreadRadius * 0.7;
            
            p = new THREE.Vector3(
                Math.cos(spiralAngle) * spiralRadius + (Math.random() - 0.5) * this.spreadRadius * 0.5,
                spiralHeight + (Math.random() - 0.5) * this.spreadRadius * 0.4,
                Math.sin(spiralAngle) * spiralRadius + (Math.random() - 0.5) * this.spreadRadius * 0.5
            );
        } else {
            // Fragment pattern - scattered debris
            const fragmentVector = new THREE.Vector3(
                (Math.random() - 0.5) * this.spreadRadius * 4,
                (Math.random() - 0.5) * this.spreadRadius * 3,
                (Math.random() - 0.5) * this.spreadRadius * 4
            );
            
            // Apply non-linear scaling for more realistic distribution
            fragmentVector.x *= Math.pow(Math.abs(fragmentVector.x / this.spreadRadius), 0.7);
            fragmentVector.y *= Math.pow(Math.abs(fragmentVector.y / this.spreadRadius), 0.8);
            fragmentVector.z *= Math.pow(Math.abs(fragmentVector.z / this.spreadRadius), 0.7);
            
            p = fragmentVector;
        }
        
        p.add(this.origin);
        
        // Generate initial velocity with multiple patterns
        let direction;
        const velocityStyle = Math.random();
        
        if (velocityStyle < 0.25) {
            // Explosive outward pattern
            direction = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
            );
            
            const explosiveForce = p.clone().sub(this.origin).normalize().multiplyScalar(0.5);
            direction.add(explosiveForce);
            direction.normalize();
        } else if (velocityStyle < 0.5) {
            // Vortex pattern - swirling motion
            const vortexAxis = new THREE.Vector3(0, 1, 0);
            const positionFromCenter = p.clone().sub(this.origin);
            const tangential = positionFromCenter.clone().cross(vortexAxis).normalize();
            const outward = positionFromCenter.clone().normalize();
            
            direction = outward.multiplyScalar(0.6).add(tangential.multiplyScalar(0.4));
            direction.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ));
            direction.normalize();
        } else if (velocityStyle < 0.75) {
            // Shockwave pattern - directional bursts
            const shockWaves = [
                new THREE.Vector3(1, 0.3, 0.2),
                new THREE.Vector3(-0.8, 0.5, 0.3),
                new THREE.Vector3(0.2, -0.7, 1),
                new THREE.Vector3(-0.3, 0.8, -0.6)
            ];
            
            const selectedWave = shockWaves[Math.floor(Math.random() * shockWaves.length)];
            direction = selectedWave.clone().normalize();
            
            direction.add(new THREE.Vector3(
                (Math.random() - 0.5) * 1.8,
                (Math.random() - 0.5) * 1.8,
                (Math.random() - 0.5) * 1.8
            ));
            direction.normalize();
        } else {
            // Fragment pattern - axis-aligned with variation
            const fragmentDirections = [
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(0, 0, 1),
                new THREE.Vector3(0, 0, -1)
            ];
            
            const baseDirection = fragmentDirections[Math.floor(Math.random() * fragmentDirections.length)];
            
            direction = baseDirection.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 2.5,
                (Math.random() - 0.5) * 2.5,
                (Math.random() - 0.5) * 2.5
            )).normalize();
        }
        
        // Apply speed variation for more natural look
        const speedVariation = Math.pow(Math.random(), 0.6); 
        const speedMultiplier = 0.1 + speedVariation * 2.0; 
        const speed = (this.speedRange[0] + Math.random() * (this.speedRange[1] - this.speedRange[0])) * speedMultiplier;
        direction.multiplyScalar(speed);

        // Create Three.js sprite for rendering
        const sprite = new THREE.Sprite(this.material.clone());
        sprite.position.copy(p);
        this.particleSystem.scene.add(sprite);

        return {
            sprite: sprite,
            position: p,
            velocity: direction,
            size: (Math.random() * 0.8 + 0.2) * this.baseSize, 
            life: life,
            maxLife: life,
            rotation: Math.random() * 2.0 * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 15,
            active: true
        };
    }
    /**
     * Updates all particles in the emitter
     * Applies physics, animates properties, and removes dead particles
     */
    update(deltaTime) {
        this.timer += deltaTime;
        
        if (this.timer < this.delay) {
            return;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (!particle.active) continue;
            
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.particleSystem.scene.remove(particle.sprite);
                this.particles.splice(i, 1);
                continue;
            }
            
            particle.velocity.add(this.gravity.clone().multiplyScalar(deltaTime));
            particle.velocity.multiplyScalar(this.drag);
            
            const turbulenceIntensity = 1.0 + Math.sin(this.timer * 3) * 0.5; 
            const turbulence = new THREE.Vector3(
                (Math.random() - 0.5) * this.turbulenceStrength * turbulenceIntensity,
                (Math.random() - 0.5) * this.turbulenceStrength * turbulenceIntensity,
                (Math.random() - 0.5) * this.turbulenceStrength * turbulenceIntensity
            );
            particle.velocity.add(turbulence.multiplyScalar(deltaTime));
            
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            particle.sprite.position.copy(particle.position);
            
            particle.rotation += particle.rotationSpeed * deltaTime;
            particle.sprite.material.rotation = particle.rotation;
            
            const lifeProgress = 1.0 - (particle.life / particle.maxLife);
            
            const alpha = this.alphaSpline.evaluate(lifeProgress);
            const color = this.colorSpline.evaluate(lifeProgress);
            const size = this.sizeSpline.evaluate(lifeProgress);
            
            particle.sprite.material.opacity = alpha;
            particle.sprite.material.color = color;
            particle.sprite.scale.setScalar(particle.size * size);
        }
        
        if (this.particles.length === 0) {
            this.finished = true;
        }
    }

    isFinished() {
        return this.finished;
    }

    destroy() {
        this.particles.forEach(particle => {
            this.particleSystem.scene.remove(particle.sprite);
        });
        this.particles = [];
    }
}

/**
 * Ship Explosion System - Manages particle-based ship explosions
 * Creating realistic multi-phase explosions with fire, smoke, sparks, and debris
 */
class ShipExplosionSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.particleSystem = new ParticleSystem(scene, camera);
        this.explosions = [];
        this.gameEnded = false;
    }
    /**
     * Creates a new explosion at the specified position with multiple particle phases
     */
    createExplosion(position, shipSize = 1.0) {
        if (this.gameEnded) return null;
        
        const explosion = {
            position: position.clone(),
            timer: 0,
            duration: 8.0,
            active: true,
            phase: 0 
        };

        this.createInitialBlast(position, shipSize);
        this.createFireEmitters(position, shipSize);
        this.createSmokeEmitters(position, shipSize);
        this.createSparkEmitters(position, shipSize);
        this.createDebrisEmitters(position, shipSize);

        this.explosions.push(explosion);
        return explosion;
    }
    /**
     * Creates the initial bright flash and primary blast wave
     * Uses white-hot to red-orange color transition with rapid size expansion
     */
    createInitialBlast(position, shipSize) {
        const emitter = new ParticleEmitter(position, this.particleSystem, 'fire');
        
        emitter.alphaSpline.addPoint(0.0, 0.0);
        emitter.alphaSpline.addPoint(0.05, 1.0, 'ease-out');
        emitter.alphaSpline.addPoint(0.3, 0.8, 'ease-in-out');
        emitter.alphaSpline.addPoint(1.0, 0.0, 'ease-in');
        
        emitter.colorSpline.addPoint(0.0, new THREE.Color(0xffffff), 'ease-out');
        emitter.colorSpline.addPoint(0.1, new THREE.Color(0xffff88), 'ease-out');
        emitter.colorSpline.addPoint(0.3, new THREE.Color(0xff4400), 'ease-in-out');
        emitter.colorSpline.addPoint(0.7, new THREE.Color(0xaa1100), 'ease-in');
        emitter.colorSpline.addPoint(1.0, new THREE.Color(0x440000), 'ease-in');
        
        emitter.sizeSpline.addPoint(0.0, 0.1);
        emitter.sizeSpline.addPoint(0.2, 2.5 * shipSize, 'ease-out');
        emitter.sizeSpline.addPoint(0.6, 1.8 * shipSize, 'ease-in-out');
        emitter.sizeSpline.addPoint(1.0, 0.5 * shipSize, 'ease-in');
        
        emitter.baseSize *= shipSize;
        emitter.spreadRadius *= shipSize * 0.5; 
        emitter.turbulenceStrength *= 1.5; 
        emitter.addParticles(200); 
        
        this.particleSystem.addEmitter(emitter);
    }
    /**
     * Generates multiple fire emitters around the explosion center
     * Creates secondary fire bursts with orange to red color progression
     */
    createFireEmitters(position, shipSize) {
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = (Math.random() * 0.7 + 0.3) * 15 * shipSize;
            const height = (Math.random() - 0.5) * 12 * shipSize;
            
            const offset = new THREE.Vector3(
                Math.cos(angle) * distance,
                height,
                Math.sin(angle) * distance
            );
            
            const emitter = new ParticleEmitter(position.clone().add(offset), this.particleSystem, 'fire');
            emitter.delay = Math.random() * 0.8; 
            
            emitter.alphaSpline.addPoint(0.0, 0.0);
            emitter.alphaSpline.addPoint(0.1, 0.9, 'ease-out');
            emitter.alphaSpline.addPoint(0.6, 0.7, 'ease-in-out');
            emitter.alphaSpline.addPoint(1.0, 0.0, 'ease-in');
            
            emitter.colorSpline.addPoint(0.0, new THREE.Color(0xffaa00), 'ease-out');
            emitter.colorSpline.addPoint(0.2, new THREE.Color(0xff6600), 'ease-in-out');
            emitter.colorSpline.addPoint(0.5, new THREE.Color(0xff2200), 'ease-in-out');
            emitter.colorSpline.addPoint(1.0, new THREE.Color(0x880000), 'ease-in');
            
            emitter.sizeSpline.addPoint(0.0, 0.3);
            emitter.sizeSpline.addPoint(0.3, 1.2 * shipSize, 'ease-out');
            emitter.sizeSpline.addPoint(0.8, 1.8 * shipSize, 'ease-in-out');
            emitter.sizeSpline.addPoint(1.0, 0.6 * shipSize, 'ease-in');
            
            emitter.baseSize *= shipSize;
            emitter.spreadRadius *= shipSize * 1.2;
            emitter.turbulenceStrength *= 1.3;
            emitter.addParticles(Math.floor(80 + Math.random() * 40));
            
            this.particleSystem.addEmitter(emitter);
        }
    }
    /**
     * Creates smoke emitters with delayed activation
     * Produces dark smoke that expands and fades over time
     */
    createSmokeEmitters(position, shipSize) {
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 12 * shipSize;
            const height = Math.random() * 10 * shipSize;
            
            const offset = new THREE.Vector3(
                Math.cos(angle) * distance,
                height,
                Math.sin(angle) * distance
            );
            
            const emitter = new ParticleEmitter(position.clone().add(offset), this.particleSystem, 'smoke');
            emitter.delay = Math.random() * 1.2 + 0.5;
            
            emitter.alphaSpline.addPoint(0.0, 0.0);
            emitter.alphaSpline.addPoint(0.2, 0.6, 'ease-out');
            emitter.alphaSpline.addPoint(0.7, 0.4, 'ease-in-out');
            emitter.alphaSpline.addPoint(1.0, 0.0, 'ease-in');
            
            emitter.colorSpline.addPoint(0.0, new THREE.Color(0x332222));
            emitter.colorSpline.addPoint(0.3, new THREE.Color(0x221111));
            emitter.colorSpline.addPoint(1.0, new THREE.Color(0x111111));
            
            emitter.sizeSpline.addPoint(0.0, 0.5);
            emitter.sizeSpline.addPoint(0.4, 1.0 * shipSize, 'ease-out');
            emitter.sizeSpline.addPoint(1.0, 2.5 * shipSize, 'ease-in-out');
            
            emitter.baseSize *= shipSize;
            emitter.spreadRadius *= shipSize * 1.3;
            emitter.addParticles(Math.floor(60 + Math.random() * 30));
            
            this.particleSystem.addEmitter(emitter);
        }
    }
    /**
     * Generates bright spark emitters for metallic debris effects
     * Creates white-hot sparks that fade to orange then red
     */
    createSparkEmitters(position, shipSize) {
        for (let i = 0; i < 3; i++) {
            const randomOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 8 * shipSize,
                (Math.random() - 0.5) * 8 * shipSize,
                (Math.random() - 0.5) * 8 * shipSize
            );
            
            const emitter = new ParticleEmitter(position.clone().add(randomOffset), this.particleSystem, 'spark');
            emitter.delay = Math.random() * 0.3;
            
            emitter.alphaSpline.addPoint(0.0, 1.0);
            emitter.alphaSpline.addPoint(0.3, 0.8, 'ease-out');
            emitter.alphaSpline.addPoint(1.0, 0.0, 'ease-in');
            
            emitter.colorSpline.addPoint(0.0, new THREE.Color(0xffffff));
            emitter.colorSpline.addPoint(0.4, new THREE.Color(0xffaa44));
            emitter.colorSpline.addPoint(1.0, new THREE.Color(0xff4400));
            
            emitter.sizeSpline.addPoint(0.0, 1.0);
            emitter.sizeSpline.addPoint(0.2, 1.8 * shipSize, 'ease-out');
            emitter.sizeSpline.addPoint(1.0, 0.1 * shipSize, 'ease-in');
            
            emitter.baseSize *= shipSize;
            emitter.spreadRadius *= shipSize * 0.8;
            emitter.turbulenceStrength *= 2.0;
            emitter.addParticles(Math.floor(50 + Math.random() * 40));
            
            this.particleSystem.addEmitter(emitter);
        }
    }
    /**
     * Creates debris particle emitters for ship fragments
     * Generates gray metallic debris that darkens over time
     */
    createDebrisEmitters(position, shipSize) {
        for (let i = 0; i < 2; i++) {
            const randomOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 6 * shipSize,
                (Math.random() - 0.5) * 6 * shipSize,
                (Math.random() - 0.5) * 6 * shipSize
            );
            
            const emitter = new ParticleEmitter(position.clone().add(randomOffset), this.particleSystem, 'debris');
            emitter.delay = Math.random() * 0.5;
            
            emitter.alphaSpline.addPoint(0.0, 1.0);
            emitter.alphaSpline.addPoint(0.8, 0.8, 'ease-in-out');
            emitter.alphaSpline.addPoint(1.0, 0.0, 'ease-in');
            
            emitter.colorSpline.addPoint(0.0, new THREE.Color(0x888888));
            emitter.colorSpline.addPoint(0.5, new THREE.Color(0x444444));
            emitter.colorSpline.addPoint(1.0, new THREE.Color(0x222222));
            
            emitter.sizeSpline.addPoint(0.0, 1.0);
            emitter.sizeSpline.addPoint(1.0, 0.7 * shipSize, 'ease-in-out');
            
            emitter.baseSize *= shipSize;
            emitter.spreadRadius *= shipSize * 0.7;
            emitter.turbulenceStrength *= 1.5;
            emitter.addParticles(Math.floor(30 + Math.random() * 20));
            
            this.particleSystem.addEmitter(emitter);
        }
    }
    /**
     * Updates all active explosions and particle systems
     * Removes expired explosions and updates particle physics
     */
    update(deltaTime) {
        this.particleSystem.update(deltaTime);
        
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.timer += deltaTime;
            
            if (explosion.timer > explosion.duration) {
                this.explosions.splice(i, 1);
            }
        }
    }

    setGameEnded(ended) {
        this.gameEnded = ended;
    }

    destroy() {
        this.particleSystem.destroy();
        this.explosions = [];
    }
}
/**
 * Creates a ship explosion effect at the specified position
 * Initializes explosion system
 */
export function createShipExplosion(scene, camera, shipPosition, ship, shipSize = 1.0) {
    if (!window.explosionSystem) {
        window.explosionSystem = new ShipExplosionSystem(scene, camera);
    }
    
    if (ship) {
        ship.visible = false;
    }
    
    const explosion = window.explosionSystem.createExplosion(shipPosition, shipSize);
    
    return explosion;
}

/**
 * Updates all active explosions in the global system
 * called every frame from the main game loop
 */
export function updateExplosions(deltaTime) {
    if (window.explosionSystem) {
        window.explosionSystem.update(deltaTime);
    }
}

export function destroyExplosionSystem() {
    if (window.explosionSystem) {
        window.explosionSystem.destroy();
        window.explosionSystem = null;
    }
}

export function setExplosionGameEnded(ended) {
    if (window.explosionSystem) {
        window.explosionSystem.setGameEnded(ended);
    }
}


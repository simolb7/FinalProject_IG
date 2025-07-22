import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class ShockwaveSystem {
    constructor(scene) {
        this.scene = scene;
        this.activeShockwaves = [];
        this.shockwaveMaterial = null;
        this.shockwaveGeometry = null;
        this.initializeShockwaveMaterial();
    }

    /**
     * Material for the shockwave effect
     */
    initializeShockwaveMaterial() {
        // Geometry for the shockwave (expanding sphere)
        this.shockwaveGeometry = new THREE.SphereGeometry(1, 32, 32);

        // Material with transparent and glowing effect
        this.shockwaveMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                opacity: { value: 1 },
                color: { value: new THREE.Color(0x00ffff) }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float opacity;
                uniform vec3 color;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    // Distanza dal centro della sfera
                    float dist = length(vPosition);
                    
                    // Crea un effetto onda più visibile
                    float wave1 = sin(dist * 8.0 - time * 6.0) * 0.5 + 0.5;
                    float wave2 = sin(dist * 12.0 - time * 8.0) * 0.3 + 0.7;
                    
                    // Effetto fresnel
                    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
                    float fresnel = 1.0 - abs(dot(vNormal, viewDirection));
                    fresnel = pow(fresnel, 1.5);
                    
                    // Combina le onde
                    float waveEffect = wave1 * wave2;
                    
                    // Alpha finale 
                    float baseAlpha = 0.2; // Visibilità base della sfera
                    float alpha = (baseAlpha + fresnel * waveEffect) * opacity;
                    
                    // Colore più intenso con luminosità base
                    vec3 baseGlow = color * 0.4; // Bagliore base
                    vec3 waveGlow = color * (1.0 + waveEffect * 0.8); // Effetto onda
                    vec3 finalColor = baseGlow + waveGlow;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
    }

    /**
     * Create the shockwave effect
     * @param {THREE.Vector3} position - Origin position of the shockwave
     * @param {Object} options - Options to customize the shockwave
     */
    createShockwave(position, options = {}) {
        const config = {
            maxRadius: options.maxRadius || 50,
            duration: options.duration || 2.0,
            force: options.force || 15,
            color: options.color || new THREE.Color(0x00ffff),
            ...options
        };

        // Create the shockwave mesh
        const shockwaveMesh = new THREE.Mesh(
            this.shockwaveGeometry,
            this.shockwaveMaterial.clone()
        );
        
        shockwaveMesh.position.copy(position);
        shockwaveMesh.scale.set(0.1, 0.1, 0.1);
        shockwaveMesh.material.uniforms.color.value = config.color;
        
        this.scene.add(shockwaveMesh);

        // Object representing the active shockwave
        const shockwave = {
            mesh: shockwaveMesh,
            position: position.clone(),
            currentRadius: 0,
            maxRadius: config.maxRadius,
            duration: config.duration,
            force: config.force,
            elapsedTime: 0,
            affectedAsteroids: new Set() // To avoid applying force multiple times
        };

        this.activeShockwaves.push(shockwave);
        
        return shockwave;
    }

    /**
     * Apply the shockwave force to the asteroids
     * @param {Array} asteroids - Array of active asteroids
     * @param {Object} shockwave - The current shockwave
     */
    applyShockwaveForce(asteroids, shockwave) {

        asteroids.forEach(asteroid => {
            // Check if the asteroid exists and has a valid mesh with position
            if (!asteroid || !asteroid.mesh || !asteroid.mesh.position || !asteroid.mesh.position.distanceTo) {
                return;
            }

            // Avoid applying force multiple times to the same asteroid
            if (shockwave.affectedAsteroids.has(asteroid)) return;
            
            const distance = asteroid.mesh.position.distanceTo(shockwave.position);

            // Check if the asteroid is within the shockwave radius
            if (distance <= shockwave.currentRadius && distance <= shockwave.maxRadius) {
                // Calculate the push direction (from the epicenter towards the asteroid)
                const forceDirection = new THREE.Vector3()
                    .subVectors(asteroid.mesh.position, shockwave.position)
                    .normalize();

                // Calculate the force intensity (stronger closer to the epicenter)

                let forceIntensity = shockwave.force * (1 - distance / shockwave.maxRadius);

                // BOOST: Minimum force to ensure visible movement
                forceIntensity = Math.max(forceIntensity, shockwave.force * 0.3);

                // BOOST: Extra multiplier for very close asteroids
                if (distance < shockwave.maxRadius * 0.3) {
                    forceIntensity *= 1.2; 
                }
                // Create or update the velocity for the shockwave effect for each asteroid
                if (!asteroid.shockwaveVelocity) {
                    asteroid.shockwaveVelocity = new THREE.Vector3(0, 0, 0);
                }
                
                const force = forceDirection.multiplyScalar(forceIntensity);
                asteroid.shockwaveVelocity.add(force);

                asteroid.shockwaveVelocity.y += (Math.random() - 0.5) * forceIntensity * 0.3;

                if (asteroid.rotationSpeed) {
                    // Increase existing rotation speed

                    if (!asteroid.originalRotationSpeed) {
                        asteroid.originalRotationSpeed = asteroid.rotationSpeed.clone();
                    }
                    asteroid.rotationSpeed.x *= 2;
                    asteroid.rotationSpeed.y *= 2;
                    asteroid.rotationSpeed.z *= 2;

                    // Add random components to make the rotation more chaotic
                    asteroid.rotationSpeed.x += (Math.random() - 0.5) * 0.1;
                    asteroid.rotationSpeed.y += (Math.random() - 0.5) * 0.1;
                    asteroid.rotationSpeed.z += (Math.random() - 0.5) * 0.1;

                    asteroid.rotationResetTimer = 3.0; // 3 seconds before returning to normal
                }

                // Mark the asteroid as already affected by this shockwave
                shockwave.affectedAsteroids.add(asteroid);

            }
        });
    }

    /**
     * Aggiorna tutte le onde d'urto attive
     * @param {number} delta - Tempo trascorso dall'ultimo frame
     * @param {Array} asteroids - Array degli asteroidi attivi
     */
    update(delta, asteroids = []) {
        // Filtra gli asteroidi validi prima di processarli
        const validAsteroids = asteroids.filter(asteroid => 
            asteroid && 
            asteroid.mesh.position && 
            typeof asteroid.mesh.position.distanceTo === 'function'
        );

        // Aggiorna tutte le onde d'urto attive
        for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
            const shockwave = this.activeShockwaves[i];
            shockwave.elapsedTime += delta;
            
            // Calcola il progresso dell'animazione (0-1)
            const progress = Math.min(shockwave.elapsedTime / shockwave.duration, 1);
            
            // Aggiorna il raggio corrente dell'onda
            shockwave.currentRadius = progress * shockwave.maxRadius;
            
            // Aggiorna la scala della mesh visiva
            const scale = progress * shockwave.maxRadius;
            shockwave.mesh.scale.set(scale, scale, scale);
            
            // Aggiorna l'opacità
            const opacity = 1 - progress;
            shockwave.mesh.material.uniforms.opacity.value = opacity;
            shockwave.mesh.material.uniforms.time.value = shockwave.elapsedTime;
            
            // Applica la forza agli asteroidi validi
            this.applyShockwaveForce(validAsteroids, shockwave);
            
            // Rimuovi l'onda d'urto se è completata
            if (progress >= 1) {
                this.scene.remove(shockwave.mesh);
                shockwave.mesh.material.dispose();
                this.activeShockwaves.splice(i, 1);
            }
        }
    }

    /**
     * Pulisce tutte le onde d'urto attive (utile per il game over o restart)
     */
    cleanup() {
        this.activeShockwaves.forEach(shockwave => {
            this.scene.remove(shockwave.mesh);
            shockwave.mesh.material.dispose();
        });
        this.activeShockwaves = [];
        
        if (this.shockwaveMaterial) {
            this.shockwaveMaterial.dispose();
        }
        if (this.shockwaveGeometry) {
            this.shockwaveGeometry.dispose();
        }
    }

    /**
     * Restituisce il numero di onde d'urto attive
     */
    getActiveShockwaveCount() {
        return this.activeShockwaves.length;
    }
}
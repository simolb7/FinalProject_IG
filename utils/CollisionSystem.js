import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

let isShipExploding = false;

export class CollisionSystem {
     constructor() {
        this.collisionDistance = 20; // Distanza minima per collisione (aumentata)
        this.asteroidCollisionDistance = 25;
    }

    // Calcola la distanza tra due oggetti 3D
    calculateDistance(object1, object2) {
        if (!object1 || !object2 || !object1.position || !object2.position) {
            return Infinity;
        }
        
        return object1.position.distanceTo(object2.position);
    }

    // Verifica collisione tra due oggetti
    checkCollision(object1, object2) {
        const distance = this.calculateDistance(object1, object2);
        return distance < this.collisionDistance;
    }

    // Controlla le collisioni tra la navicella e gli astronauti
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

    shrinkAstronaut(astronaut, scene, ship) {
        if (!astronaut || astronaut.shrinking) return;
        
        astronaut.shrinking = true;
        const originalScale = astronaut.scale.clone();
        const startTime = Date.now();
        const duration = 150; // 1 secondo
        
        // Calcola il punto di collisione (punto medio tra astronauta e navicella)
        const collisionPoint = new THREE.Vector3().addVectors(
            astronaut.position,
            ship.position
        ).multiplyScalar(0.5);
        
        // Sposta l'astronauta verso il punto di collisione durante l'animazione
        const originalPosition = astronaut.position.clone();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Riduce la scala
            const scale = originalScale.clone().multiplyScalar(1 - progress);
            astronaut.scale.copy(scale);
            
            // Sposta verso il punto di collisione
            astronaut.position.lerpVectors(originalPosition, collisionPoint, progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(astronaut);
            }
        };
        
        animate();
    }

    checkShipAsteroidCollisions(ship, asteroids) {
        if (!ship || !asteroids) return [];

        const collisions = [];
        
        for (let i = 0; i < asteroids.length; i++) {
            const asteroid = asteroids[i];
            // Gli asteroidi hanno una proprietà mesh che contiene il Group
            const asteroidMesh = asteroid.mesh;
            if (this.checkCollision(ship, asteroidMesh, this.asteroidCollisionDistance)) {
                collisions.push(asteroid);
            }
        }

        return collisions;
    }

    explodeAsteroid(asteroid, scene, ship) {
            if (!asteroid || !asteroid.mesh || asteroid.exploding) return;
            
            asteroid.exploding = true;
            const asteroidMesh = asteroid.mesh;
            const originalScale = asteroidMesh.scale.clone();
            const startTime = Date.now();
            const duration = 800; // Aumentato a 800ms per un'esplosione più visibile
            
            // Calcola il punto di collisione più accurato
            const collisionPoint = new THREE.Vector3().addVectors(
                asteroidMesh.position,
                ship.position
            ).multiplyScalar(0.5);
            
            const originalPosition = asteroidMesh.position.clone();
            
            // Cambia il materiale per effetto esplosione
            const originalMaterial = asteroidMesh.material;
            const explosionMaterial = originalMaterial.clone();
            explosionMaterial.emissive = new THREE.Color(0xff4400);
            asteroidMesh.material = explosionMaterial;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Effetto esplosione migliorato
                let scaleMultiplier;
                let emissiveIntensity;
                
                if (progress < 0.2) {
                    // Prima fase: espansione rapida
                    scaleMultiplier = 1 + (progress / 0.2) * 1.5;
                    emissiveIntensity = progress / 0.2;
                } else if (progress < 0.6) {
                    // Seconda fase: mantenimento
                    scaleMultiplier = 2.5;
                    emissiveIntensity = 1;
                } else {
                    // Terza fase: riduzione e fade
                    const shrinkProgress = (progress - 0.6) / 0.4;
                    scaleMultiplier = 2.5 * (1 - shrinkProgress);
                    emissiveIntensity = 1 - shrinkProgress;
                }
                
                const scale = originalScale.clone().multiplyScalar(scaleMultiplier);
                asteroidMesh.scale.copy(scale);
                
                // Aggiorna colore emissivo
                explosionMaterial.emissive.setRGB(
                    0.8 * emissiveIntensity,
                    0.3 * emissiveIntensity,
                    0.1 * emissiveIntensity
                );
                
                // Rotazione più drammatica
                asteroidMesh.rotation.x += 0.15;
                asteroidMesh.rotation.y += 0.2;
                asteroidMesh.rotation.z += 0.1;
                
                // Movimento verso il punto di collisione
                asteroidMesh.position.lerpVectors(originalPosition, collisionPoint, progress * 0.4);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    scene.remove(asteroidMesh);
                }
            };
            
            animate();
        }


explodeShip(ship, scene) {
    console.log("🟡 explodeShip - INIZIO");

    if (!ship) {
        console.error("❌ Nave non definita");
        return;
    }
    
    if (isShipExploding) {
        console.warn("⚠️ Nave già in esplosione");
        return;
    }

    isShipExploding = true;

     const center = ship.position.clone();
    console.log("📍 Posizione esplosione:", center);

    ship.visible = false;
    console.log("🚫 Nave nascosta");

    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const debugSphere = new THREE.Mesh(geometry, material);
    debugSphere.position.copy(center);
    scene.add(debugSphere);
    console.log("🔴 Sfera rossa aggiunta");

    setTimeout(() => {
        scene.remove(debugSphere);
        console.log("🧹 Sfera rimossa");
    }, 2000);
}

}
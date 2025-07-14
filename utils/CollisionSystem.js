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

        

    explosdeShip(ship, scene) {
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


    // Aggiungi queste funzioni alla tua classe CollisionSystem

}


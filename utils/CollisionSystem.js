import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class CollisionSystem {
     constructor() {
        this.collisionDistance = 20; // Distanza minima per collisione (aumentata)
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
}
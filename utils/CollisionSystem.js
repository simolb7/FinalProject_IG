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
}
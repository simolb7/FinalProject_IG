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

// Classe per interpolazione di valori
class Spline {
    constructor() {
        this.points = [];
    }

    addPoint(t, value, easing = 'linear') {
        this.points.push({ t, value, easing });
        this.points.sort((a, b) => a.t - b.t);
    }

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
        
        return p1.value + (p2.value - p1.value) * easedT;
    }

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

// Classe per interpolazione di colori
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
        
        return p1.color.clone().lerp(p2.color, easedT);
    }

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

// Sistema di particelle avanzato
class ParticleSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.emitters = [];
        this.materials = this.createMaterials();
    }

    createMaterials() {
        const materials = {};
        
        // Materiale per il fuoco/esplosione
        materials.fire = this.createFireMaterial();
        
        // Materiale per il fumo
        materials.smoke = this.createSmokeMaterial();
        
        // Materiale per le scintille
        materials.spark = this.createSparkMaterial();
        
        // Materiale per i detriti
        materials.debris = this.createDebrisMaterial();
        
        return materials;
    }

    createFireMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Crea un cerchio con gradiente per il fuoco
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        return new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            alphaTest: 0.001
        });
    }

    createSmokeMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Crea una texture di fumo più complessa
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        // Aggiungi rumore per rendere il fumo più realistico
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

    createSparkMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Crea una stella per le scintille
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

    createDebrisMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        
        // Crea un piccolo punto per i detriti
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

// Emettitore di particelle migliorato
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
        
        // Parametri specifici per tipo
        this.setupTypeParameters();
        
        // Spline per animazioni
        this.alphaSpline = new Spline();
        this.colorSpline = new ColorSpline();
        this.sizeSpline = new Spline();
        this.velocitySpline = new Spline();
    }

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
                this.spreadRadius = 5;
                break;
                
            case 'smoke':
                this.material = this.particleSystem.materials.smoke;
                this.gravity = new THREE.Vector3(0, 15, 0);
                this.drag = 0.95;
                this.turbulenceStrength = 40;
                this.baseSize = 25;
                this.lifeRange = [3.0, 6.0];
                this.speedRange = [30, 70];
                this.spreadRadius = 8;
                break;
                
            case 'spark':
                this.material = this.particleSystem.materials.spark;
                this.gravity = new THREE.Vector3(0, -200, 0);
                this.drag = 0.98;
                this.turbulenceStrength = 20;
                this.baseSize = 3;
                this.lifeRange = [0.5, 1.5];
                this.speedRange = [150, 300];
                this.spreadRadius = 2;
                break;
                
            case 'debris':
                this.material = this.particleSystem.materials.debris;
                this.gravity = new THREE.Vector3(0, -150, 0);
                this.drag = 0.97;
                this.turbulenceStrength = 10;
                this.baseSize = 8;
                this.lifeRange = [2.0, 4.0];
                this.speedRange = [100, 200];
                this.spreadRadius = 3;
                break;
        }
    }

    addParticles(count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        const life = this.lifeRange[0] + Math.random() * (this.lifeRange[1] - this.lifeRange[0]);
        
        // Posizione casuale NON uniforme - più irregolare
        const randomMethod = Math.random();
        let p;
        
        if (randomMethod < 0.4) {
            // Distribuzione a grumi casuali
            const clusterAngle = Math.random() * Math.PI * 2;
            const clusterRadius = Math.random() * this.spreadRadius * 0.3;
            const scatter = (Math.random() - 0.5) * this.spreadRadius * 0.8;
            
            p = new THREE.Vector3(
                Math.cos(clusterAngle) * clusterRadius + scatter,
                (Math.random() - 0.5) * this.spreadRadius * 0.5,
                Math.sin(clusterAngle) * clusterRadius + scatter
            );
        } else if (randomMethod < 0.7) {
            // Distribuzione più concentrata su un lato
            const bias = Math.random() * 0.6 + 0.4; // Bias verso un lato
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.pow(Math.random(), 1.5) * this.spreadRadius * bias;
            
            p = new THREE.Vector3(
                radius * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -0.3),
                (Math.random() - 0.5) * this.spreadRadius * 0.7,
                radius * Math.sin(angle) * (Math.random() > 0.5 ? 1 : -0.3)
            );
        } else {
            // Distribuzione lineare casuale (come frammenti che volano)
            const direction = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.spreadRadius;
            const height = (Math.random() - 0.5) * this.spreadRadius;
            
            p = new THREE.Vector3(
                Math.cos(direction) * distance,
                height,
                Math.sin(direction) * distance
            );
        }
        
        p.add(this.origin);
        
        // Velocità NON radiale - più caotica
        let direction;
        const velocityStyle = Math.random();
        
        if (velocityStyle < 0.3) {
            // Velocità completamente casuale
            direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize();
        } else if (velocityStyle < 0.6) {
            // Velocità con bias verso l'alto ma casuale
            direction = new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                Math.random() * 0.8 + 0.2,
                (Math.random() - 0.5) * 1.5
            ).normalize();
        } else {
            // Velocità semi-radiale ma con molta variazione
            direction = p.clone().sub(this.origin).normalize();
            if (direction.length() === 0) {
                direction.set(0, 1, 0);
            }
            
            // Aggiungi molta variazione alla direzione
            direction.add(new THREE.Vector3(
                (Math.random() - 0.5) * 1.2,
                (Math.random() - 0.5) * 1.2,
                (Math.random() - 0.5) * 1.2
            )).normalize();
        }
        
        // Velocità molto più variabile
        const speedVariation = Math.random() * 0.8 + 0.2; // 20% - 100% della velocità base
        const speed = (this.speedRange[0] + Math.random() * (this.speedRange[1] - this.speedRange[0])) * speedVariation;
        direction.multiplyScalar(speed);

        // Crea sprite
        const sprite = new THREE.Sprite(this.material.clone());
        sprite.position.copy(p);
        this.particleSystem.scene.add(sprite);

        return {
            sprite: sprite,
            position: p,
            velocity: direction,
            size: (Math.random() * 0.8 + 0.2) * this.baseSize, // Più variazione nella dimensione
            life: life,
            maxLife: life,
            rotation: Math.random() * 2.0 * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 15, // Rotazione più veloce
            active: true
        };
    }

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
            
            // Aggiorna fisica
            particle.velocity.add(this.gravity.clone().multiplyScalar(deltaTime));
            particle.velocity.multiplyScalar(this.drag);
            
            // Turbolenza più intensa e variabile
            const turbulenceIntensity = 1.0 + Math.sin(this.timer * 3) * 0.5; // Turbolenza che varia nel tempo
            const turbulence = new THREE.Vector3(
                (Math.random() - 0.5) * this.turbulenceStrength * turbulenceIntensity,
                (Math.random() - 0.5) * this.turbulenceStrength * turbulenceIntensity,
                (Math.random() - 0.5) * this.turbulenceStrength * turbulenceIntensity
            );
            particle.velocity.add(turbulence.multiplyScalar(deltaTime));
            
            // Aggiorna posizione
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            particle.sprite.position.copy(particle.position);
            
            // Aggiorna rotazione
            particle.rotation += particle.rotationSpeed * deltaTime;
            particle.sprite.material.rotation = particle.rotation;
            
            // Calcola progresso vita
            const lifeProgress = 1.0 - (particle.life / particle.maxLife);
            
            // Applica animazioni dalle spline
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

// Sistema di esplosione principale migliorato
class ShipExplosionSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.particleSystem = new ParticleSystem(scene, camera);
        this.explosions = [];
        this.gameEnded = false;
    }

    createExplosion(position, shipSize = 1.0) {
        if (this.gameEnded) return null;
        
        const explosion = {
            position: position.clone(),
            timer: 0,
            duration: 8.0,
            active: true,
            phase: 0 // 0: iniziale, 1: espansione, 2: fumo
        };

        this.createInitialBlast(position, shipSize);
        this.createFireEmitters(position, shipSize);
        this.createSmokeEmitters(position, shipSize);
        this.createSparkEmitters(position, shipSize);
        this.createDebrisEmitters(position, shipSize);

        this.explosions.push(explosion);
        return explosion;
    }

    createInitialBlast(position, shipSize) {
        // Esplosione iniziale molto rapida e intensa ma più irregolare
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
        emitter.spreadRadius *= shipSize * 1.5; // Spread maggiore per più caos
        emitter.turbulenceStrength *= 1.5; // Più turbolenza
        emitter.addParticles(200); // Meno particelle ma più caotiche
        
        this.particleSystem.addEmitter(emitter);
    }

    createFireEmitters(position, shipSize) {
        // Emettitori di fuoco più sparsi e casuali
        for (let i = 0; i < 6; i++) {
            // Offset più casuali e asimmetrici
            const angle = Math.random() * Math.PI * 2;
            const distance = (Math.random() * 0.7 + 0.3) * 15 * shipSize;
            const height = (Math.random() - 0.5) * 12 * shipSize;
            
            const offset = new THREE.Vector3(
                Math.cos(angle) * distance,
                height,
                Math.sin(angle) * distance
            );
            
            const emitter = new ParticleEmitter(position.clone().add(offset), this.particleSystem, 'fire');
            emitter.delay = Math.random() * 0.8; // Delay più casuali
            
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
            emitter.addParticles(Math.floor(80 + Math.random() * 40)); // Numero variabile di particelle
            
            this.particleSystem.addEmitter(emitter);
        }
    }

    createSmokeEmitters(position, shipSize) {
        // Emettitori di fumo più dispersi
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

    createSparkEmitters(position, shipSize) {
        // Scintille molto più caotiche
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
            emitter.turbulenceStrength *= 2.0; // Molto più turbolenza per le scintille
            emitter.addParticles(Math.floor(50 + Math.random() * 40));
            
            this.particleSystem.addEmitter(emitter);
        }
    }

    createDebrisEmitters(position, shipSize) {
        // Detriti molto più dispersi
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

// Funzioni di utilità migliorate
export function createShipExplosion(scene, camera, shipPosition, ship, shipSize = 1.0) {
    // Crea il sistema se non esiste
    if (!window.explosionSystem) {
        window.explosionSystem = new ShipExplosionSystem(scene, camera);
    }
    
    // Nascondi la navicella
    if (ship) {
        ship.visible = false;
    }
    
    // Crea l'esplosione
    const explosion = window.explosionSystem.createExplosion(shipPosition, shipSize);
    
    return explosion;
}

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


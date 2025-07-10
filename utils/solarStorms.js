import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class SolarStorm {
  constructor(position, baseRadius = 120, spriteCount = 40) {
    this.position = position.clone();
    this.radius = baseRadius;
    this.spriteCount = spriteCount;
    this.visual = this.createVolumetricCloud();
  }

  createVolumetricCloud() {
    const group = new THREE.Group();
    group.position.copy(this.position);

    const texture = new THREE.TextureLoader().load('./assets/models/texture/cloud_particle.png');

    for (let i = 0; i < this.spriteCount; i++) {
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.02 + Math.random() * 0.03,
        color: new THREE.Color(0.4, 0.35, 0.25),
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const sprite = new THREE.Sprite(material);

      const spread = this.radius;
      sprite.position.set(
        (Math.random() - 0.5) * spread * 2,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread * 2
      );

      sprite.scale.setScalar(100 + Math.random() * 150);

      group.add(sprite);
    }

    return group;
  }

  addToScene(scene) {
    scene.add(this.visual);
  }

  isShipInside(ship) {
    return ship.position.distanceTo(this.position) <= this.radius;
  }

  removeFromScene(scene) {
    scene.remove(this.visual);
  }
  update(delta) {
    // Esempio: rotazione lenta dell'intero gruppo
    this.visual.rotation.y += 0.05 * delta;

    // Animazione leggera dei singoli sprite (facoltativa)
    this.visual.children.forEach(sprite => {
        sprite.material.opacity += (Math.random() - 0.5) * 0.005;
        sprite.material.opacity = THREE.MathUtils.clamp(sprite.material.opacity, 0.05, 0.25);
    });
  }
}


export class SolarStormManager {
  constructor(scene, ship, maxStorms = 5) {
    this.scene = scene;
    this.ship = ship;
    this.maxStorms = maxStorms;
    this.storms = [];
    this.spawnInterval = 15;
    this.lastSpawnTime = 0;
  }

  update(delta, timeElapsed) {
    // Crea nuove tempeste
    if (timeElapsed - this.lastSpawnTime >= this.spawnInterval && this.storms.length < this.maxStorms) {
      this.spawnRandomStorm();
      this.lastSpawnTime = timeElapsed;
    }

    // Aggiorna e rimuove quelle vecchie
    this.storms = this.storms.filter(storm => {
      storm.update(delta);
      const age = timeElapsed - storm.spawnTime;
      if (age > 60) {
        this.scene.remove(storm.visual);
        return false;
      }
      return true;
    });
  }

  spawnRandomStorm() {
    const range = 1000;
    const shipPos = this.ship.position;

    const x = shipPos.x + (Math.random() - 0.5) * range;
    const y = shipPos.y + (Math.random() - 0.5) * 200;
    const z = shipPos.z + (Math.random() - 0.5) * range;

    const position = new THREE.Vector3(x, y, z);
    const radius = 80 + Math.random() * 100;
    const density = Math.floor(100 + Math.random() * 100);
    const storm = new SolarStorm(position, radius, density);
    storm.addToScene(this.scene);
    console.log("Tempesta creata a:", position);
    this.storms.push(storm);
  }

  isShipInStorm() {
    return this.storms.some(storm => storm.isShipInside(this.ship));
  }
}

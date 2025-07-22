import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

/**
* Solar storm class that creates volumetric cloud effects using sprite particles.
* This class generates a group of semi-transparent sprites with additive blending
* to simulate a dangerous solar storm cloud. Each storm has a spherical collision
* area and animated visual effects with flickering opacity and rotation.
* 
* @param {THREE.Vector3} position - The world position of the storm center
* @param {number} baseRadius - The radius of the storm's collision sphere
* @param {number} spriteCount - Number of sprite particles to create
*/
export class SolarStorm {
  constructor(position, baseRadius = 120, spriteCount = 40) {
    this.position = position.clone();
    this.radius = baseRadius;
    this.spriteCount = spriteCount;
    this.visual = this.createVolumetricCloud();
  }

  /**
  * Creates a volumetric cloud effect using multiple sprite particles.
  * This function generates a group of semi-transparent sprites positioned
  * randomly within the storm radius. Each sprite uses additive blending
  * and cloud texture to create a realistic volumetric appearance with
  * varying opacity and scale for depth perception.
  * 
  * @returns {THREE.Group} A group containing all storm sprite particles
  */
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
  /**
  * Checks if the spaceship is inside the storm's collision radius.
  * 
  * @param {THREE.Object3D} ship - The spaceship object to check
  * @returns {boolean} True if the ship is within the storm radius
  */
  isShipInside(ship) {
    return ship.position.distanceTo(this.position) <= this.radius;
  }

  removeFromScene(scene) {
    scene.remove(this.visual);
  }
  /**
  * Updates the storm's visual effects each frame.
  * This function handles continuous rotation of the storm cloud and
  * creates flickering opacity effects on individual sprites to simulate
  * the dynamic nature of solar plasma and electromagnetic disturbances.
  * 
  * @param {number} delta - Time elapsed since last frame in seconds
  */
  update(delta) {
    this.visual.rotation.y += 0.05 * delta;

    this.visual.children.forEach(sprite => {
        sprite.material.opacity += (Math.random() - 0.5) * 0.005;
        sprite.material.opacity = THREE.MathUtils.clamp(sprite.material.opacity, 0.05, 0.25);
    });
  }
}

/**
* Solar storm manager class that handles spawning, updating, and lifecycle management.
* This class manages multiple solar storms around the player, spawning new storms
* at regular intervals within a defined area, updating existing storms, and
* removing old storms to maintain performance. Also provides collision detection.
* 
* @param {THREE.Scene} scene - The Three.js scene to manage storms in
* @param {THREE.Object3D} ship - The player's spaceship for position reference
* @param {number} maxStorms - Maximum number of concurrent storms allowed
*/
export class SolarStormManager {
  constructor(scene, ship, maxStorms = 30) {
    this.scene = scene;
    this.ship = ship;
    this.maxStorms = maxStorms;
    this.storms = [];
    this.spawnInterval = 8;
    this.lastSpawnTime = 0;
  }

  /**
  * Updates all storms and manages their lifecycle each frame.
  * This function spawns new storms at regular intervals if under the maximum
  * limit, updates existing storms' visual effects, and removes storms that
  * have exceeded their lifetime (60 seconds). Maintains optimal performance
  * by filtering out expired storms from the active list.
  * 
  * @param {number} delta - Time elapsed since last frame in seconds
  * @param {number} timeElapsed - Total elapsed time since game start
  */
  update(delta, timeElapsed) {

    if (timeElapsed - this.lastSpawnTime >= this.spawnInterval && this.storms.length < this.maxStorms) {
      this.spawnRandomStorm();
      this.lastSpawnTime = timeElapsed;
    }
    
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
  /**
  * Spawns a new solar storm at a random position near the player.
  * This function creates a new storm within a defined range around the
  * spaceship with randomized properties including position, radius, and
  * particle density. The storm is automatically added to the scene and
  * tracked in the active storms array.
  */
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
    console.log("Storm created at:", position);
    this.storms.push(storm);
  }
  /**
  * Checks if the spaceship is currently inside any active storm.
  * This function iterates through all active storms and returns true
  * if the ship is within the collision radius of any storm, useful
  * for gameplay mechanics like damage or visual effects.
  * 
  * @returns {boolean} True if the ship is inside any storm
  */
  isShipInStorm() {
    return this.storms.some(storm => storm.isShipInside(this.ship));
  }
}

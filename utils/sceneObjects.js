import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

let minScale, maxScale;
const mixers = []; 

const fbxLoader = new FBXLoader();


let lastSpawnTime = 0;
let modelTemplate = null; 
let isModelLoaded = false;
let asteroidIdCounter = 0;
let marsObject;

const SPAWN_CONFIG = {
    spawnRadius: {min: 10, max: 30},           
    minDistanceFromPlayer: 200,  
    maxModels: 40,              
    spawnCooldown: 500,        
    despawnDistance: 5000,      
    minDistanceBetweenModels: 230, 
};

export let activeAstronauts = [];
export let activeAsteroids = [];

// ASTEROID FIELD MANAGEMENT
/**
* Updates the asteroid field by removing distant asteroids and spawning new ones
* @param {THREE.Vector3} playerPosition - Current player position in 3D space
* @param {THREE.Vector3} playerDirection - Current player direction vector
* @param {THREE.Scene} scene - Three.js scene object
* @param {Array} models - Array of GLTF models for asteroid variations
* @param {Array<number>} dropRates - Probability distribution for asteroid types
*/
export function updateAsteroidField(playerPosition, playerDirection, scene, models, dropRates, delta) {
  //before 2200, 300
  const spawnRadius = 2200;
  const maxAsteroids = 300;

  activeAsteroids = activeAsteroids.filter(entry => {
    const relativePos = entry.mesh.position.clone().sub(playerPosition);
    const dot = relativePos.dot(playerDirection); 

    const dist = relativePos.length();

    // Filter out asteroids that are behind the player or too far away
    if (dot < -spawnRadius * 0.2 || dist > spawnRadius * 1.1) {
        scene.remove(entry.mesh);
        return false;
    }
    return true;
  });

  // Spawn new asteroids until we reach the maximum count
  while (activeAsteroids.length < maxAsteroids) {
    // Create random asteroid positioned in front of player
    const asteroid = createRandomAsteroidInFront(playerPosition, playerDirection, models, dropRates, spawnRadius);
    scene.add(asteroid.mesh);
    activeAsteroids.push(asteroid);
  }

// Apply continuous rotation using individual rotation speeds
  activeAsteroids.forEach(entry => {
    entry.mesh.rotation.x += entry.rotationSpeed.x;
    entry.mesh.rotation.y += entry.rotationSpeed.y;
    entry.mesh.rotation.z += entry.rotationSpeed.z;

    if (entry.shockwaveVelocity) {
            entry.mesh.position.add(entry.shockwaveVelocity.clone().multiplyScalar(delta));
            // apply friction
            entry.shockwaveVelocity.multiplyScalar(0.99);

            if (entry.shockwaveVelocity.length() < 0.01) {
                delete entry.shockwaveVelocity;
            }
    }

    if (entry.rotationResetTimer !== undefined) {
        entry.rotationResetTimer -= (delta );
        
        if (entry.rotationResetTimer <= 0) {
            //restore original rotation speed
            if (entry.originalRotationSpeed) {
                // Gradual interpolation to original rotation speed
                const resetSpeed = 0.05; 
                
                entry.rotationSpeed.x = THREE.MathUtils.lerp(entry.rotationSpeed.x, entry.originalRotationSpeed.x, resetSpeed);
                entry.rotationSpeed.y = THREE.MathUtils.lerp(entry.rotationSpeed.y, entry.originalRotationSpeed.y, resetSpeed);
                entry.rotationSpeed.z = THREE.MathUtils.lerp(entry.rotationSpeed.z, entry.originalRotationSpeed.z, resetSpeed);
                
                //check if close enough to original speed
                const threshold = 0.001;
                const diffX = Math.abs(entry.rotationSpeed.x - entry.originalRotationSpeed.x);
                const diffY = Math.abs(entry.rotationSpeed.y - entry.originalRotationSpeed.y);
                const diffZ = Math.abs(entry.rotationSpeed.z - entry.originalRotationSpeed.z);
                
                if (diffX < threshold && diffY < threshold && diffZ < threshold) {
                    //reset completed
                    entry.rotationSpeed.copy(entry.originalRotationSpeed);
                    delete entry.rotationResetTimer;
                    delete entry.originalRotationSpeed;
                }
            }
        }
    }
  });

}

/**
* Creates a randomly positioned asteroid in front of the player
* @param {THREE.Vector3} center - Player position as spawn center
* @param {THREE.Vector3} direction - Player direction for forward positioning
* @param {Array} models - Available asteroid models
* @param {Array<number>} dropRates - Spawn probability for each model type
* @param {number} radius - Maximum spawn distance from player
* @returns {Object} Asteroid object with mesh and properties
*/
function createRandomAsteroidInFront(center, direction, models, dropRates, radius,  minDistance = 50) {
  const rand = Math.random();
  let modelIndex = dropRates.findIndex((rate, i, arr) =>
    rand < arr.slice(0, i + 1).reduce((a, b) => a + b)
  );
  if (modelIndex === -1) modelIndex = 0;

  const gltf = models[modelIndex];
  const mesh = gltf.scene.clone(true);

 
  const forward = direction.clone().normalize();
  const distance = Math.max(minDistance, radius * (0.2 + Math.random() * 0.4));
  const offset = forward.multiplyScalar(distance);

 // Add random lateral offset to avoid linear spawning
  const lateral = new THREE.Vector3(
    (Math.random() - 0.5) * radius * 0.5,
    (Math.random() - 0.5) * radius * 0.5,
    (Math.random() - 0.5) * radius * 0.5
  );

  // Combine forward movement and lateral offset for final position
  const finalPos = center.clone().add(offset).add(lateral);
  mesh.position.copy(finalPos);

  // Apply random scale within the defined range for this asteroid type
    if (modelIndex === 0) {
        minScale = 5;
        maxScale = 15;
    } else if (modelIndex === 1) {
        minScale = 0.1;
        maxScale = 0.2;
    } else if (modelIndex === 2) {
        minScale = 0.1;
        maxScale = 0.2;
    } else {
        minScale = 0.0;
        maxScale = 0.5;
    }

    const scale = Math.random() * (maxScale - minScale) + minScale;
    mesh.scale.setScalar(scale);
    mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );

  return {
    id: `asteroid_${asteroidIdCounter++}`,
    mesh,
    rotationSpeed: new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
    ),
    velocity: new THREE.Vector3(0, 0, 0),
  };
}

//MARS BACKGROUND MANAGEMENT

/**
 * Creates a Mars background sphere that follows the camera at a relative distance.
 * This function generates a large sphere with Mars surface texture using NASA imagery,
 * applies realistic material properties with emissive lighting, and sets up
 * continuous rotation animation. The sphere maintains a fixed relative position
 * to the camera to create a distant planet effect.
 * 
 * @param {THREE.Scene} scene - The Three.js scene to add the Mars background to
 * @returns {THREE.Mesh} The Mars sphere mesh object with animation properties
 */
export function createMarsBackground(scene) {
    const marsGeometry = new THREE.SphereGeometry(350, 64, 32);
    
    const textureLoader = new THREE.TextureLoader();
    const marsTexture = textureLoader.load(
        'assets/models/texture/space/8k_mars.jpg',
        (texture) => {
            console.log('Texture Mars NASA caricata con successo');
        },
        undefined,
        (error) => {
            console.log('Errore caricamento texture Mars NASA:', error);
        }
    );
    
    const marsMaterial = new THREE.MeshStandardMaterial({
        map: marsTexture,
        emissive: 0x331100, 
        emissiveIntensity: 0.1,
        roughness: 0.8,
        metalness: 0.1
    });
    
    marsObject = new THREE.Mesh(marsGeometry, marsMaterial);
    
    
    marsObject.userData.relativePosition = new THREE.Vector3(-500, -100, 400);
    
    marsObject.rotation.x = Math.random() * Math.PI;
    marsObject.rotation.y = Math.random() * Math.PI;
    marsObject.rotationSpeed = { x: 0.00000001, y: 0.00000003, z: 0.0000001 };  
    
    scene.add(marsObject);
  
    return marsObject;
}

/**
 * Updates the Mars background sphere position and rotation each frame.
 * This function maintains the Mars sphere at a constant relative position
 * to the camera, creating the illusion of a distant planet that moves
 * with the observer. It also applies continuous slow rotation to simulate
 * planetary motion and add visual interest to the background.
 * 
 * @param {THREE.Mesh} marsObject - The Mars sphere mesh to update
 * @param {THREE.Camera} camera - The active camera to follow
 */
export function updateMarsBackground(marsObject, camera) {
    if (!marsObject || !camera) return;
    
    const relativePos = marsObject.userData.relativePosition;
    marsObject.position.copy(camera.position).add(relativePos);
    
    marsObject.rotation.x += marsObject.rotationSpeed.x;
    marsObject.rotation.y += marsObject.rotationSpeed.y;
    marsObject.rotation.z += marsObject.rotationSpeed.z;
    
}


//ASTRONAUT MODEL MANAGEMENT

/**
* Loads and caches a 3D model template
* @param {string} path - File path to the FBX model
* @returns {Promise<THREE.Object3D>} Promise that resolves to the loaded model
*/
export async function loadModelTemplate(path) {
    if (isModelLoaded) {
        return modelTemplate;
    }

    return new Promise((resolve, reject) => {
        const fbxLoader = new FBXLoader();
        fbxLoader.load(
            path,
            (fbx) => {              
                fbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                modelTemplate = fbx;
                isModelLoaded = true;
                
                resolve(fbx);
            },
            (progress) => {
                console.log(``);
            },
            (error) => {
                console.error('Error during the model loading:', error);
                reject(error);
            }
        );
    });
}

/**
* Creates a deep clone of a 3D model with proper skeleton and animation handling
* @param {THREE.Object3D} original - The original model to clone
* @returns {THREE.Object3D} Deep cloned model with independent skeleton
*/
function cloneModelDeep(original) {
    const cloned = original.clone();
    
    cloned.traverse((child) => {
        if (child.isSkinnedMesh) {
            const bones = [];
            const boneInverses = [];
            
            // Find corresponding bones in the cloned model by name
            child.skeleton.bones.forEach((originalBone, index) => {
                // Maintain bone hierarchy and transformations
                const boneName = originalBone.name;
                const clonedBone = cloned.getObjectByName(boneName);
                
                if (clonedBone) {
                    bones.push(clonedBone);
                    boneInverses.push(child.skeleton.boneInverses[index].clone());
                }
            });
            // Create new skeleton with cloned bones
            if (bones.length > 0) {
                child.skeleton = new THREE.Skeleton(bones, boneInverses);
                child.bind(child.skeleton);
            }
        }
        
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    return cloned;
}

/**
* Initializes the optimized spawn system with model template and configuration
* @param {string} modelPath - Path to the model file
* @param {Object} config - Spawn configuration parameters
* @returns {Promise<THREE.Object3D>} Promise that resolves to the loaded template
*/

export async function initOptimizedSpawn(modelPath, config = {}) {
    Object.assign(SPAWN_CONFIG, config);

    await loadModelTemplate(modelPath);

    return modelTemplate;
}

/**
* Creates astronaut models positioned in front of the player
* @param {THREE.Vector3} center - Player position as spawn center
* @param {THREE.Vector3} direction - Player forward direction
* @param {number|Object} radius - Spawn radius (number or object with max property)
* @returns {THREE.Object3D|null} Created astronaut model or null if creation failed
*/
function createAstronautInFront(center, direction, radius) {
    if (!modelTemplate) {
        console.warn('Template not loaded');
        return null;
    }

    const actualRadius = (typeof radius === 'object') ? radius.max : radius;
    // Calculate spawn position in front of player
    const forward = direction.clone().normalize();
    
    const minDistance = 150;  
    const maxDistance = 300;  
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    
    // Add angular variation to avoid linear spawning
    const angle = (Math.random() - 0.5) * Math.PI * 0.8;
    // Height variation adds vertical spread 
    const height = (Math.random() - 0.5) * 50; 
    
    const rotatedDirection = new THREE.Vector3(
        forward.x * Math.cos(angle) - forward.z * Math.sin(angle),
        forward.y,
        forward.x * Math.sin(angle) + forward.z * Math.cos(angle)
    ).normalize();

    // Calculate final spawn position with forward movement and height offset
    const finalPos = center.clone()
        .add(rotatedDirection.multiplyScalar(distance))
        .add(new THREE.Vector3(0, height, 0));

    // Prevent overlapping spawns checking minimum distance
    const tooClose = activeAstronauts.some(model => {
        const distance = finalPos.distanceTo(model.position);
        return distance < SPAWN_CONFIG.minDistanceBetweenModels;
    });

    if (tooClose) {
        return null;
    }

    try {
        // Create and configure the new astronaut model
        const clonedModel = cloneModelDeep(modelTemplate);
        clonedModel.position.copy(finalPos);
        // Apply random rotation for visual variety
        clonedModel.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        
        const scale = 0.05;
        clonedModel.scale.setScalar(scale);

        // Setup animation system
        if (modelTemplate.animations && modelTemplate.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(clonedModel);
            const clonedAnimations = modelTemplate.animations.map(clip => clip.clone());
            const action = mixer.clipAction(clonedAnimations[0]);
            
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false;

            // Each instance gets independent animation timing
            const randomStart = Math.random() * clonedAnimations[0].duration;
            action.time = randomStart;
            action.play();
            
            clonedModel.mixer = mixer;
            clonedModel.animations = clonedAnimations;
            mixers.push(mixer);
        }
        // Mark model with procedural spawn metadata for tracking
        clonedModel.userData.spawnTime = Date.now();
        clonedModel.userData.isProceduralSpawn = true;

        return clonedModel;

    } catch (error) {
        console.error('Error during the creation of the astronaut model', error);
        return null;
    }
}

/**
* Updates the optimized spawn system by managing astronaut lifecycle
* @param {THREE.Scene} scene - Three.js scene object
* @param {THREE.Vector3} playerPosition - Current player position
* @param {THREE.Vector3} playerDirection - Current player direction
* @param {number} deltaTime - Time elapsed since last frame
*/
export function updateOptimizedSpawn(scene, playerPosition, playerDirection, deltaTime) {
    if (!modelTemplate) {
        console.warn('Template not loaded');
        return;
    }

    const currentTime = Date.now();
    // Remove astronauts that are too far from player
    despawnDistantModels(scene, playerPosition);

    // Spawn new astronaut if conditions are satisfied
    if (shouldSpawn(currentTime) && activeAstronauts.length < SPAWN_CONFIG.maxModels) {
        let newAstronaut = null;
        newAstronaut = createAstronautInFront(
        playerPosition, 
        playerDirection, 
        SPAWN_CONFIG.spawnRadius
        );

        if (newAstronaut) {
            scene.add(newAstronaut);
            activeAstronauts.push(newAstronaut);
            lastSpawnTime = currentTime;
        }
    }
}

/**
* Updates all active animation mixers with the given delta time
* @param {number} delta - Time elapsed since last frame in seconds
*/
export function updateAnimations(delta) {
    // Iterate backwards through mixers array
    for (let i = mixers.length - 1; i >= 0; i--) {
        const mixer = mixers[i];
        // Update valid mixers and remove invalid ones
        if (mixer && mixer.update) {
            mixer.update(delta);
        } else {
            mixers.splice(i, 1);
        }
    }
}

/**
* Determines if a new astronaut should be spawned based on timing and probability
* @param {number} currentTime - Current timestamp in milliseconds
* @returns {boolean} True if spawning conditions are met
*/
function shouldSpawn(currentTime) {
    const cooldownPassed = currentTime - lastSpawnTime > SPAWN_CONFIG.spawnCooldown;
    const randomChance = Math.random() < SPAWN_CONFIG.spawnRate;
    
    return cooldownPassed && randomChance;
}

/**
* Removes astronauts that are too far from the player
* @param {THREE.Scene} scene - Three.js scene object
* @param {THREE.Vector3} playerPosition - Current player position
*/
function despawnDistantModels(scene, playerPosition) {
    const modelsToRemove = [];
    const maxDistance = 600;
    
    // Check distance from player for each active astronaut
    activeAstronauts.forEach((model, index) => {
        const distance = model.position.distanceTo(playerPosition);
         
        if (distance > maxDistance) {
            modelsToRemove.push({ model, index });
            
        }
    });
    
    modelsToRemove.reverse().forEach(({ model, index }) => {
        removeProceduralModel(scene, model, index);
    });
}

/**
* Safely removes a procedural astronaut from the scene and cleans up resources
* @param {THREE.Scene} scene - Three.js scene object
* @param {THREE.Object3D} model - Model to remove
* @param {number} index - Index of the model in the active array
*/
function removeProceduralModel(scene, model, index) {
    // Clean up animation mixer if present
    if (model.mixer) {
        const mixerIndex = mixers.indexOf(model.mixer);
        if (mixerIndex > -1) {
            mixers.splice(mixerIndex, 1);
        }
    }
    
    scene.remove(model);
    
    model.traverse((child) => {
        if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
    });

    activeAstronauts.splice(index, 1);
    
    
}


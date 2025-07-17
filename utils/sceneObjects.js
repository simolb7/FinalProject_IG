import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

let minScale, maxScale;
const mixers = []; 

const fbxLoader = new FBXLoader();


let lastSpawnTime = 0;
let modelTemplate = null; 
let isModelLoaded = false;
let asteroidIdCounter = 0;

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

export function createReferenceObjects(scene) {
  // Cubo di riferimento rosso
  const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(20, 0, 0);
  scene.add(cube);

  // Secondo cubo verde più lontano
  const cube2 = cube.clone();
  cube2.position.set(-30, 15, 50);
  cube2.material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  scene.add(cube2);

  // Griglia di riferimento principale
  const gridHelper = new THREE.GridHelper(100, 10, 0x444444, 0x444444);
  scene.add(gridHelper);

  // Aggiungi più griglie per vedere il movimento
  for (let i = 0; i < 5; i++) {
    const grid = new THREE.GridHelper(50, 5, 0x333333, 0x333333);
    grid.position.z = i * 100 - 200;
    scene.add(grid);
  }

  //createAsteroidField(scene);
  //createSpaceStation(scene);
  //createPlanet(scene);
  

  console.log('Oggetti di riferimento aggiunti');
}

export function updateAsteroidField(playerPosition, playerDirection, scene, models, dropRates) {
  //before 2200, 300
  const spawnRadius = 3000;
  const maxAsteroids = 600;

  activeAsteroids = activeAsteroids.filter(entry => {
    const relativePos = entry.mesh.position.clone().sub(playerPosition);
    const dot = relativePos.dot(playerDirection); 

    const dist = relativePos.length();

    if (dot < -spawnRadius * 0.2 || dist > spawnRadius * 1.1) {
        scene.remove(entry.mesh);
        return false;
    }
    return true;
  });

  while (activeAsteroids.length < maxAsteroids) {
    const asteroid = createRandomAsteroidInFront(playerPosition, playerDirection, models, dropRates, spawnRadius);
    scene.add(asteroid.mesh);
    activeAsteroids.push(asteroid);
  }


  activeAsteroids.forEach(entry => {
    entry.mesh.rotation.x += entry.rotationSpeed.x;
    entry.mesh.rotation.y += entry.rotationSpeed.y;
    entry.mesh.rotation.z += entry.rotationSpeed.z;
  });
}

function createRandomAsteroidInFront(center, direction, models, dropRates, radius) {
  const rand = Math.random();
  let modelIndex = dropRates.findIndex((rate, i, arr) =>
    rand < arr.slice(0, i + 1).reduce((a, b) => a + b)
  );
  if (modelIndex === -1) modelIndex = 0;

  const gltf = models[modelIndex];
  const mesh = gltf.scene.clone(true);

 
  const forward = direction.clone().normalize();
  const distance = radius * (0.2 + Math.random() * 0.4);
  const offset = forward.multiplyScalar(distance);


  const lateral = new THREE.Vector3(
    (Math.random() - 0.5) * radius * 0.5,
    (Math.random() - 0.5) * radius * 0.5,
    (Math.random() - 0.5) * radius * 0.5
  );

  const finalPos = center.clone().add(offset).add(lateral);
  mesh.position.copy(finalPos);

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
    )
  };
}


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
                console.error('Errore nel caricamento del template:', error);
                reject(error);
            }
        );
    });
}

function cloneModelDeep(original) {
    const cloned = original.clone();
    
    cloned.traverse((child) => {
        if (child.isSkinnedMesh) {
            const bones = [];
            const boneInverses = [];
            
            child.skeleton.bones.forEach((originalBone, index) => {
                const boneName = originalBone.name;
                const clonedBone = cloned.getObjectByName(boneName);
                
                if (clonedBone) {
                    bones.push(clonedBone);
                    boneInverses.push(child.skeleton.boneInverses[index].clone());
                }
            });
            
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

export function cloneModel(scene, options = {}) {
    if (!modelTemplate) {
        throw new Error('Template non caricato! Chiama prima loadModelTemplate()');
    }

    const {
        position = new THREE.Vector3(0, 0, 0),
        rotation = new THREE.Vector3(0, 0, 0),
        scale = new THREE.Vector3(0.05, 0.05, 0.05)
    } = options;

    
    
    const clonedModel = cloneModelDeep(modelTemplate);
    
    clonedModel.position.copy(position);
    clonedModel.rotation.setFromVector3(rotation);
    clonedModel.scale.copy(scale);

   

    if (modelTemplate.animations && modelTemplate.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(clonedModel);
        
        const clonedAnimations = modelTemplate.animations.map(clip => clip.clone());
        
        const action = mixer.clipAction(clonedAnimations[0]);
        
        action.setLoop(THREE.LoopRepeat);
        action.clampWhenFinished = false;
        
        const randomStart = Math.random() * clonedAnimations[0].duration;
        action.time = randomStart;
        
        action.play();
        
        clonedModel.mixer = mixer;
        clonedModel.animations = clonedAnimations;
        mixers.push(mixer);
        
        
    } else {
        console.warn('Nessuna animazione disponibile per il clone');
    }

    scene.add(clonedModel);

    
    return clonedModel;
}


export async function initOptimizedSpawn(modelPath, config = {}) {
    Object.assign(SPAWN_CONFIG, config);

    await loadModelTemplate(modelPath);

    return modelTemplate;
}

function createAstronautInFront(center, direction, radius) {
    if (!modelTemplate) {
        console.warn('Template non caricato');
        return null;
    }

    const actualRadius = (typeof radius === 'object') ? radius.max : radius;

   const forward = direction.clone().normalize();
    
   const minDistance = 150;  
    const maxDistance = 300;  
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    
    const angle = (Math.random() - 0.5) * Math.PI * 0.8; 
    const height = (Math.random() - 0.5) * 50; 
    
    const rotatedDirection = new THREE.Vector3(
        forward.x * Math.cos(angle) - forward.z * Math.sin(angle),
        forward.y,
        forward.x * Math.sin(angle) + forward.z * Math.cos(angle)
    ).normalize();
    
    const finalPos = center.clone()
        .add(rotatedDirection.multiplyScalar(distance))
        .add(new THREE.Vector3(0, height, 0));

    const tooClose = activeAstronauts.some(model => {
        const distance = finalPos.distanceTo(model.position);
        return distance < SPAWN_CONFIG.minDistanceBetweenModels;
    });

    if (tooClose) {
        return null;
    }

    try {
        const clonedModel = cloneModelDeep(modelTemplate);
        clonedModel.position.copy(finalPos);
        clonedModel.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        
        const scale = 0.05;
        clonedModel.scale.setScalar(scale);

        if (modelTemplate.animations && modelTemplate.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(clonedModel);
            const clonedAnimations = modelTemplate.animations.map(clip => clip.clone());
            const action = mixer.clipAction(clonedAnimations[0]);
            
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false;
            
            const randomStart = Math.random() * clonedAnimations[0].duration;
            action.time = randomStart;
            action.play();
            
            clonedModel.mixer = mixer;
            clonedModel.animations = clonedAnimations;
            mixers.push(mixer);
        }

        clonedModel.userData.spawnTime = Date.now();
        clonedModel.userData.isProceduralSpawn = true;

        return clonedModel;

    } catch (error) {
        console.error('Errore nella creazione dell\'astronauta:', error);
        return null;
    }
}


export function updateOptimizedSpawn(scene, playerPosition, playerDirection, deltaTime) {
    if (!modelTemplate) {
        console.warn('Template non caricato, skip spawn');
        return;
    }

    const currentTime = Date.now();
    
   despawnDistantModels(scene, playerPosition);
    
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

export function updateAnimations(delta) {
    for (let i = mixers.length - 1; i >= 0; i--) {
        const mixer = mixers[i];
        if (mixer && mixer.update) {
            mixer.update(delta);
        } else {
            mixers.splice(i, 1);
        }
    }
}

function shouldSpawn(currentTime) {
    const cooldownPassed = currentTime - lastSpawnTime > SPAWN_CONFIG.spawnCooldown;
    const randomChance = Math.random() < SPAWN_CONFIG.spawnRate;
    
    return cooldownPassed && randomChance;
}

function despawnDistantModels(scene, playerPosition) {
   
    
    const modelsToRemove = [];
    const maxDistance = 600;
    
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

function removeProceduralModel(scene, model, index) {

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


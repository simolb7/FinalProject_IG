import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

let minScale, maxScale;
const mixers = []; // Array per tenere traccia di tutti i mixer attivi

const fbxLoader = new FBXLoader();

const activeModels = [];
let lastSpawnTime = 0;
let modelTemplate = null; // Il modello template caricato una sola volta
let isModelLoaded = false;

const SPAWN_CONFIG = {
    maxModels: 12,                    // Mantenuto per non sovraffollare
    spawnRadius: { min: 100, max: 1000 }, // Area molto grande mantenuta
    despawnDistance: 1200,            // Aumentato per essere coerente con spawnRadius max
    spawnCooldown: 5000,              // Ridotto leggermente per avere più opportunità di raccolta
    spawnRate: 0.05,                  // Aumentato leggermente per compensare la distribuzione più ampia
    preferredDirection: false,        // DISATTIVATO per spawn completamente casuale
    directionBias: 0.0,               // Azzerato per eliminare qualsiasi bias direzionale
    fullCircleSpawn: true,            // Abilita spawn a 360 gradi
    minDistanceBetweenModels: 2000      // Distanza minima tra modelli per evitare cluster
};
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
  const spawnRadius = 2200;
  const maxAsteroids = 300;


  // Rimuovi quelli troppo lontani
  activeAsteroids = activeAsteroids.filter(entry => {
    const relativePos = entry.mesh.position.clone().sub(playerPosition);
    const dot = relativePos.dot(playerDirection); // positivo = davanti, negativo = dietro

    const dist = relativePos.length();

    if (dot < -spawnRadius * 0.2 || dist > spawnRadius * 1.1) {
    // se troppo indietro o troppo lontano
    scene.remove(entry.mesh);
    return false;
    }
    return true;
  });

  // Genera nuovi asteroidi davanti alla navicella
  while (activeAsteroids.length < maxAsteroids) {
    const asteroid = createRandomAsteroidInFront(playerPosition, playerDirection, models, dropRates, spawnRadius);
    scene.add(asteroid.mesh);
    activeAsteroids.push(asteroid);
  }

  // Rotazione
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

  // Genera una posizione random davanti al player
  const forward = direction.clone().normalize();
  const distance = radius * (0.2 + Math.random() * 0.4); // da 50% a 100% del raggio
  const offset = forward.multiplyScalar(distance);

  // Aggiungi una dispersione laterale
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
    // fallback di sicurezza
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
        console.log('Template già caricato');
        return modelTemplate;
    }

    return new Promise((resolve, reject) => {
        const fbxLoader = new FBXLoader();
        fbxLoader.load(
            path,
            (fbx) => {
                // Configura ombre sul template
                fbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // NON aggiungere il template alla scena
                modelTemplate = fbx;
                isModelLoaded = true;
                
                console.log(`Template modello caricato: ${path}`);
                console.log(`Animazioni disponibili: ${fbx.animations?.length || 0}`);
                
                if (fbx.animations && fbx.animations.length > 0) {
                    console.log(`Prima animazione: ${fbx.animations[0].name}`);
                    console.log(`Durata: ${fbx.animations[0].duration}s`);
                }
                
                resolve(fbx);
            },
            (progress) => {
                console.log(`Caricamento template: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`);
            },
            (error) => {
                console.error('Errore nel caricamento del template:', error);
                reject(error);
            }
        );
    });
}


function cloneModelDeep(original) {
    // Usa il metodo clone nativo di Three.js che gestisce correttamente skeletal mesh
    const cloned = original.clone();
    
    // Ricrea il skeleton se presente
    cloned.traverse((child) => {
        if (child.isSkinnedMesh) {
            // Per SkinnedMesh, dobbiamo ricreare il skeleton
            const bones = [];
            const boneInverses = [];
            
            // Trova le bone nell'oggetto clonato
            child.skeleton.bones.forEach((originalBone, index) => {
                const boneName = originalBone.name;
                const clonedBone = cloned.getObjectByName(boneName);
                
                if (clonedBone) {
                    bones.push(clonedBone);
                    boneInverses.push(child.skeleton.boneInverses[index].clone());
                }
            });
            
            // Crea il nuovo skeleton
            if (bones.length > 0) {
                child.skeleton = new THREE.Skeleton(bones, boneInverses);
                child.bind(child.skeleton);
            }
        }
        
        // Assicurati che le proprietà di shadowing siano copiate
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

    console.log('Clonando modello...');
    
    // Usa la clonazione profonda corretta
    const clonedModel = cloneModelDeep(modelTemplate);
    
    // Applica trasformazioni
    clonedModel.position.copy(position);
    clonedModel.rotation.setFromVector3(rotation);
    clonedModel.scale.copy(scale);

    console.log('Modello clonato, configurando animazioni...');

    // Configura le animazioni per il clone
    if (modelTemplate.animations && modelTemplate.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(clonedModel);
        
        // Clona le animazioni per il nuovo modello
        const clonedAnimations = modelTemplate.animations.map(clip => clip.clone());
        
        // Usa la prima animazione clonata
        const action = mixer.clipAction(clonedAnimations[0]);
        
        // Configura l'animazione
        action.setLoop(THREE.LoopRepeat);
        action.clampWhenFinished = false;
        
        // Randomizza il tempo di inizio per varietà
        const randomStart = Math.random() * clonedAnimations[0].duration;
        action.time = randomStart;
        
        action.play();
        
        // Salva il mixer e le animazioni nel modello
        clonedModel.mixer = mixer;
        clonedModel.animations = clonedAnimations;
        mixers.push(mixer);
        
        console.log(`Clone creato con animazione. Mixer totali: ${mixers.length}`);
    } else {
        console.warn('Nessuna animazione disponibile per il clone');
    }

    // Aggiungi alla scena
    scene.add(clonedModel);
    
    console.log('Clone aggiunto alla scena');
    
    return clonedModel;
}


export async function initOptimizedSpawn(modelPath, config = {}) {
    Object.assign(SPAWN_CONFIG, config);
    
    console.log('Inizializzando sistema di spawn ottimizzato...');
    
    // Carica il template una sola volta
    await loadModelTemplate(modelPath);
    
    console.log('Sistema di spawn ottimizzato inizializzato');
    
    // Test: spawna un modello per verificare che funzioni
    console.log('Test di spawn iniziale...');
    
    return modelTemplate;
}

export function updateOptimizedSpawn(scene, playerPosition, playerDirection, deltaTime) {
    if (!modelTemplate) {
        console.warn('Template non caricato, skip spawn');
        return;
    }

    const currentTime = Date.now();
    
    // Rimuovi modelli troppo lontani
    despawnDistantModels(scene, playerPosition);
    
    // Controlla se possiamo spawnare nuovi modelli
    if (shouldSpawn(currentTime) && activeModels.length < SPAWN_CONFIG.maxModels) {
        const spawnPosition = calculateSpawnPosition(playerPosition, playerDirection);
        
        if (spawnPosition && isValidSpawnPosition(spawnPosition, playerPosition)) {
            console.log(`Spawnando clone in posizione: ${spawnPosition.x.toFixed(2)}, ${spawnPosition.y.toFixed(2)}, ${spawnPosition.z.toFixed(2)}`);
            spawnClonedModel(scene, spawnPosition);
            lastSpawnTime = currentTime;
        }
    }
}

function spawnClonedModel(scene, spawnPosition) {
    try {
        const clonedModel = cloneModel(scene, {
            position: spawnPosition,
            rotation: new THREE.Vector3(0, Math.random() * Math.PI * 2, 0),
            scale: new THREE.Vector3(0.05, 0.05, 0.05)
        });
        
        // Aggiungi metadati
        clonedModel.userData.spawnTime = Date.now();
        clonedModel.userData.isProceduralSpawn = true;
        
        activeModels.push(clonedModel);
        
        console.log(`Clone spawnato. Totale attivi: ${activeModels.length}`);
    } catch (error) {
        console.error('Errore nello spawn del clone:', error);
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



function calculateSpawnPosition(playerPosition, playerDirection) {
    // Genera un angolo completamente casuale (0-360 gradi)
    const randomAngle = Math.random() * Math.PI * 2;
    
    // Genera una distanza casuale nel range specificato
    const minRadius = SPAWN_CONFIG.spawnRadius.min;
    const maxRadius = SPAWN_CONFIG.spawnRadius.max;
    const randomDistance = minRadius + Math.random() * (maxRadius - minRadius);
    
    // Calcola la posizione basata su angolo e distanza casuali
    const spawnPosition = new THREE.Vector3(
        playerPosition.x + Math.cos(randomAngle) * randomDistance,
        playerPosition.y, // Mantieni l'altezza del giocatore
        playerPosition.z + Math.sin(randomAngle) * randomDistance
    );
    
    // Verifica che non sia troppo vicino ad altri modelli esistenti
    if (SPAWN_CONFIG.minDistanceBetweenModels) {
        const tooClose = activeModels.some(model => {
            const distance = spawnPosition.distanceTo(model.position);
            return distance < SPAWN_CONFIG.minDistanceBetweenModels;
        });
        
        if (tooClose) {
            // Ritenta con una nuova posizione (max 3 tentativi)
            for (let i = 0; i < 3; i++) {
                const newAngle = Math.random() * Math.PI * 2;
                const newDistance = minRadius + Math.random() * (maxRadius - minRadius);
                
                spawnPosition.set(
                    playerPosition.x + Math.cos(newAngle) * newDistance,
                    playerPosition.y,
                    playerPosition.z + Math.sin(newAngle) * newDistance
                );
                
                const stillTooClose = activeModels.some(model => {
                    const distance = spawnPosition.distanceTo(model.position);
                    return distance < SPAWN_CONFIG.minDistanceBetweenModels;
                });
                
                if (!stillTooClose) break;
            }
        }
    }
    
    return spawnPosition;
}

function shouldSpawn(currentTime) {
    const cooldownPassed = currentTime - lastSpawnTime > SPAWN_CONFIG.spawnCooldown;
    const randomChance = Math.random() < SPAWN_CONFIG.spawnRate;
    
    return cooldownPassed && randomChance;
}

function isValidSpawnPosition(spawnPosition, playerPosition) {
    const distance = spawnPosition.distanceTo(playerPosition);
    
    // Controlla distanza minima e massima
    if (distance < SPAWN_CONFIG.spawnRadius.min || distance > SPAWN_CONFIG.spawnRadius.max) {
        return false;
    }
    
    // Controlla se c'è già un modello troppo vicino
    const minDistanceBetweenModels = 5;
    for (const model of activeModels) {
        if (model.position.distanceTo(spawnPosition) < minDistanceBetweenModels) {
            return false;
        }
    }
    
    return true;
}

function despawnDistantModels(scene, playerPosition) {
    const modelsToRemove = [];
    
    activeModels.forEach((model, index) => {
        const distance = model.position.distanceTo(playerPosition);
        
        if (distance > SPAWN_CONFIG.despawnDistance) {
            modelsToRemove.push({ model, index });
        }
    });
    
    // Rimuovi i modelli distanti
    modelsToRemove.reverse().forEach(({ model, index }) => {
        removeProceduralModel(scene, model, index);
    });
}

function removeProceduralModel(scene, model, index) {
    // Rimuovi il mixer dalle animazioni
    if (model.mixer) {
        const mixerIndex = mixers.indexOf(model.mixer);
        if (mixerIndex > -1) {
            mixers.splice(mixerIndex, 1);
        }
    }
    
    // Rimuovi dalla scena
    scene.remove(model);
    
    // Pulisci le risorse
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
    
    // Rimuovi dall'array
    activeModels.splice(index, 1);
    
    console.log(`Modello rimosso (troppo lontano). Totale attivi: ${activeModels.length}`);
}


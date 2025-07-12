import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

let minScale, maxScale;
const mixers = []; // Array per tenere traccia di tutti i mixer attivi
let activeAstronauts = [];
const fbxLoader = new FBXLoader();


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


export function loadFBXModel(path, scene, options = {}) {
    const {
        position = new THREE.Vector3(0, 0, 0),
        rotation = new THREE.Vector3(0, 0, 0),
        scale = new THREE.Vector3(0.08, 0.08, 0.08)
    } = options;

    return new Promise((resolve, reject) => {
        fbxLoader.load(
            path,
            (fbx) => {
                // Applica trasformazioni
                fbx.position.copy(position);
                fbx.rotation.setFromVector3(rotation);
                fbx.scale.copy(scale);

                // Configura ombre
                fbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Gestione animazioni da Mixamo
                if (fbx.animations && fbx.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(fbx);
                    
                    // Prende la prima animazione (di solito c'è solo quella da Mixamo)
                    const action = mixer.clipAction(fbx.animations[0]);
                    
                    // Configura l'animazione per loop infinito
                    action.setLoop(THREE.LoopRepeat);
                    action.clampWhenFinished = false;
                    
                    // Avvia l'animazione immediatamente
                    action.play();
                    
                    // Salva il mixer per gli aggiornamenti
                    fbx.mixer = mixer;
                    mixers.push(mixer);
                    
                    console.log(`Animazione avviata per il modello: ${fbx.animations[0].name}`);
                }

                // Aggiunge alla scena
                scene.add(fbx);

                console.log(`Modello FBX caricato: ${path}`);
                resolve(fbx);
            },
            (progress) => {
                console.log(`Caricamento: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`);
            },
            (error) => {
                console.error('Errore nel caricamento del modello FBX:', error);
                reject(error);
            }
        );
    });
}

/**
 * Spawna un modello FBX in una posizione specifica
 * @param {string} path - Percorso del file FBX
 * @param {THREE.Scene} scene - Scena dove spawnare il modello
 * @param {THREE.Vector3} spawnPosition - Posizione di spawn
 * @param {Object} additionalOptions - Opzioni aggiuntive
 * @returns {Promise} Promise che si risolve con il modello spawnato
 */
export function spawnFBXModel(path, scene, spawnPosition, additionalOptions = {}) {
    const options = {
        position: spawnPosition,
        ...additionalOptions
    };

    return loadFBXModel(path, scene, options);
}

/**
 * Aggiorna tutte le animazioni attive
 * Chiamala nel loop di rendering del main
 * @param {number} delta - Tempo delta per l'aggiornamento
 */
export function updateAnimations(delta) {
    mixers.forEach(mixer => {
        mixer.update(delta);
    });
}
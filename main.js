import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { ShipController } from './utils/ShipController.js';
import { CameraController } from './utils/CameraController.js';
import { createStarfield } from './utils/starfield.js';
import { createReferenceObjects, updateAsteroidField  } from './utils/sceneObjects.js';
import { DebugHUD } from './utils/debugHUD.js';
import { GameTimer } from './utils/GameTimer.js';
import { SolarStormManager } from './utils/solarStorms.js';
import { GameHUD } from './utils/gameHUD.js';
import { Thruster } from './utils/Thruster.js';


let scene, camera, renderer, ship, starfield, timer, stormManager;;
let shipController, cameraController, debugHUD, gameHUD;
let thrusterL, thrusterR;
let mainLight, fillLight, keyLight, ambientLight;

const keys = {};
let gameOver = false;
const modelPaths = [
  'assets/models/asteroid1.glb',
  'assets/models/asteroid2.glb',
  'assets/models/asteroid3.glb'
];
const dropRates = [0.4, 0.4, 0.2]; // somma = 1.0
const playerDirection = new THREE.Vector3(); 
let asteroidModels = []; // array globale per tenere i modelli caricati

init()

animate();


async function init() {
  // Setup base Three.js
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Crea starfield
  starfield = await createStarfield(scene);

  // Illuminazione
  setupDynamicLighting();
  // Carica modello navicella
  const { ship: loadedShip, thrusterL, thrusterR } = await loadSpaceship();
  ship = loadedShip;
  await loadAsteroidModels();

  // Aggiungi oggetti di riferimento
  createReferenceObjects(scene);
  stormManager = new SolarStormManager(scene, ship);

  // Setup controllers
  shipController = new ShipController(ship, keys);
  cameraController = new CameraController(camera, ship);
  //debugHUD = new DebugHUD();
  gameHUD = new GameHUD();

  // Event listeners
  setupEventListeners();

  console.log('Inizializzazione completata');
  timer = new GameTimer(62);
  timer.start();
}

async function loadSpaceship() {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load('./assets/models/spaceship.glb', (gltf) => {
      
      ship = gltf.scene; 
      ship.scale.set(1.25, 1.25, 1.25);
      ship.position.set(0, 0, 0);
      scene.add(ship); 

      thrusterL = new Thruster(ship, { position: new THREE.Vector3(-4, 1, -8) });
      thrusterR = new Thruster(ship, { position: new THREE.Vector3(4, 1, -8) });

      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(ship);
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        animate.mixers = [mixer];
      }

      console.log('Navicella caricata alla posizione:', ship.position);
      resolve({ ship });
    }, undefined, reject);
  });
}


async function loadAsteroidModels() {
  const loader = new GLTFLoader();
  asteroidModels = await Promise.all(
    modelPaths.map(path => loader.loadAsync(path))
  );
}

function setupDynamicLighting() {
  // 1. Luce ambientale per illuminazione generale
  ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Luce soffusa
  scene.add(ambientLight);

  // 2. Luce principale (Key Light) - segue la nave
  keyLight = new THREE.DirectionalLight(0xfff8dc, 1.5);
  keyLight.position.set(-30, 10, 20);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  scene.add(keyLight);

  // 3. Luce di riempimento (Fill Light) - illumina le ombre
  fillLight = new THREE.DirectionalLight(0x4444ff, 0.3);
  fillLight.position.set(30, 0, 5);
  scene.add(fillLight);

  // 4. Luce principale mobile che segue la nave
  mainLight = new THREE.PointLight(0xffffff, 1.5, 100);
  mainLight.position.set(0, 5, 5);
  scene.add(mainLight);

}

// === AGGIORNAMENTO ILLUMINAZIONE DINAMICA ===
function updateDynamicLighting() {
  if (!ship) return;

  const shipPosition = ship.position;
  const cameraPosition = camera.position;
  
  // Aggiorna posizione luce principale - sempre tra camera e nave
  const lightOffset = new THREE.Vector3()
    .subVectors(cameraPosition, shipPosition)
    .normalize()
    .multiplyScalar(15);
  
  mainLight.position.copy(shipPosition).add(lightOffset);

  // Aggiorna Key Light - sempre davanti alla nave dalla prospettiva della camera
  const keyLightPosition = new THREE.Vector3()
    .subVectors(cameraPosition, shipPosition)
    .normalize()
    .multiplyScalar(20);
  keyLightPosition.y += 10; // Leggermente sopra
  
  keyLight.position.copy(shipPosition).add(keyLightPosition);
  keyLight.lookAt(shipPosition);

  // Aggiorna Fill Light - dal lato opposto
  const fillLightPosition = new THREE.Vector3()
    .subVectors(shipPosition, cameraPosition)
    .normalize()
    .multiplyScalar(15);
  fillLightPosition.y -= 5; // Leggermente sotto
  
  fillLight.position.copy(shipPosition).add(fillLightPosition);
  fillLight.lookAt(shipPosition);

  // Intensità dinamica basata sulla velocità
  const velocity = shipController.getVelocity();
  const speed = velocity.length();
  const speedMultiplier = 1 + (speed * 0.1);
  
  mainLight.intensity = 1.5 * speedMultiplier;
  keyLight.intensity = 1.2 * speedMultiplier;
}

function setupEventListeners() {
  window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
  requestAnimationFrame(animate);

  if (!ship) return;

  const delta = (time - (animate.prevTime || time)) / 1400;
  animate.prevTime = time;


  const timeElapsed = performance.now() / 1000; // tempo in secondi
  

  // Aggiorna tempeste
  if (stormManager) {
    stormManager.update(delta, timeElapsed);

    const inStorm = stormManager.isShipInStorm();
    shipController.setSpeedMultiplier(inStorm ? 0.85 : 1.0);
  }

  shipController.update(delta);

  if (thrusterL && thrusterR) {
   
    const velocity = shipController.getVelocity(); 
    
    thrusterL.setDirection(velocity);
    thrusterR.setDirection(velocity);
    thrusterL.update(delta);
    thrusterR.update(delta);
  }

  cameraController.update(delta);

  updateDynamicLighting();

  // Aggiorna starfield
  if (starfield) {
    starfield.position.copy(camera.position);
    starfield.rotation.y += 0.0001;
  }

  // Aggiorna debug HUD
  //debugHUD.update(ship, camera, shipController.getSpeed(), delta, keys);

  // Aggiorna animazioni se presenti
  if (animate.mixers) {
    animate.mixers.forEach((m) => m.update(delta));
  }

  ship.getWorldDirection(playerDirection);

  // Asteroidi dinamici
  updateAsteroidField(ship.position, playerDirection, scene, asteroidModels, dropRates);

  const secondsLeft = timer.getRemainingTime();
  //debugHUD.setTimer(secondsLeft);
  gameHUD.updateTimer(secondsLeft); // <-- AGGIORNAMENTO HUD

  if (timer.isExpired()) {
    endGame(); // TODO: implementa endGame
  }


  // Render finale
  renderer.render(scene, camera);
}

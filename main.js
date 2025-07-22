import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { ShipController } from './utils/ShipController.js';
import { CameraController } from './utils/CameraController.js';
import { createStarfield} from './utils/starfield.js';
import { GameTimer } from './utils/GameTimer.js';
import { SolarStormManager } from './utils/solarStorms.js';
import { GameHUD } from './utils/gameHUD.js';
import { Thruster } from './utils/Thruster.js';
import { updateAsteroidField, initOptimizedSpawn, updateOptimizedSpawn, updateAnimations, activeAstronauts, activeAsteroids, createMarsBackground, updateMarsBackground} from './utils/sceneObjects.js';
import { CollisionSystem, createShipExplosion, updateExplosions, destroyExplosionSystem, setExplosionGameEnded } from './utils/CollisionSystem.js';
import { StartScreen } from './utils/startScreen.js';
import { ShockwaveSystem } from './utils/shockwave.js';


let scene, camera, renderer, ship, starfield, timer, stormManager;;
let shipController, cameraController, debugHUD, gameHUD;
let thrusterL, thrusterR;
let mainLight, fillLight, keyLight, ambientLight;

let startScreen;
let gameState = 'START';
let gameInitialized = false;
const dropRates = [0.4, 0.4, 0.2]; 
const playerDirection = new THREE.Vector3(); 
let asteroidModels = []; 
const collisionSystem = new CollisionSystem();
let mars
let score = 0;
const keys = {};
let gameOver = false;
const modelPaths = [
  'assets/models/asteroid1.glb',
  'assets/models/asteroid2.glb',
  'assets/models/asteroid3.glb'
];
let shockwaveSystem;
let shockwaveLastUsed = 0;
const SHOCKWAVE_COOLDOWN = 30000; 


init()
animate();


async function init() {
  
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  starfield = await createStarfield(scene);

  mars = await createMarsBackground(scene);
  setupDynamicLighting();
  const { ship: loadedShip, thrusterL, thrusterR } = await loadSpaceship();
  ship = loadedShip;
  await loadAsteroidModels();

  //load the astronaut model and set the settings for the spawn system
  await initOptimizedSpawn('./assets/models/Falling.fbx', {
            maxModels: 30,
            spawnRadius: { min: 15, max: 60 },
            despawnDistance: 120,
            spawnCooldown: 1500,
            spawnRate: 0.15
        });

  stormManager = new SolarStormManager(scene, ship);
  shockwaveSystem = new ShockwaveSystem(scene); //shockwave system initialization

  shipController = new ShipController(ship, keys);
  cameraController = new CameraController(camera, ship);

  gameHUD = new GameHUD();
  window.gameHUD = gameHUD;

  timer = new GameTimer(62);
  setupEventListeners();

  console.log('Inizialization completed');

  if (checkIfRestart()) {
    startGame();
  } else {
    startScreen = new StartScreen();
    startScreen.show(startGame);
  }
  gameInitialized = true;
}

function checkIfRestart() {
  const isRestart = sessionStorage.getItem('gameRestart') === 'true';
  
  if (isRestart) {
    sessionStorage.removeItem('gameRestart');
    return true;
  }
  
  return false;
}

function startGame() {
  console.log('Loading game');
  gameState = 'PLAYING';

  timer.start();
  
  gameHUD.show();
}


/**
 * Asynchronously loads the spaceship 3D model and sets up its components.
 * This function uses GLTFLoader to load a .glb model file, scales and positions
 * the ship in the scene, creates left and right thruster effects with particle
 * systems, and initializes the animation (thruster flame animations).
 *  
 * @returns {Promise<{ship: THREE.Group}>} A promise that resolves with the loaded ship object
 */
async function loadSpaceship() {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load('./assets/models/spaceship.glb', (gltf) => {
      
      ship = gltf.scene; 
      ship.scale.set(1.7, 1.7, 1.7);
      ship.position.set(0, 0, 0);
      scene.add(ship); 

      thrusterL = new Thruster(ship, { position: new THREE.Vector3(-4, 1, -7) });
      thrusterR = new Thruster(ship, { position: new THREE.Vector3(4, 1, -7) });

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

/**
* Asynchronously loads all asteroid 3D models from predefined paths.
* This function uses GLTFLoader to load multiple asteroid models concurrently
* using Promise.all, ensuring all models are loaded before proceeding.
* The loaded models are stored in the asteroidModels array for later use
* in asteroid field generation and instantiation.
* 
* @returns {Promise<void>} A promise that resolves when all asteroid models are loaded
*/
async function loadAsteroidModels() {
  const loader = new GLTFLoader();
  asteroidModels = await Promise.all(
    modelPaths.map(path => loader.loadAsync(path))
  );
}

/**
* Sets up a dynamic three-point lighting system for the spaceship scene.
* This function creates a professional lighting setup with ambient, key, fill,
* and main lights. The key light casts shadows for realism, while the fill
* light softens harsh shadows. The main point light provides localized
* illumination that will follow the ship during gameplay.

 * AmbientLight, general ambient light for the scene
 * KeyLight, main light
 * FillLight, ambient light, fill the shadow created by the key light
 * MainLight, point light that follows the ship
*/
function setupDynamicLighting() {
  // 1. Ambient light for general illumination
  ambientLight = new THREE.AmbientLight(0x404040, 2.5); 
  scene.add(ambientLight);

  // 2. Main light
  keyLight = new THREE.DirectionalLight(0xfff8dc, 4);
  keyLight.position.set(-30, 10, 20);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  scene.add(keyLight);

  // 3. Shadow light
  fillLight = new THREE.DirectionalLight(0xfff8dc , 2  );
  fillLight.position.set(30, 0, 5);
  scene.add(fillLight);

  // 4. Main mobile light that follows the ship
  mainLight = new THREE.PointLight(0xffffff, 3 , 100);
  mainLight.position.set(0, 5, 5);
  scene.add(mainLight);

}

/**
* Updates the dynamic lighting system to follow the spaceship movement.
* This function repositions the key, fill, and main lights relative to the
* ship's position and camera angle, creating cinematic lighting that enhances
* the ship's visibility. Light intensity also increases
* based on ship velocity to emphasize speed and movement.
 */
function updateDynamicLighting() {
  if (!ship) return;

  const shipPosition = ship.position;
  const cameraPosition = camera.position;
  
  const lightOffset = new THREE.Vector3()
    .subVectors(cameraPosition, shipPosition)
    .normalize()
    .multiplyScalar(15);
  
  mainLight.position.copy(shipPosition).add(lightOffset);

  const keyLightPosition = new THREE.Vector3()
    .subVectors(cameraPosition, shipPosition)
    .normalize()
    .multiplyScalar(20);
  keyLightPosition.y += 10;

  keyLight.position.copy(shipPosition).add(keyLightPosition);
  keyLight.lookAt(shipPosition);

  const fillLightPosition = new THREE.Vector3()
    .subVectors(shipPosition, cameraPosition)
    .normalize()
    .multiplyScalar(15);
  fillLightPosition.y -= 5; 
  
  fillLight.position.copy(shipPosition).add(fillLightPosition);
  fillLight.lookAt(shipPosition);

  const velocity = shipController.getVelocity();
  const speed = velocity.length();
  const speedMultiplier = 1 + (speed * 0.1);
  
  mainLight.intensity = 1.5 * speedMultiplier;
  keyLight.intensity = 1.2 * speedMultiplier;
}


function setupEventListeners() {
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    //shockwave
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault(); 
      triggerShockwave(); 
    }
  });
  
  window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function restartGame() {
  console.log('Restarting');
  
  sessionStorage.setItem('gameRestart', 'true');
  
  location.reload();
}

function triggerShockwave() {
  // check
  if (gameState !== 'PLAYING' || gameOver) {
    return;
  }
  
  const currentTime = Date.now();
  const timeSinceLastUse = currentTime - shockwaveLastUsed;
  
  // Check cooldown
  if (timeSinceLastUse < SHOCKWAVE_COOLDOWN) {
    const remainingTime = Math.ceil((SHOCKWAVE_COOLDOWN - timeSinceLastUse) / 1000);
    return;
  }
  
  // create the shockwave effect from the ship position
  const shockwaveOptions = {
    maxRadius: 400,        // maximum radius of the shockwave
    duration: 1,          // time in seconds for the shockwave to reach max radius
    force: 600,            // force applied to asteroids
    color: new THREE.Color(0x00aaff)
  };
  
  shockwaveSystem.createShockwave(ship.position.clone(), shockwaveOptions);

  // Aggiorna il timestamp dell'ultimo utilizzo
  shockwaveLastUsed = currentTime;
}

function getShockwaveCooldownRemaining() {
  const currentTime = Date.now();
  const timeSinceLastUse = currentTime - shockwaveLastUsed;
  const remaining = Math.max(0, SHOCKWAVE_COOLDOWN - timeSinceLastUse);
  return Math.ceil(remaining / 1000); // ritorna secondi rimanenti
}

// Funzione per controllare se la shockwave è disponibile
function isShockwaveReady() {
  const currentTime = Date.now();
  return (currentTime - shockwaveLastUsed) >= SHOCKWAVE_COOLDOWN;
}

/**
* Manage the engame end logic, including stopping the game timer and blocking input
*/
function endGame() {
    if (gameOver) return;
    
    console.log('Game Over!');
    gameOver = true;
    gameState = 'GAME_OVER';
    
    if (timer) {
        timer.stop();
    }
    
    const elapsedTime = timer.startTime ? (performance.now() - timer.startTime) / 1000 : 0;
    console.log('Calculated elapsed time:', elapsedTime-1);
    
    gameHUD.showGameOver(score, elapsedTime-1, restartGame);
    
    window.removeEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.removeEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
}


function animate(time) {
  requestAnimationFrame(animate);
  if (!gameInitialized) return;


  //render basic item in order to have a start screen inside the ship
  if (gameState === 'START') {
    if (ship && starfield) {
      starfield.position.copy(camera.position);
      starfield.rotation.y += 0.0001;
      
      updateDynamicLighting();
      
      renderer.render(scene, camera);
    }
    return;
  }
  if (!ship) return;
  if (gameOver) return;
  if (gameState !== 'PLAYING') return;

  const delta = (time - (animate.prevTime || time)) / 1400;
  animate.prevTime = time;

  const timeElapsed = performance.now() / 1000; 
  updateExplosions(delta);
  

  //manage the storms, checking if the ship is in a storm and slowing it down
  if (stormManager) {
    stormManager.update(delta, timeElapsed);

    const inStorm = stormManager.isShipInStorm();
    shipController.setSpeedMultiplier(inStorm ? 0.85 : 1.0);
  }
  
  if (shockwaveSystem) {
    shockwaveSystem.update(delta, activeAsteroids);
  }

  shipController.update(delta);

  if (thrusterL && thrusterR) {
   
    const velocity = shipController.getVelocity(); 
    const boostActive = shipController.GetIsBoostActive(); 
  
    thrusterL.setBoostMode(boostActive);
    thrusterR.setBoostMode(boostActive);

    thrusterL.setDirection(velocity);
    thrusterR.setDirection(velocity);

    thrusterL.update(delta);
    thrusterR.update(delta);
  }

  cameraController.update(delta);

  updateDynamicLighting();
  updateMarsBackground(mars, camera);

  if (starfield) {
    starfield.position.copy(camera.position);
    starfield.rotation.y += 0.0001;
  }

  if (animate.mixers) {
    animate.mixers.forEach((m) => m.update(delta));
  }

  ship.getWorldDirection(playerDirection);

  updateAsteroidField(ship.position, playerDirection, scene, asteroidModels, dropRates, delta);

  updateOptimizedSpawn(
        scene,
        ship.position,
        playerDirection,
        delta
    );

  updateAnimations(delta); //for the astronaut model animation

  //variabls used for the energy bar flow
  const boostTimeUsed = shipController.GetBoostTimeUsed();
  const boostDuration = shipController.getBoostDuration();
  const boostTimer = shipController.getBoostTimer();
  const boostCooldown = shipController.getBoostCooldown();
  const isBoostActive = shipController.GetIsBoostActive();
  const boostState = shipController.getBoostState();

  gameHUD.updateEnergyBar(boostTimeUsed, boostDuration, boostTimer, boostCooldown, isBoostActive, boostState);
  gameHUD.updateShockwaveBar(isShockwaveReady(), getShockwaveCooldownRemaining());

  const collidedAstronauts = collisionSystem.checkShipAstronautCollisions(ship, activeAstronauts);
    
  collidedAstronauts.forEach(astronaut => {
       
        const collisionPoint = new THREE.Vector3().addVectors(
            astronaut.position,
            ship.position
        ).multiplyScalar(0.5);
    
        //show popup score +1
        gameHUD.showScorePopup(collisionPoint, camera, renderer);
        //shrink the astronaut model
        collisionSystem.shrinkAstronaut(astronaut, scene, ship);


        console.log(`Collision with astronaut: `, astronaut);
        
        const index = activeAstronauts.indexOf(astronaut);
        if (index > -1) {
           // Remove the astronaut from the active list
            activeAstronauts.splice(index, 1);
        }

        timer.addTime();
        score += 1;
        gameHUD.updateStatus(score);    
  });

  const collidedAsteroids = collisionSystem.checkShipAsteroidCollisions(ship, activeAsteroids);

  if (collidedAsteroids.length > 0) {
      collidedAsteroids.forEach(asteroid => {

       const index = activeAsteroids.indexOf(asteroid);
       //remove asteroid from the active list
          if (index > -1) {
              activeAsteroids.splice(index, 1);
      }
          
        console.log(`Collision with asteroid: `, asteroid);
      });

      //create the explosion effect after the collision
      const shipSize = ship.scale ? ship.scale.x : 1.0;
      //inizialize the explosion system that creates the explosion effect
      createShipExplosion(scene, camera, ship.position.clone(), ship, shipSize);
      setExplosionGameEnded(true);
      
      //lock the camera
      cameraController.enabled = false;

      //leave time for the explosion effect to play
      setTimeout(() => {
        endGame();
      }, 2500);  
  }

  const secondsLeft = timer.getRemainingTime();
  gameHUD.updateTimer(secondsLeft);

  if (timer.isExpired()) {
    endGame(); 
  }
  
  renderer.render(scene, camera);
}

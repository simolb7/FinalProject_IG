import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';

let minScale, maxScale;
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


// Funzione per creare stazioni spaziali
export function createSpaceStation(scene, position = new THREE.Vector3(0, 0, 100)) {
  const stationGroup = new THREE.Group();
  
  // Corpo centrale
  const centralGeometry = new THREE.CylinderGeometry(8, 8, 20, 8);
  const centralMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
  const centralHub = new THREE.Mesh(centralGeometry, centralMaterial);
  stationGroup.add(centralHub);
  
  // Anelli rotanti
  for (let i = 0; i < 3; i++) {
    const ringGeometry = new THREE.TorusGeometry(15 + i * 5, 2, 8, 16);
    const ringMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = (i - 1) * 8;
    stationGroup.add(ring);
  }
  
  // Antenne
  for (let i = 0; i < 4; i++) {
    const antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 15, 4);
    const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    
    const angle = (i / 4) * Math.PI * 2;
    antenna.position.set(
      Math.cos(angle) * 12,
      Math.random() * 10 - 5,
      Math.sin(angle) * 12
    );
    antenna.rotation.z = angle;
    
    stationGroup.add(antenna);
  }
  
  stationGroup.position.copy(position);
  scene.add(stationGroup);
  
  // Animazione rotazione
  function animateStation() {
    stationGroup.rotation.y += 0.005;
    stationGroup.children.forEach((child, index) => {
      if (child.geometry instanceof THREE.TorusGeometry) {
        child.rotation.x += 0.01 * (index + 1);
      }
    });
    requestAnimationFrame(animateStation);
  }
  animateStation();
  
  console.log('Stazione spaziale creata');
  return stationGroup;
}


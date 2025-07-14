import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { loadSpaceBackground } from './loader.js'; // percorso relativo


export async function createStarfield(scene) {
  try {
    // Prova a caricare la CubeTexture
    const spaceTexture = await loadSpaceBackground();
    return createCubeTextureStarfield(scene, spaceTexture);
  } catch (error) {
    console.log('Errore caricamento texture:', error);
    // Fallback: campo stellare procedurale
    return createProceduralStarfield(scene);
  }
}

function createCubeTextureStarfield(scene, spaceTexture) {
  // Crea skybox mobile usando la CubeTexture direttamente
  const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
  
  // Usa ShaderMaterial per applicare la CubeTexture
  const skyboxMaterial = new THREE.ShaderMaterial({
    uniforms: {
      skybox: { value: spaceTexture }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform samplerCube skybox;
      varying vec3 vWorldPosition;
      void main() {
        vec3 direction = normalize(vWorldPosition - cameraPosition);
        gl_FragColor = textureCube(skybox, direction);
      }
    `,
    side: THREE.BackSide
  });
  
  const starfield = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
  scene.add(starfield);
  
  console.log('Skybox CubeTexture con shader caricata');
  return starfield;
}

function createProceduralStarfield(scene) {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2000;
  
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  
  for (let i = 0; i < starCount; i++) {
    // Posizioni casuali in una sfera
    const radius = 400 + Math.random() * 100;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    
    // Colori casuali (bianco-bluastro)
    const brightness = 0.5 + Math.random() * 0.5;
    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness;
    colors[i * 3 + 2] = brightness + Math.random() * 0.2;
  }
  
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const starMaterial = new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });
  
  const starfield = new THREE.Points(starGeometry, starMaterial);
  scene.add(starfield);
  
  console.log('Campo stellare procedurale creato');
  return starfield;
}

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { loadSpaceBackground } from './loader.js'; 


export async function createStarfield(scene) {
  
  const spaceTexture = await loadSpaceBackground();
  return createCubeTextureStarfield(scene, spaceTexture);
  
}

function createCubeTextureStarfield(scene, spaceTexture) {
  const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);

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

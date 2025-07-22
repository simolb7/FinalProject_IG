import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { loadSpaceBackground } from './loader.js'; 

/**
 * Creates a starfield environment using a cube texture as skybox.
 * This function loads a space background texture and applies it to a cube geometry
 * using custom shaders to create an immersive starfield effect.
 * 
 * @param {THREE.Scene} scene - The Three.js scene to add the starfield to
 * @returns {Promise<THREE.Mesh>} A promise that resolves to the starfield mesh
 */
export async function createStarfield(scene) {
  
  const spaceTexture = await loadSpaceBackground();
  return createCubeTextureStarfield(scene, spaceTexture);
  
}
/**
 * Creates a cube texture starfield using custom shaders.
 * This function generates a large cube geometry that surrounds the scene and applies
 * a cube texture using custom vertex and fragment shaders. The cube faces inward
 * (BackSide) to create a skybox effect where the texture is visible from inside.
 * 
 * @param {THREE.Scene} scene - The Three.js scene to add the starfield to
 * @param {THREE.CubeTexture} spaceTexture - The cube texture containing the space background
 * @returns {THREE.Mesh} The starfield mesh object
 */
function createCubeTextureStarfield(scene, spaceTexture) {
  const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);

  const skyboxMaterial = new THREE.ShaderMaterial({
    uniforms: {
      skybox: { value: spaceTexture }
    },
    
    //calculate the final position of the vertex on the screen
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    //apply texture , vWorldPosition is the interpolated position of the vertex shader
    fragmentShader: `
      uniform samplerCube skybox;
      varying vec3 vWorldPosition;
      void main() {
        vec3 direction = normalize(vWorldPosition - cameraPosition);
        gl_FragColor = textureCube(skybox, direction);
      }
    `,
    side: THREE.BackSide  //we are inside the cube
  }); 
  
  const starfield = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
  scene.add(starfield);
  
  console.log('Skybox CubeTexture con shader caricata');
  return starfield;
}

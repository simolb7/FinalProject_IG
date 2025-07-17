import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export function loadSpaceBackground() {
  const loader = new THREE.CubeTextureLoader();
  const path = '../../assets/models/texture/space/';
  const files = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];

  return new Promise((resolve, reject) => {
    loader.load(files.map(f => path + f), resolve, undefined, reject);
  });
}

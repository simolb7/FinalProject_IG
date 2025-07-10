import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class CameraController {
  constructor(camera, ship) {
    this.camera = camera;
    this.ship = ship;
    
    // Posizione attuale della camera (per interpolazione fluida)
    this.cameraPosition = new THREE.Vector3();
    
    // Parametri camera third-person
    this.offset = new THREE.Vector3(0, 15, -45); // Offset dalla navicella
    this.lookAheadDistance = new THREE.Vector3(0, 5, 15); // Dove guardare rispetto alla navicella
    this.followSpeed = 0.08; // Velocità di interpolazione (0-1, più basso = più fluido)
    
    // Inizializza posizione camera
    if (this.ship) {
      this.cameraPosition.copy(this.ship.position);
    }
  }

  update(delta) {
    if (!this.ship) return;

    this.updateThirdPersonCamera();
  }

  updateThirdPersonCamera() {
    // Calcola posizione ideale della camera basata sulla rotazione della navicella
    const idealOffset = this.offset.clone()
      .applyQuaternion(this.ship.quaternion)
      .add(this.ship.position);

    // Interpolazione fluida verso la posizione ideale
    this.cameraPosition.lerp(idealOffset, this.followSpeed);
    this.camera.position.copy(this.cameraPosition);

    // Calcola punto dove guardare (davanti alla navicella)
    const lookAtTarget = this.lookAheadDistance.clone()
      .applyQuaternion(this.ship.quaternion)
      .add(this.ship.position);

    this.camera.lookAt(lookAtTarget);
  }

  // Metodi per cambiare modalità camera
  setFirstPersonView() {
    // Camera in prima persona (dentro la cockpit)
    this.offset.set(0, 2, 5);
    this.lookAheadDistance.set(0, 0, 50);
    this.followSpeed = 0.3;
  }

  setThirdPersonView() {
    // Camera in terza persona (dietro la navicella)
    this.offset.set(0, 15, -45);
    this.lookAheadDistance.set(0, 5, 15);
    this.followSpeed = 0.08;
  }

  setCinematicView() {
    // Vista cinematica (più distante e fluida)
    this.offset.set(0, 25, -60);
    this.lookAheadDistance.set(0, 0, 30);
    this.followSpeed = 0.05;
  }

  setTopDownView() {
    // Vista dall'alto
    this.offset.set(0, 80, 0);
    this.lookAheadDistance.set(0, 0, 0);
    this.followSpeed = 0.1;
  }

  // Getter per accedere ai parametri
  getPosition() {
    return this.camera.position;
  }

  getOffset() {
    return this.offset;
  }

  getLookAheadDistance() {
    return this.lookAheadDistance;
  }

  getFollowSpeed() {
    return this.followSpeed;
  }

  // Setter per modificare i parametri durante il runtime
  setOffset(x, y, z) {
    this.offset.set(x, y, z);
  }

  setLookAheadDistance(x, y, z) {
    this.lookAheadDistance.set(x, y, z);
  }

  setFollowSpeed(speed) {
    this.followSpeed = THREE.MathUtils.clamp(speed, 0.01, 1.0);
  }

  // Metodi per animazioni camera speciali
  shake(intensity = 1, duration = 1000) {
    // Implementa screen shake per esplosioni, impatti, etc.
    const startTime = Date.now();
    const originalOffset = this.offset.clone();
    
    const shakeEffect = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        this.offset.copy(originalOffset);
        return;
      }
      
      const progress = elapsed / duration;
      const currentIntensity = intensity * (1 - progress);
      
      this.offset.copy(originalOffset).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * currentIntensity,
          (Math.random() - 0.5) * currentIntensity,
          (Math.random() - 0.5) * currentIntensity
        )
      );
      
      requestAnimationFrame(shakeEffect);
    };
    
    shakeEffect();
  }
}
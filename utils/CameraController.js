import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class CameraController {
  constructor(camera, ship) {
    this.camera = camera;
    this.ship = ship;
    this.enabled = true;
    
    this.cameraPosition = new THREE.Vector3();
    
    this.offset = new THREE.Vector3(0, 15, -45); 
    this.lookAheadDistance = new THREE.Vector3(0, 5, 15); 
    this.followSpeed = 0.08; 
    

    if (this.ship) {
      this.cameraPosition.copy(this.ship.position);
    }
  }

  update(delta) {
    if (!this.ship) return;
    if (!this.enabled) return;

    this.updateThirdPersonCamera();
  }

  updateThirdPersonCamera() {
    if (!this.enabled) return;
    const idealOffset = this.offset.clone()
      .applyQuaternion(this.ship.quaternion)
      .add(this.ship.position);

    this.cameraPosition.lerp(idealOffset, this.followSpeed);
    this.camera.position.copy(this.cameraPosition);

    const lookAtTarget = this.lookAheadDistance.clone()
      .applyQuaternion(this.ship.quaternion)
      .add(this.ship.position);

    this.camera.lookAt(lookAtTarget);
  }

  setFirstPersonView() {
    this.offset.set(0, 2, 5);
    this.lookAheadDistance.set(0, 0, 50);
    this.followSpeed = 0.3;
  }

  setThirdPersonView() {
    this.offset.set(0, 15, -45);
    this.lookAheadDistance.set(0, 5, 15);
    this.followSpeed = 0.08;
  }

  setCinematicView() {
    this.offset.set(0, 25, -60);
    this.lookAheadDistance.set(0, 0, 30);
    this.followSpeed = 0.05;
  }

  setTopDownView() {
    this.offset.set(0, 80, 0);
    this.lookAheadDistance.set(0, 0, 0);
    this.followSpeed = 0.1;
  }

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

  setOffset(x, y, z) {
    this.offset.set(x, y, z);
  }

  setLookAheadDistance(x, y, z) {
    this.lookAheadDistance.set(x, y, z);
  }

  setFollowSpeed(speed) {
    this.followSpeed = THREE.MathUtils.clamp(speed, 0.01, 1.0);
  }
}
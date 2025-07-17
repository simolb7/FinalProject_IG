import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class ShipController {
  constructor(ship, keys) {
    this.ship = ship;
    this.keys = keys;
    this.speedMultiplier = 1.0;
 
    this.CONSTANT_SPEED = 60; 
    this.TURN_SPEED = 4; 

    this.shipVelocity = new THREE.Vector3();
    this.shipSpeed = 0;
    this.prevPosition = new THREE.Vector3();

    this.BOOST_MULTIPLIER = 3.0;
    this.isBoostActive = false;
    this.boostState = 'ready'; 
    this.boostDuration = 5.0; 
    this.boostCooldown = 3.0; 
    this.boostTimer = 0;
    this.boostTimeUsed = 0;
    this.boostRechargeRate = 1.0; 
    this.boostLockoutDuration = 1.0;
    this.boostLockoutTimer = 0;
    this.isBoostLockedOut = false;
    
  }

  update(delta) {
    if (!this.ship) return;

    this.prevPosition.copy(this.ship.position);
    this.handleBoost(delta);

    const direction = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(this.ship.quaternion)
      .normalize();
    
    const currentSpeed = this.CONSTANT_SPEED * (this.isBoostActive ? this.BOOST_MULTIPLIER : 1);
    this.ship.position.addScaledVector(direction, currentSpeed * this.speedMultiplier * delta);

    this.handleInput(delta);

    const normalizedPower = Math.min(this.shipSpeed / this.CONSTANT_SPEED, 1);

    const lateralInput = (this.keys['a'] || this.keys['arrowleft']) ? -1 :
                        (this.keys['d'] || this.keys['arrowright']) ? 1 : 0;
    const tilt = THREE.MathUtils.degToRad(5 * lateralInput);

    this.shipVelocity = this.ship.position.clone().sub(this.prevPosition);
    this.shipSpeed = this.shipVelocity.length();
  }

  handleInput(delta) {
    const targetRot = new THREE.Euler();
    
    const forward = this.keys['w'] || this.keys['arrowup'];
    const backward = this.keys['s'] || this.keys['arrowdown'];
    const left = this.keys['a'] || this.keys['arrowleft'];
    const right = this.keys['d'] || this.keys['arrowright'];

    if (left) {
      this.ship.rotation.y += this.TURN_SPEED * delta;
      targetRot.z = 0.3;
    }
    if (right) {
      this.ship.rotation.y -= this.TURN_SPEED * delta;
      targetRot.z = -0.3; 
    }
    if (forward) {
      const newPitch = this.ship.rotation.x - this.TURN_SPEED * delta;
      this.ship.rotation.x = newPitch;
    }
    if (backward) {
      const newPitch = this.ship.rotation.x + this.TURN_SPEED * delta;
      this.ship.rotation.x = newPitch;
    }

    if (!forward && !backward) targetRot.x = 0;
    if (!left && !right) targetRot.z = 0;

    const currentRotX = this.ship.rotation.x;
    const currentRotZ = this.ship.rotation.z;
    
    this.ship.rotation.x = THREE.MathUtils.lerp(currentRotX, targetRot.x + currentRotX, 0.1);
    this.ship.rotation.z = THREE.MathUtils.lerp(currentRotZ, targetRot.z, 0.1);
  }

  handleBoost(delta) {
    const shiftPressed = this.keys['shift'] || this.keys['shiftleft'];

    if (this.isBoostLockedOut) {
      this.boostLockoutTimer -= delta;
      if (this.boostLockoutTimer <= 0) {
        this.isBoostLockedOut = false;
        this.boostLockoutTimer = 0;
      }
    }
  
    
    switch (this.boostState) {
      case 'ready':
        if (shiftPressed && this.boostTimeUsed < this.boostDuration) {
          this.boostState = 'active';
          this.isBoostActive = true;
        }
        break;
        
      case 'active':
        if (shiftPressed && this.boostTimeUsed < this.boostDuration) {
          this.boostTimeUsed += delta;
          this.isBoostActive = true;

          if (this.boostTimeUsed >= this.boostDuration) {
                    this.boostState = 'recharging';
                    this.isBoostActive = false;
                    this.isBoostLockedOut = true;
                    this.boostLockoutTimer = this.boostLockoutDuration;
                  }
        } else {
                  this.boostState = 'recharging';
                  this.isBoostActive = false;
        }
        break;
        
      case 'recharging':
        this.isBoostActive = false;
        

        if (this.boostTimeUsed > 0) {
          this.boostTimeUsed -= this.boostRechargeRate * delta;
          this.boostTimeUsed = Math.max(0, this.boostTimeUsed);
        }

        if (shiftPressed && this.boostTimeUsed < this.boostDuration && !this.isBoostLockedOut) {
          this.boostState = 'active';
          this.isBoostActive = true;
        }

        if (this.boostTimeUsed <= 0) {
          this.boostState = 'ready';
          this.boostTimeUsed = 0;
        }
        break;
    }
  }

  getPosition() {
    return this.ship ? this.ship.position : new THREE.Vector3();
  }

  getRotation() {
    return this.ship ? this.ship.rotation : new THREE.Euler();
  }

  getVelocity() {
    return this.shipVelocity;
  }

  getSpeed() {
    return this.shipSpeed;
  }
  
  GetIsBoostActive() {
    return this.isBoostActive;
  }

  GetBoostTimeUsed() {
    return this.boostTimeUsed;
  }

  getConstantSpeed() {
    return this.CONSTANT_SPEED;
  }

  getBoostTimeRemaining() {
    return Math.max(0, this.boostDuration - this.boostTimeUsed);
  }

  setSpeed(speed) {
    this.CONSTANT_SPEED = speed;
  }

  setTurnSpeed(turnSpeed) {
    this.TURN_SPEED = turnSpeed;
  }

  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
  }

  getBoostMultiplier() {
    return this.BOOST_MULTIPLIER;
  }

  setBoostMultiplier(multiplier) {
    this.BOOST_MULTIPLIER = multiplier;
  }

  getBoostState() {
  return this.boostState;
  }

  getBoostTimer() {
    return this.boostTimer;
  }

  getBoostDuration() {
    return this.boostDuration;
  }

  getBoostCooldown() {
    return this.boostCooldown;
  }
}
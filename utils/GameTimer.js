export class GameTimer {
  constructor(durationInSeconds) {
    this.duration = durationInSeconds;
    this.startTime = null;
    this.running = false;
  }

  start() {
    this.startTime = performance.now();
    this.running = true;
  }

  addTime(seconds = 3) {
    this.duration += seconds;
  }

  getRemainingTime() {
    if (!this.running || this.startTime === null) return this.duration;

    const elapsed = (performance.now() - this.startTime) / 1000;
    const remaining = Math.max(0, this.duration - elapsed);
    return Math.floor(remaining);
  }

  getElapsedTime() {
    if (!this.running || this.startTime === null) return 0;
    
    const elapsed = (performance.now() - this.startTime) / 1000;
    return elapsed; // Restituisce il tempo preciso senza arrotondamenti
  }

  isExpired() {
    return this.getRemainingTime() <= 0;
  }

  stop() {
    this.running = false;
  }

  reset() {
    this.startTime = null;
    this.running = false;
  }
}

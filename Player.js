import { moveAndCollide } from './collision.js';

export const PHYSICS = Object.freeze({ speed: 310, acceleration: 2500, gravity: 1800, jump: 760, terminal: 1100 });

export class Player {
  constructor(x = 75, y = 482) {
    this.w = 52;
    this.h = 68;
    this.reset(x, y);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.facing = 1;
    this.distance = 0;
    this.landing = 0;
    this.jumpBuffer = 0;
    this.grip = 0;
    this.braking = false;
  }

  update(dt, input, solids) {
    const axis = input.axis;
    this.braking = Boolean(input.brake || input.held?.('brake'));
    const target = this.braking ? 0 : axis * PHYSICS.speed;
    const delta = PHYSICS.acceleration * (1 + this.grip * 0.18) * (this.braking ? 2.6 : 1) * dt;
    this.vx += Math.max(-delta, Math.min(delta, target - this.vx));
    if (axis) this.facing = axis;
    if (input.consumeJump()) this.jumpBuffer = 0.12;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    // Buffer a recent press, but ALWAYS require actual ground support.
    // No coyote jump or air jump: the assignment explicitly forbids it.
    if (this.jumpBuffer > 0 && this.grounded) {
      this.vy = -PHYSICS.jump;
      this.grounded = false;
      this.jumpBuffer = 0;
    }
    this.vy = Math.min(PHYSICS.terminal, this.vy + PHYSICS.gravity * dt);
    const wasGrounded = this.grounded;
    moveAndCollide(this, solids, dt);
    if (!wasGrounded && this.grounded) this.landing = 1;
    this.landing = Math.max(0, this.landing - dt * 6);
    this.distance += Math.abs(this.vx) * dt;
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x + this.w > 1200) { this.x = 1200 - this.w; this.vx = 0; }
  }
}

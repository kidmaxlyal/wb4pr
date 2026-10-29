import { Player } from './Player.js';
import { overlaps } from './collision.js';
import { render } from './renderer.js';

const STEP = 1 / 120;
const STORAGE_KEY = 'courier-last-order-best-v1';
const LEVELS = [
  {
    name: 'Двор № 1', subtitle: 'Клиент просил не звонить. Домофон тоже.',
    platforms: [
      { x: 0, y: 550, w: 250, h: 90 }, { x: 315, y: 465, w: 180, h: 25 },
      { x: 555, y: 395, w: 180, h: 25 }, { x: 790, y: 465, w: 160, h: 25 },
      { x: 1010, y: 550, w: 190, h: 90 },
    ],
    items: [{ x: 390, y: 425 }, { x: 625, y: 355 }, { x: 915, y: 425 }],
    hazards: [{ x: 250, y: 610, w: 760, h: 70 }],
    finish: { x: 1115, y: 438, w: 65, h: 112 }, spawn: { x: 75, y: 482 },
  },
  {
    name: 'Двор № 2 · Обходной путь', subtitle: 'Подъезд наверху слева. Сначала направо, потом назад — навигатор уверен.',
    platforms: [
      { x: 0, y: 550, w: 260, h: 90 }, { x: 320, y: 465, w: 190, h: 25 },
      { x: 575, y: 390, w: 200, h: 25 }, { x: 835, y: 290, w: 200, h: 25 },
      { x: 575, y: 190, w: 200, h: 25 },
    ],
    items: [{ x: 400, y: 425 }, { x: 650, y: 350 }, { x: 930, y: 250 }],
    hazards: [{ x: 260, y: 610, w: 940, h: 70 }],
    finish: { x: 590, y: 78, w: 65, h: 112 }, spawn: { x: 65, y: 482 },
  },
  {
    name: 'Двор № 3 · Последняя миля', subtitle: 'Узкие опоры, длинная смена. Перед посадкой можно отпустить газ.',
    platforms: [
      { x: 0, y: 550, w: 170, h: 90 }, { x: 230, y: 465, w: 120, h: 25 },
      { x: 420, y: 380, w: 130, h: 25 }, { x: 620, y: 465, w: 100, h: 25 },
      { x: 790, y: 370, w: 115, h: 25 }, { x: 950, y: 460, w: 90, h: 25 },
      { x: 1090, y: 550, w: 110, h: 90 },
    ],
    items: [{ x: 270, y: 425 }, { x: 650, y: 425 }, { x: 980, y: 420 }],
    hazards: [{ x: 170, y: 610, w: 920, h: 70 }],
    finish: { x: 1120, y: 438, w: 65, h: 112 }, spawn: { x: 45, y: 482 },
  },
];

export class Game {
  constructor(canvas, input, onState = () => {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.onState = onState;
    this.status = 'ready';
    this.score = 0;
    this.best = 0;
    this.storageAvailable = true;
    try { this.best = Math.max(0, Math.min(LEVELS.reduce((sum, level) => sum + level.items.length, 0), Number(localStorage.getItem(STORAGE_KEY)) || 0)); }
    catch { this.storageAvailable = false; }
    this.levelIndex = 0;
    this.elapsed = 0;
    this.frame = null;
    this.lastTime = null;
    this.accumulator = 0;
    this.tick = this.tick.bind(this);
    this.loadLevel();
    this.visibilityHandler = () => {
      if (document.hidden && this.status === 'running') this.pause('Вкладка скрыта. Заказ подождёт.');
      if (document.hidden) this.input.clear();
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.message = 'Три посылки. Один подъезд. Ни одной ровной дороги.';
    this.notify();
    this.draw();
  }

  loadLevel() {
    const source = LEVELS[this.levelIndex];
    this.level = {
      ...source,
      platforms: source.platforms.map(platform => ({ ...platform })),
      items: source.items.map(item => ({ ...item, w: 28, h: 28, collected: false })),
      hazards: source.hazards.map(hazard => ({ ...hazard })),
      finish: { ...source.finish },
    };
    this.player = new Player(source.spawn.x, source.spawn.y);
    this.player.grounded = true;
    this.input.clear();
  }

  notify() {
    this.onState({
      status: this.status, score: this.score, best: this.best, message: this.message,
      level: this.levelIndex + 1, totalLevels: LEVELS.length,
      collected: this.level.items.filter(item => item.collected).length,
      totalItems: this.level.items.length, storageAvailable: this.storageAvailable,
    });
  }

  start() {
    if (this.status === 'running') return;
    if (this.status === 'won' || this.status === 'lost') { this.restart(); return; }
    if (this.status === 'level-complete') { this.levelIndex += 1; this.loadLevel(); }
    this.status = 'running';
    this.input.clear();
    this.input.active = true;
    this.message = this.level.subtitle;
    this.lastTime = null;
    this.accumulator = 0;
    this.notify();
    this.schedule();
  }

  schedule() {
    if (this.frame === null && this.status === 'running') this.frame = requestAnimationFrame(this.tick);
  }

  stopLoop() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.lastTime = null;
    this.accumulator = 0;
    this.input.active = false;
    this.input.clear();
  }

  pause(message = 'Перерыв без оплаты. Можно выдохнуть.') {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this.message = message;
    this.stopLoop();
    this.notify();
    this.draw();
  }

  togglePause() {
    if (this.status === 'running') this.pause();
    else if (this.status === 'paused') this.start();
  }

  restart() {
    this.stopLoop();
    this.score = 0;
    this.levelIndex = 0;
    this.elapsed = 0;
    this.loadLevel();
    this.status = 'ready';
    this.start();
    this.draw();
  }

  updateBest() {
    if (this.score <= this.best) return;
    this.best = this.score;
    try { localStorage.setItem(STORAGE_KEY, String(this.best)); }
    catch { this.storageAvailable = false; }
  }

  finishState(status, message) {
    this.status = status;
    this.message = message;
    this.stopLoop();
    this.updateBest();
    this.notify();
  }

  update(dt) {
    if (this.status !== 'running') return;
    this.elapsed += dt;
    this.player.update(dt, this.input, this.level.platforms);
    if (this.player.y > 650 || this.level.hazards.some(hazard => overlaps(this.player, hazard))) {
      this.finishState('lost', 'Заказ отменён. Асфальт оказался убедительнее.');
      return;
    }
    let changed = false;
    for (const item of this.level.items) {
      if (!item.collected && overlaps(this.player, item)) {
        item.collected = true;
        this.score += 1;
        changed = true;
      }
    }
    if (changed) { this.updateBest(); this.notify(); }
    if (overlaps(this.player, this.level.finish)) {
      if (this.level.items.every(item => item.collected)) {
        if (this.levelIndex + 1 < LEVELS.length) this.finishState('level-complete', 'Доставлено. Диспетчер уже нашёл вам ещё один заказ.');
        else this.finishState('won', 'Все заказы доставлены. Чаевые: «Спасибо, держитесь».');
      } else if (this.message !== 'Сначала заберите все три посылки во дворе.') {
        this.message = 'Сначала заберите все три посылки во дворе.';
        this.notify();
      }
    }
  }

  tick(timestamp) {
    this.frame = null;
    if (this.status !== 'running') return;
    const dt = this.lastTime === null ? 0 : Math.min((timestamp - this.lastTime) / 1000, 0.08);
    this.lastTime = timestamp;
    this.accumulator += Math.max(0, dt);
    while (this.accumulator >= STEP && this.status === 'running') {
      this.accumulator -= STEP;
      this.update(STEP);
    }
    this.draw();
    this.schedule();
  }

  draw() { render(this.ctx, this, this.elapsed); }

  destroy() {
    this.stopLoop();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }
}
